import { Model, Schema, model } from 'mongoose';
import { IBookHistory } from '../../interfaces';

type BookHistoryModel = Model<IBookHistory>;
const bookHistorySchema: Schema = new Schema<IBookHistory, BookHistoryModel>({
    bookID: {
        type: Schema.Types.ObjectId,
        ref: 'books', // Reference to the Book model
        required: true,
    },
    userID: {
        type: Schema.Types.ObjectId,
        ref: 'users', // Reference to the Book model
        required: true,
    },
    issueDate: {
        type: Date,
        required: true,
    },
    submitDate: {
        type: Date,
        allownull: true,
        default: null,
    },
});

export const BookHistory = model<IBookHistory, BookHistoryModel>('bookhistories', bookHistorySchema);
