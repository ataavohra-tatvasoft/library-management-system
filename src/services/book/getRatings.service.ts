import { httpStatusConstant, messageConstant } from '../../constant'
import { Book, BookRating } from '../../db/models'
import { HttpError } from '../../libs'

async function getRatings(
  bookID: number
): Promise<{ totalRatings: number; averageRating: number; ratingScale: string }> {
  {
    const book = await Book.findOne({ bookID, deletedAt: null })
    if (!book) {
      throw new HttpError(messageConstant.BOOK_NOT_FOUND, httpStatusConstant.BAD_REQUEST)
    }

    const ratings = await BookRating.find({ bookID: book._id, deletedAt: null })
    if (!ratings?.length) {
      throw new HttpError(messageConstant.NO_RATINGS_FOUND, httpStatusConstant.NOT_FOUND)
    }
    const totalRatings = ratings.length
    const averageRating =
      totalRatings > 0 ? ratings.reduce((acc, rating) => acc + rating.rating, 0) / totalRatings : 0

    let ratingScale = ''
    if (averageRating >= 4.5) {
      ratingScale = 'Outstanding'
    } else if (averageRating >= 3.5) {
      ratingScale = 'Exceeds Expectations'
    } else if (averageRating >= 2.5) {
      ratingScale = 'Meets Expectations'
    } else if (averageRating >= 1.5) {
      ratingScale = 'Needs Improvement'
    } else {
      ratingScale = 'Unacceptable'
    }

    return { totalRatings, averageRating, ratingScale }
  }
}

export default { getRatings }
