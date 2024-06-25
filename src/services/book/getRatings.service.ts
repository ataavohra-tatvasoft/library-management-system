import { Book, BookRating } from '../../db/models'

async function getRatings(
  bookID: number
): Promise<{ totalRatings: number; averageRating: number; ratingScale: string }> {
  {
    if (isNaN(bookID)) {
      throw new Error('Invalid book ID format')
    }

    const book = await Book.findOne({ bookID, deletedAt: null })
    if (!book) {
      throw new Error('Book not found!')
    }

    const ratings = await BookRating.find({ bookID: book._id, deletedAt: null })
    if (!ratings) {
      throw new Error('Book ratings not found!')
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
