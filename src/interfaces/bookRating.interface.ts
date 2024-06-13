import { Schema } from "mongoose";

export interface IBookRating {
    bookID: Schema.Types.ObjectId; // Reference to the Book document
    userID: Schema.Types.ObjectId; // Reference to the User document
    rating: number; // Rating value (1-5)
    createdAt: Date; // Date and time of the review creation
  }