import { INestedBook } from './nestedBook.interface';

export interface IUser {
    email: string;
    password: string;
    isAuthToken: boolean;
    firstname: string;
    lastname: string;
    gender: string;
    dateOfBirth: Date;
    mobileNumber: BigInt;
    address: string;
    city: string;
    state: string;
    profilePhoto: string;
    paidAmount: Number;
    dueCharges: Number;
    resetToken: string;
    resetTokenExpiry: BigInt;
    isActive: Boolean;
    books: INestedBook[];
}
