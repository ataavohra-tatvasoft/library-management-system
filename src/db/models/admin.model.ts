import { Model, model, Schema } from 'mongoose';
import { IAdmin } from '../../interfaces';

type AdminModel = Model<IAdmin>;

const adminSchema: Schema = new Schema<IAdmin, AdminModel>({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false, allownull: true },
    isAuthToken: {
        type: Boolean,
        allownull: false,
        default: false,
    },
    firstname: { type: String },
    lastname: { type: String },
    gender: { type: String, enum: ['male', 'female'] },
    dateOfBirth: {
        type: Date,
    },
    mobileNumber: {
        type: BigInt,
        allownull: false,
    },
    address: {
        type: String,
        allownull: true,
    },
    city: {
        type: String,
        allownull: true,
    },
    state: {
        type: String,
        allownull: true,
    },
    resetToken: {
        type: String,
        allownull: true,
    },
    resetTokenExpiry: {
        type: BigInt,
        allownull: true,
    },
    refreshToken: {
        type: String,
        allownull: true,
    },
    isActive: {
        type: Boolean,
        allownull: false,
        default: true,
    },
});

export const Admin: AdminModel = model<IAdmin, AdminModel>('admins', adminSchema);
