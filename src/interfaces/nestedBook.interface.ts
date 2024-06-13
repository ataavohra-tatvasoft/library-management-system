import { Schema } from "mongoose";

export interface INestedBook {
    bookId: Schema.Types.ObjectId;
    issueDate: Date;
}