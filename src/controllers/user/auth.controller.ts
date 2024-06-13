import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { httpStatusConstant, httpErrorMessageConstant, messageConstant } from '../../constant';
import { Request, Response, NextFunction } from 'express';
import { User } from '../../db/models';
import { Controller } from '../../interfaces';
import { authUtils, ejsCompilerUtils, helperFunctionsUtils, sendMailUtils } from '../../utils';
import { envConfig } from '../../config';

const SALT_ROUNDS: number = 10;

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
        const validUserdata = {
            email: user.email,
        };

        // Generate JWT token with extended expiration (24 hours)
        const token = jwt.sign(validUserdata, envConfig.jwtSecretKey as string, {
            expiresIn: Number(24 * 60 * 60),
        }); // 24 hours in seconds

        await User.updateOne({ email: user.email }, { isAuthToken: 'true' });

        return res.status(httpStatusConstant.OK).json({
            status: true,
            token,
        });
    } catch (error) {
        throw error;
    }
};

/**
 * @description Validates JWT token and logs out user.
 */
const logout: Controller = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Validate authorization header and extract token
        const { token } = await authUtils.validateAuthorizationHeader(req.headers);

        // Verify the JWT token
        const verifiedToken = await authUtils.verifyJwtToken(token);

        await User.updateOne({ email: verifiedToken.email }, { isAuthToken: 'false' });

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

        const hashedPassword = await bcrypt.hash(password, 10);

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
        const hashed_password: String = await bcrypt.hash(password, SALT_ROUNDS);
        const ageLimit = helperFunctionsUtils.validateAgeLimit(dateOfBirth);

        if (ageLimit) {
            const signupStatus = await User.create({
                email,
                password: hashed_password,
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
    logout,
    forgotPassword,
    resetPassword,
    signup,
    updateProfile,
};
