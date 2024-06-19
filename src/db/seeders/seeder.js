import mongoose from 'mongoose';
import { hash } from 'bcrypt';
import { User, Book, BookGallery, BookRating, BookReview, BookHistory, Admin } from '../models';
import { messageConstant } from '../../constant';
import { loggerUtils, helperFunctionsUtils } from '../../utils';
import { envConfig } from '../../config';

const SALT_ROUNDS = 10;

const seedData = async () => {
    try {
        const conn = await mongoose.connect(String(envConfig.dbURL), {
            autoIndex: true,
            connectTimeoutMS: 100000,
            socketTimeoutMS: 100000,
            serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
        });

        loggerUtils.logger.info(`${messageConstant.DB_CONNECTED}`);
        loggerUtils.logger.info(`Host: ${conn.connection.host}`);

        /**Admins */

        // Clear existing admins
        await Admin.deleteMany({});
        loggerUtils.logger.info('Deleted all users!');

        const admins = [
            {
                email: 'admin@yopmail.com',
                password: await hash('Password@789', SALT_ROUNDS),
                isAuthToken: 'false',
                firstname: 'Dummy',
                lastname: 'Dummy',
                gender: 'male',
                dateOfBirth: new Date('2011-01-01'),
                mobileNumber: Number('8542103572'),
                address: 'Demo_Address',
                city: 'Demo_City',
                state: 'Demo_State',
                paidAmount: Number('0'),
            },
        ];

        // Insert admins in bulk for efficiency
        const insertedAdmins = await Admin.insertMany(admins);
        loggerUtils.logger.info('Inserted new admins!');

        /**Users */

        // Clear existing users
        await User.deleteMany({});
        loggerUtils.logger.info('Deleted all users!');

        const users = [
            {
                email: 'user@yopmail.com',
                password: await hash('Password@789', SALT_ROUNDS),
                isAuthToken: 'false',
                firstname: 'Dummy_2',
                lastname: 'Dummy_2',
                gender: 'female',
                dateOfBirth: new Date('2008-01-01'),
                mobileNumber: Number('8642204572'),
                address: 'Demo_Address_1',
                city: 'Demo_City_1',
                state: 'Demo_State_1',
                paidAmount: Number('0'),
            },
        ];

        // Insert users in bulk for efficiency
        const insertedUsers = await User.insertMany(users);
        loggerUtils.logger.info('Inserted new users!');

        /**Books */

        // Clear existing books
        await Book.deleteMany({});
        loggerUtils.logger.info('Deleted all books!');

        const books = [
            {
                bookID: helperFunctionsUtils.generatePlaceholderbookID(),
                name: 'Book 1',
                author: 'Author 1',
                charges: 120,
                issueCount: 100,
                submitCount: 90,
                publishedDate: new Date('2024-02-07'),
                quantityAvailable: 12,
                numberOfFreeDays: 3,
                description: 'This is the description of the Book 1',
            },
            {
                bookID: helperFunctionsUtils.generatePlaceholderbookID(),
                name: 'Book 2',
                author: 'Author 2',
                charges: 150,
                issueCount: 90,
                submitCount: 80,
                publishedDate: new Date('2024-03-17'),
                quantityAvailable: 20,
                numberOfFreeDays: 5,
                description: 'This is the description of the Book 2',
            },
            {
                bookID: helperFunctionsUtils.generatePlaceholderbookID(),
                name: 'Book 3',
                author: 'Author 3',
                charges: 160,
                issueCount: 80,
                submitCount: 70,
                publishedDate: new Date('2024-05-21'),
                quantityAvailable: 22,
                numberOfFreeDays: 7,
                description: 'This is the description of the Book 3',
            },
            {
                bookID: helperFunctionsUtils.generatePlaceholderbookID(),
                name: 'Book 4',
                author: 'Author 4',
                charges: 140,
                issueCount: 70,
                submitCount: 60,
                publishedDate: new Date('2024-04-20'),
                quantityAvailable: 30,
                numberOfFreeDays: 9,
                description: 'This is the description of the Book 4',
            },
            {
                bookID: helperFunctionsUtils.generatePlaceholderbookID(),
                name: 'Book 5',
                author: 'Author 5',
                charges: 145,
                issueCount: 40,
                submitCount: 30,
                publishedDate: new Date('2024-04-20'),
                quantityAvailable: 30,
                numberOfFreeDays: 9,
                description: 'This is the description of the Book 5',
            },
            {
                bookID: helperFunctionsUtils.generatePlaceholderbookID(),
                name: 'Book 6',
                author: 'Author 6',
                charges: 155,
                issueCount: 45,
                submitCount: 35,
                publishedDate: new Date('2024-04-20'),
                quantityAvailable: 30,
                numberOfFreeDays: 9,
                description: 'This is the description of the Book 6',
            },
        ];

        // Insert books in bulk for efficiency
        const insertedBooks = await Book.insertMany(books);
        loggerUtils.logger.info('Inserted new books!');

        /** BookGallery */

        // Clear existing book gallery entries
        await BookGallery.deleteMany({});
        loggerUtils.logger.info('Deleted all book gallery entries!');

        const bookGalleryEntries = [
            {
                bookID: insertedBooks[0]._id,
                imagePath: '../../public/images/book1.jpg',
                imageName: 'coverImage',
            },
            {
                bookID: insertedBooks[0]._id,
                imagePath: '../../public/images/book1_new.jpg',
                imageName: 'demo',
            },
            {
                bookID: insertedBooks[1]._id,
                imagePath: '../../public/images/book2.jpg',
                imageName: 'coverImage',
            },
            {
                bookID: insertedBooks[2]._id,
                imagePath: '../../public/images/book3.jpg',
                imageName: 'coverImage',
            },
            {
                bookID: insertedBooks[3]._id,
                imagePath: '../../public/images/book4.jpg',
                imageName: 'coverImage',
            },
        ];

        // Insert book gallery entries in bulk for efficiency
        await BookGallery.insertMany(bookGalleryEntries);
        loggerUtils.logger.info('Inserted new book gallery entries!');

        /** Ratings */

        // Clear existing ratings
        await BookRating.deleteMany({});
        loggerUtils.logger.info('Deleted all ratings!');

        const ratings = [
            {
                bookID: insertedBooks[0]._id,
                userID: insertedUsers[0]._id,
                rating: 5,
            },
            {
                bookID: insertedBooks[0]._id,
                userID: insertedAdmins[0]._id,
                rating: 3,
            },
            {
                bookID: insertedBooks[1]._id,
                userID: insertedAdmins[0]._id,
                rating: 4,
            },
            {
                bookID: insertedBooks[2]._id,
                userID: insertedUsers[0]._id,
                rating: 3,
            },
            {
                bookID: insertedBooks[3]._id,
                userID: insertedAdmins[0]._id,
                rating: 4,
            },
        ];

        // Insert ratings in bulk for efficiency
        await BookRating.insertMany(ratings);
        loggerUtils.logger.info('Inserted new ratings!');

        /** Reviews */

        // Clear existing reviews
        await BookReview.deleteMany({});
        loggerUtils.logger.info('Deleted all reviews!');

        const reviews = [
            {
                bookID: insertedBooks[0]._id,
                userID: insertedUsers[0]._id,
                review: 'Amazing book with great insights.',
            },
            {
                bookID: insertedBooks[1]._id,
                userID: insertedAdmins[0]._id,
                review: 'Very informative and well-written.',
            },
            {
                bookID: insertedBooks[2]._id,
                userID: insertedUsers[0]._id,
                review: 'Good book, but could be better.',
            },
            {
                bookID: insertedBooks[3]._id,
                userID: insertedAdmins[0]._id,
                review: 'Interesting read, highly recommended!',
            },
        ];

        // Insert reviews in bulk for efficiency
        await BookReview.insertMany(reviews);
        loggerUtils.logger.info('Inserted new reviews!');

        await BookHistory.deleteMany();
        loggerUtils.logger.info('Deleted previous book history!');

        // eslint-disable-next-line no-undef
        process.exit(0);
    } catch (error) {
        loggerUtils.logger.error('Error seeding data:', error);
        // eslint-disable-next-line no-undef
        process.exit(1);
    }
};

seedData();
