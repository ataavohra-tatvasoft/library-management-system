import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { httpStatusConstant, httpErrorMessageConstant, messageConstant } from '../../constant';
import { User } from '../../db/models';
import { Controller } from '../../interfaces';
import {
    authUtils,
    ejsCompilerUtils,
    helperFunctionsUtils,
    loggerUtils,
    sendMailUtils,
} from '../../utils';
import { envConfig } from '../../config';

/**
 * @description Authenticates user and generates JWT token upon successful login.
 */
const login: Controller = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email, isActive: true });
        if (!user) {
            return res.status(httpStatusConstant.NOT_FOUND).json({
                status: false,
                message: messageConstant.USER_NOT_FOUND,
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(httpStatusConstant.UNAUTHORIZED).json({
                status: false,
                message: httpErrorMessageConstant.UNAUTHORIZED,
            });
        }

        // Generate JWT access token with short expiration
        const accessToken = jwt.sign(
            {
                _id: user._id,
                email: user.email,
                tokenType: 'access',
            },
            String(envConfig.jwtSecretKey),
            {
                expiresIn: String(envConfig.accessTokenExpiresIn),
            }
        );

        // Generate refresh token with longer expiration (store securely on server)
        const refreshToken = jwt.sign(
            {
                _id: user._id,
                email: user.email,
                tokenType: 'refresh',
            },
            String(envConfig.jwtSecretKey),
            {
                expiresIn: String(envConfig.refreshTokenExpiresIn),
            }
        );

        await User.updateOne({ email: user.email }, { refreshToken });

        return res.status(httpStatusConstant.OK).json({
            status: true,
            accessToken,
            refreshToken,
        });
    } catch (error) {
        throw error;
    }
};

/**
 * @description Refreshes user access token upon valid refresh token verification.
 */
const refreshToken: Controller = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Validate authorization header and extract refresh token
        const { token } = await authUtils.validateAuthorizationHeader(req.headers);
        const radisClient = await authUtils.createRedisClient();
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const key = `blocked:refresh:tokens`; // Customize key prefix (access or refresh)
        const isBlocked = await radisClient.sIsMember(key, hashedToken);
        if (isBlocked) {
            return res.status(httpStatusConstant.UNAUTHORIZED).json({
                status: false,
                message: httpErrorMessageConstant.TOKEN_BLACKLISTED,
            });
        }

        // Verify the JWT refresh token
        const verifiedToken = await authUtils.verifyRefreshToken(token);

        if (!(verifiedToken.tokenType == 'refresh')) {
            return res.status(httpStatusConstant.INVALID_TOKEN).json({
                status: false,
                message: messageConstant.INVALID_TOKEN_TYPE,
            });
        }

        // Find admin by user ID from the refresh token payload
        const user = await User.findOne({ email: verifiedToken.email });
        if (!user) {
            return res.status(httpStatusConstant.NOT_FOUND).json({
                status: false,
                message: messageConstant.USER_NOT_FOUND,
            });
        }

        // Generate a new access token with short expiration
        const newAccessToken = jwt.sign(
            {
                _id: user._id,
                email: user.email,
                tokenType: 'access',
            },
            String(envConfig.jwtSecretKey),
            {
                expiresIn: envConfig.accessTokenExpiresIn,
            }
        );

        return res.status(httpStatusConstant.OK).json({
            status: true,
            accessToken: newAccessToken,
        });
    } catch (error: any) {
        loggerUtils.logger.error(error);
        return res.status(httpStatusConstant.INTERNAL_SERVER_ERROR).json({
            message: httpErrorMessageConstant.INTERNAL_SERVER_ERROR,
            error: error.message,
        });
    }
};

/**
 * @description Validates JWT token and logs out user.
 */
const logout: Controller = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { accessToken, refreshToken } = req.body;
        // Verify the JWT token
        await authUtils.verifyAccessToken(accessToken);
        await authUtils.verifyRefreshToken(refreshToken);

        await authUtils.blockToken(accessToken, 'access');
        await authUtils.blockToken(refreshToken, 'refresh');

        return res.status(httpStatusConstant.OK).json({
            status: true,
            message: httpErrorMessageConstant.SUCCESSFUL,
        });
    } catch (error) {
        throw error;
    }
};

/**
 * @description Initiates user password reset by email.
 */
