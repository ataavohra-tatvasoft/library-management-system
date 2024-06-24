import { Book, BookReview } from '../../db/models';

async function getReviews(
    bookID: number,
    skip: number,
    limit: number
): Promise<{ bookReviews: { username: string; review: any }[]; length: number }> {
    try {
        if (isNaN(bookID)) {
            throw new Error('Invalid book ID format');
        }

        const book = await Book.findOne({ bookID, isDeleted: false });
        if (!book) {
            throw new Error('Book not found!');
        }

        const reviews = await BookReview.find({ bookID: book._id, isDeleted: false })
            .skip(skip)
            .limit(limit)
            .populate({
                path: 'userID',
                select: 'email firstname lastname',
            });

        // Sort reviews by most recent first (descending order on createdAt)
        reviews.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        const bookReviews = reviews.map((reviews: any) => ({
            username: reviews.userID?.firstname + ' ' + reviews.userID?.lastname || 'Anonymous', // Handle potential missing username
            review: reviews.review,
        }));

        return { bookReviews, length: reviews.length };
    } catch (error) {
        throw error;
    }
}

async function getReviewsCount(bookID: number): Promise<number> {
    try {
        if (isNaN(bookID)) {
            throw new Error('Invalid book ID format');
        }

        const book = await Book.findOne({ bookID, isDeleted: false });
        if (!book) {
            throw new Error('Book not found!');
        }

        const reviews = await BookReview.countDocuments({ bookID: book._id, isDeleted: false });
        if (!reviews) {
            throw new Error('Reviews not found!');
        }

        return reviews;
    } catch (error) {
        throw error;
    }
}

export default { getReviews, getReviewsCount };
