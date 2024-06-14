import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { User } from '../../db/models';
import { Controller } from '../../interfaces';
import { httpStatusConstant, httpErrorMessageConstant, messageConstant } from '../../constant';
import { helperFunctionsUtils } from '../../utils';
import { envConfig } from '../../config';

/**
 * @description Registers a new user (validates age and hashes password).
 */
const addUser: Controller = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {
            email,
            password,
            firstname,
            lastname,
            dateOfBirth,
            mobileNumber,
            address,
            city,
            state,
        } = req.body;

        const ageLimitValid = helperFunctionsUtils.validateAgeLimit(dateOfBirth);

        if (!ageLimitValid) {
            return res.status(httpStatusConstant.BAD_REQUEST).json({
                status: false,
                message: messageConstant.INVALID_AGE,
            });
        }

        const salt = await bcrypt.genSalt(Number(envConfig.saltRounds));
        const hashedPassword = password ? await bcrypt.hash(password, salt) : undefined;

        const createUserStatus = await User.create({
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

        if (!createUserStatus) {
            return res.status(httpStatusConstant.BAD_REQUEST).json({
                status: false,
                message: messageConstant.ERROR_SIGNING_USER,
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
 * @description Retrieves a list of active users with essential details.
 */
const userList: Controller = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let { page, pageSize } = req.query;

        const pageNumber = Number(page) || 1;
        const limit = Number(pageSize) || 10;

        const skip = (pageNumber - 1) * limit;

        const userData = await User.find(
            { isActive: true },
            {
                _id: 0,
                email: 1,
                firstname: 1,
                lastname: 1,
                gender: 1,
                dateOfBirth: 1,
                // mobileNumber: 1,
                address: 1,
                city: 1,
                state: 1,
                dueCharges: 1,
            }
        )
            .skip(skip)
            .limit(limit);
        if (!userData) {
            return res.status(httpStatusConstant.BAD_REQUEST).json({
                status: false,
                message: messageConstant.ERROR_LISTING_USER,
            });
        }

        const total = await User.countDocuments({
            isActive: true,
        });

        if (!total) {
            return res.status(httpStatusConstant.OK).json({
                status: true,
                message: messageConstant.BOOK_NOT_FOUND,
            });
        }

        const totalPages = Math.ceil(total / limit);

        if (pageNumber > totalPages) {
            return res.status(httpStatusConstant.BAD_REQUEST).json({
                status: false,
                message: messageConstant.INVALID_PAGE_NUMBER,
            });
        }

        return res.status(httpStatusConstant.OK).json({
            status: true,
            userData,
            pagination: {
                page: pageNumber,
                pageSize: limit,
                totalPages,
            },
        });
    } catch (error) {
        throw error;
    }
};

/**
 * @description Updates user information (optional password update).
 */
const updateUser: Controller = async (req: Request, res: Response, next: NextFunction) => {
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

        const updateData = {
            ...(hashedPassword && { password: hashedPassword }),
            ...(firstname && { firstname }),
            ...(lastname && { lastname }),
            ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
            ...(mobileNumber && { mobileNumber: BigInt(mobileNumber) }),
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

/**
 * @description Deactivates a user account (soft delete).
 */
const softDeleteUser: Controller = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = req.params;

        const userExists = await User.findOne({ email, isActive: true });
        if (!userExists) {
            return res.status(httpStatusConstant.BAD_REQUEST).json({
                status: false,
                message: messageConstant.USER_NOT_EXISTS,
            });
        }

        const updatedUser = await User.findOneAndUpdate(
            { email },
            { $set: { isActive: false } },
            { new: true } // Return the updated document
        );

        if (!updatedUser) {
            return res.status(httpStatusConstant.NOT_FOUND).json({
                status: false,
                message: messageConstant.ERROR_DELETING_USER,
            });
        }

        return res.status(httpStatusConstant.OK).json({
            status: true,
            message: messageConstant.USER_DELETED_SOFT,
        });
    } catch (error) {
        throw error;
    }
};

/**
 * @description Permanently removes a user from the system.
 */
const hardDeleteUser: Controller = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = req.params;

        const userExists = await User.findOne({ email });
        if (!userExists) {
            return res.status(httpStatusConstant.BAD_REQUEST).json({
                status: false,
                message: messageConstant.USER_NOT_EXISTS,
            });
        }

        const deletedUser = await User.deleteOne({ email });
        if (!deletedUser) {
            return res.status(httpStatusConstant.NOT_FOUND).json({
                status: false,
                message: messageConstant.ERROR_DELETING_USER,
            });
        }

        return res.status(httpStatusConstant.OK).json({
            status: true,
            message: messageConstant.USER_DELETED_HARD,
        });
    } catch (error) {
        throw error;
    }
};

export default {
    addUser,
    userList,
    updateUser,
    softDeleteUser,
    hardDeleteUser,
};
