import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { httpStatusConstant, httpErrorMessageConstant, messageConstant } from '../../constant';
import { Admin } from '../../db/models';
import { authUtils, ejsCompilerUtils, loggerUtils, sendMailUtils } from '../../utils';
import { Controller } from '../../interfaces';
import { envConfig } from '../../config';
import responseHandlerUtils from '../../utils/responseHandler.utils';

/**
 * @description Authenticates admin using email/password and returns JWT token (if valid).
 */
const login: Controller = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;

        const admin = await Admin.findOne({ email, isActive: true });
        if (!admin) {
            return res.status(httpStatusConstant.NOT_FOUND).json({
                status: false,
                message: messageConstant.ADMIN_NOT_FOUND,
            });
        }

        const isPasswordValid = await bcrypt.compare(password, admin.password);
        if (!isPasswordValid) {
            return res.status(httpStatusConstant.UNAUTHORIZED).json({
                status: false,
                message: httpErrorMessageConstant.UNAUTHORIZED,
            });
        }

        // Generate JWT access token with short expiration
        const accessToken = jwt.sign(
            {
                _id: admin._id,
                email: admin.email,
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
                _id: admin._id,
                email: admin.email,
                tokenType: 'refresh',
            },
            String(envConfig.jwtSecretKey),
            {
                expiresIn: String(envConfig.refreshTokenExpiresIn),
            }
        );

        await Admin.updateOne({ email: admin.email }, { refreshToken });

        return await responseHandlerUtils.responseHandler(
            res,
            httpStatusConstant.OK,
            {
                accessToken,
                refreshToken,
            },
            httpErrorMessageConstant.SUCCESSFUL
        );
    } catch (error: any) {
        return await responseHandlerUtils.responseHandler(
            res,
            httpStatusConstant.INTERNAL_SERVER_ERROR,
            null,
            null,
            error
        );
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
            return await responseHandlerUtils.responseHandler(
                res,
                httpStatusConstant.UNAUTHORIZED,
                null,
                httpErrorMessageConstant.TOKEN_BLACKLISTED
            );
        }
        // Verify the JWT refresh token
        const verifiedToken = await authUtils.verifyRefreshToken(token);

        if (!(verifiedToken.tokenType == 'refresh')) {
            return await responseHandlerUtils.responseHandler(
                res,
                httpStatusConstant.INVALID_TOKEN,
                null,
                messageConstant.INVALID_TOKEN_TYPE
            );
        }

        // Find admin by user ID from the refresh token payload
        const admin = await Admin.findOne({ email: verifiedToken.email });
        if (!admin) {
            return await responseHandlerUtils.responseHandler(
                res,
                httpStatusConstant.NOT_FOUND,
                null,
                messageConstant.ADMIN_NOT_FOUND
            );
        }

        // Generate a new access token with short expiration
        const newAccessToken = jwt.sign(
            {
                _id: admin._id,
                email: admin.email,
                tokenType: 'access',
            },
            String(envConfig.jwtSecretKey),
            {
                expiresIn: envConfig.accessTokenExpiresIn,
            }
        );

        return await responseHandlerUtils.responseHandler(
            res,
            httpStatusConstant.OK,
            {
                newAccessToken,
            },
            httpErrorMessageConstant.SUCCESSFUL
        );
    } catch (error: any) {
        return await responseHandlerUtils.responseHandler(
            res,
            httpStatusConstant.INTERNAL_SERVER_ERROR,
            null,
            null,
            error
        );
    }
};

/**
 * @description Validates JWT token and logs out admin.
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
 * @description Initiates admin password reset by email.
 */
const forgotPassword: Controller = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = req.body;

        const admin = await Admin.findOne({ email, isActive: true });

        if (!admin) {
            return res.status(httpStatusConstant.NOT_FOUND).json({
                status: false,
                message: messageConstant.ADMIN_NOT_FOUND,
            });
        }
        const resetToken = crypto.createHash('sha256').update(email).digest('hex');
        const expireTime = Date.now() + 60 * 60 * 1000; // 1 hour

        await Admin.updateOne({ email }, { resetToken, resetTokenExpiry: expireTime });

        const data = await ejsCompilerUtils.compileEmailTemplate('resetPassword');

        await sendMailUtils.sendEmail({
            to: email,
            subject: 'Reset Password Link',
            html: data,
        });

        return res.status(httpStatusConstant.OK).json({
            status: true,
            message: httpErrorMessageConstant.SUCCESSFUL,
        });
    } catch (error) {
        throw error;
    }
};

/**
 * @description Resets admin password using valid reset token.
 */
const resetPassword: Controller = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { password, resetToken } = req.body;

        const admin = await Admin.findOne({
            resetToken,
            resetTokenExpiry: { $gt: Date.now() },
            isActive: true,
        });

        if (!admin) {
            return res.status(httpStatusConstant.NOT_FOUND).json({
                status: false,
                message: messageConstant.ADMIN_NOT_FOUND,
            });
        }

        const salt = await bcrypt.genSalt(Number(envConfig.saltRounds));
        const hashedPassword = await bcrypt.hash(password, salt);

        await Admin.updateOne(
            { _id: admin._id },
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
 * @description Updates admin profile information.
 */
const updateProfile: Controller = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = req.params;
        const { password, firstname, lastname, dateOfBirth, mobileNumber, address, city, state } =
            req.body || {};
        const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

        const adminProfile = await Admin.findOne({ email });

        if (!adminProfile) {
            return res.status(httpStatusConstant.NOT_FOUND).json({
                status: false,
                message: messageConstant.ADMIN_NOT_FOUND,
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

        // Update admin profile and return the updated document
        const updatedProfile = await Admin.findOneAndUpdate({ email }, updateData, { new: true });

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
    updateProfile,
};
