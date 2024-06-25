import { Book, BookReview } from '../../db/models'

async function getReviews(
  bookID: number,
  skip: number,
  limit: number
): Promise<{ bookReviews: { username: string; review: any }[]; length: number }> {
  try {
    if (isNaN(bookID)) {
      throw new Error('Invalid book ID format')
    }

    const book = await Book.findOne({ bookID, deletedAt: null })
    if (!book) {
      throw new Error('Book not found!')
    }

    const reviews = await BookReview.find({ bookID: book._id, deletedAt: null })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'userID',
        select: 'email firstname lastname'
      })
    if (!reviews) {
      throw new Error('Reviews not found')
    }

    reviews.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    const bookReviews = reviews.map((reviews: any) => ({
      username: reviews.userID?.firstname + ' ' + reviews.userID?.lastname || 'Anonymous',
      review: reviews.review
    }))

    return { bookReviews, length: reviews.length }
  } catch (error) {
    throw error
  }
}

async function getReviewsCount(bookID: number): Promise<number> {
  try {
    if (isNaN(bookID)) {
      throw new Error('Invalid book ID format')
    }

    const book = await Book.findOne({ bookID, deletedAt: null })
    if (!book) {
      throw new Error('Book not found!')
    }

    const reviews = await BookReview.countDocuments({ bookID: book._id, deletedAt: null })
    if (!reviews) {
      throw new Error('Reviews not found!')
    }

    return reviews
  } catch (error) {
    throw error
  }
}

export default { getReviews, getReviewsCount }
