import { Model, model, Schema } from 'mongoose';
import { IBook } from '../../interfaces';

type BookModel = Model<IBook>;
const bookSchema: Schema = new Schema<IBook, BookModel>(
    {
        bookID: {
            type: String,
            unique: true,
            required: true,
            allownull: false,
        },
        name: {
            type: String,
            required: true,
        },
        author: {
            type: String,
            required: true,
        },
        charges: {
            type: Number,
            allownull: false,
        },
        issueCount: {
            type: Number,
            allownull: false,
            default: 0,
        },
        submitCount: {
            type: Number,
            allownull: false,
            default: 0,
        },
        publishedDate: {
            type: Date,
            allownull: true,
            default: null,
        },
        subscriptionDays: {
            type: Number,
            allownull: false,
            default: 0,
            min: 0,
        },
        quantityAvailable: {
            type: Number,
            required: true,
            allownull: false,
            default: 0,
            min: 0,
        },
        numberOfFreeDays: {
            type: Number,
            allownull: true,
            default: null,
        },
        description: {
            type: String,
            allownull: true,
        },
        isActive: {
            type: Boolean,
            allownull: false,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// bookSchema.index({ name: 1, author: 1 }, { unique: true });

export const Book: BookModel = model<IBook, BookModel>('books', bookSchema);
