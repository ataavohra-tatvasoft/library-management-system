
export interface IAdmin {
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
    resetToken: String;
    resetTokenExpiry: BigInt;
    isActive: Boolean;
   
}
