import { httpStatusConstant, messageConstant } from '../../constant'
import { Book, BookReview } from '../../db/models'
import { HttpError } from '../../libs'

async function getReviews(
  bookID: number,
  skip: number,
  limit: number
): Promise<{ bookReviews: { username: string; review: any }[]; length: number }> {
  {
    const book = await Book.findOne({ bookID, deletedAt: null })
    if (!book) {
      throw new HttpError(messageConstant.BOOK_NOT_FOUND, httpStatusConstant.NOT_FOUND)
    }

    const reviews = await BookReview.find({ bookID: book._id, deletedAt: null })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'userID',
        select: 'email firstname lastname'
      })
    if (!reviews?.length) {
      throw new HttpError(messageConstant.NO_REVIEWS_FOUND, httpStatusConstant.NOT_FOUND)
    }

    reviews.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    const bookReviews = reviews.map((reviews: any) => ({
      username: reviews.userID?.firstname + ' ' + reviews.userID?.lastname || 'Anonymous',
      review: reviews.review
    }))

    return { bookReviews, length: reviews.length }
  }
}

async function getReviewsCount(bookID: number): Promise<number> {
  {
    const book = await Book.findOne({ bookID, deletedAt: null })
    if (!book) {
      throw new HttpError(messageConstant.BOOK_NOT_FOUND, httpStatusConstant.NOT_FOUND)
    }

    const reviews = await BookReview.countDocuments({ bookID: book._id, deletedAt: null })
    if (!reviews) {
      throw new HttpError(messageConstant.NO_REVIEWS_FOUND, httpStatusConstant.NOT_FOUND)
    }

    return reviews
  }
}

export default { getReviews, getReviewsCount }
