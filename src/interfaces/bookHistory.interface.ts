import { Schema } from "mongoose";

export interface IBookHistory {
    bookID: Schema.Types.ObjectId; // Reference to the Book document
    userID: Schema.Types.ObjectId; // Reference to the User document
    issueDate: Date; // Rating value (1-5)
    submitDate: Date; // Date and time of the review creation
    isDeleted: boolean;
    deletedAt: Date;
  }