const forgotPassword: Controller = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email, isActive: true });

        if (!user) {
            return res.status(httpStatusConstant.NOT_FOUND).json({
                status: false,
                message: messageConstant.USER_NOT_FOUND,
            });
        }
        const resetToken = crypto.createHash('sha256').update(email).digest('hex');
        const expireTime = Date.now() + 60 * 60 * 1000; // 1 hour

        await User.updateOne({ email }, { resetToken, resetTokenExpiry: expireTime });

        const data = await ejsCompilerUtils.compileEmailTemplate('resetPassword');

        await sendMailUtils.sendEmail({ to: email, subject: 'Reset Password Link', html: data });

        return res.status(httpStatusConstant.OK).json({
            status: true,
            message: httpErrorMessageConstant.SUCCESSFUL,
        });
    } catch (error) {
        throw error;
    }
};

/**
 * @description Resets user password using valid reset token.
 */
const resetPassword: Controller = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { password, resetToken } = req.body;

        const user = await User.findOne({
            resetToken,
            resetTokenExpiry: { $gt: Date.now() },
            isActive: true,
        });

        if (!user) {
            return res.status(httpStatusConstant.NOT_FOUND).json({
                status: false,
                message: messageConstant.USER_NOT_FOUND,
            });
        }

        const salt = await bcrypt.genSalt(Number(envConfig.saltRounds));
        const hashedPassword = await bcrypt.hash(password, salt);

        await User.updateOne(
            { _id: user._id },
            {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null,
            }
        );

        return res.status(httpStatusConstant.OK).json({
            status: true,
            message: httpErrorMessageConstant.SUCCESSFUL,
        });
    } catch (error) {
        throw error;
    }
};

/**
 * @description Registers a new user (validates age and hashes password).
 */
const signup: Controller = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {
            body: {
                email,
                password,
                firstname,
                lastname,
                dateOfBirth,
                mobileNumber,
                address,
                city,
                state,
            },
        } = req;

        // eslint-disable-next-line no-undef
        const salt = await bcrypt.genSalt(Number(envConfig.saltRounds));
        const hashedPassword = password ? await bcrypt.hash(password, salt) : undefined;

        const ageLimit = helperFunctionsUtils.validateAgeLimit(dateOfBirth);

        if (ageLimit) {
            const signupStatus = await User.create({
                email,
                password: hashedPassword,
                firstname,
                lastname,
                dateOfBirth: new Date(dateOfBirth),
                mobileNumber: BigInt(mobileNumber),
                address,
                city,
                state,
            });
            if (!signupStatus) {
                return res.status(httpStatusConstant.BAD_REQUEST).json({
                    status: false,
                    message: messageConstant.ERROR_SIGNING_USER,
                });
            }
        } else {
            return res.status(httpStatusConstant.BAD_REQUEST).json({
                status: false,
                message: messageConstant.INVALID_AGE,
            });
        }
        return res.status(httpStatusConstant.OK).json({
            status: true,
            message: httpErrorMessageConstant.SUCCESSFUL,
        });
    } catch (error) {
        throw error;
    }
};

/**
 * @description Updates user information (optional password update).
 */
const updateProfile: Controller = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = req.params;
        const { password, firstname, lastname, dateOfBirth, mobileNumber, address, city, state } =
            req.body || {};
        const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

        const userProfile = await User.findOne({ email });

        if (!userProfile) {
            return res.status(httpStatusConstant.NOT_FOUND).json({
                status: false,
                message: messageConstant.USER_NOT_FOUND,
            });
        }

        // Prepare update object with filtered and potentially hashed data
        const updateData = {
            ...(hashedPassword && { password: hashedPassword }),
            ...(firstname && { firstname }),
            ...(lastname && { lastname }),
            ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }), // Assuming dateOfBirth is a string
            ...(mobileNumber && { mobileNumber: BigInt(mobileNumber) }), // Assuming mobileNumber is a bigint
            ...(address && { address }),
            ...(city && { city }),
            ...(state && { state }),
        };

        const updatedProfile = await User.findOneAndUpdate({ email }, updateData, { new: true });

        if (!updatedProfile) {
            return res.status(httpStatusConstant.INTERNAL_SERVER_ERROR).json({
                status: false,
                message: messageConstant.ERROR_UPDATING_PROFILE,
            });
        }

        return res.status(httpStatusConstant.OK).json({
            status: true,
            message: httpErrorMessageConstant.SUCCESSFUL,
        });
    } catch (error) {
        throw error;
    }
};

export default {
    login,
    refreshToken,
    logout,
    forgotPassword,
    resetPassword,
    signup,
    updateProfile,
};
