import bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { httpStatusConstant, httpErrorMessageConstant, messageConstant } from '../../constant';
import { Admin } from '../../db/models';
import { authUtils, ejsCompilerUtils, sendMailUtils } from '../../utils';
import { Controller } from '../../interfaces';
import { envConfig } from '../../config';

/**
 * @description Authenticates admin using email/password and returns JWT token (if valid).
 */
const login: Controller = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;

        const admin = await Admin.findOne({
            email,
            isActive: true,
        });
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
        const validAdmindata = {
            email: admin.email,
        };

        // Generate JWT token with extended expiration (24 hours)
        const token = jwt.sign(validAdmindata, envConfig.jwtSecretKey as string, {
            expiresIn: Number(24 * 60 * 60),// 24 hours in seconds
        }); 

        await Admin.updateOne({ email: admin.email }, { isAuthToken: 'true' });

        return res.status(httpStatusConstant.OK).json({
            status: true,
            token,
        });
    } catch (error) {
        throw error;
    }
};

/**
 * @description Validates JWT token and logs out admin.
 */
const logout: Controller = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Validate authorization header and extract token
        const { token } = await authUtils.validateAuthorizationHeader(req.headers);

        // Verify the JWT token
        const verifiedToken = await authUtils.verifyJwtToken(token);

        // Update admin's token status (optional) - consider separate function
        await Admin.updateOne({ email: verifiedToken.email }, { isAuthToken: 'false' });

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

        const hashedPassword = await bcrypt.hash(password, 10);

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
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
};
