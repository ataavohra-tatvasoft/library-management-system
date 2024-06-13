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
    address: String;
    city: String;
    state: String;
    paidAmount: Number;
    dueCharges: Number;
    resetToken: String;
    resetTokenExpiry: BigInt;
    isActive: Boolean;
    books: INestedBook[];
}
