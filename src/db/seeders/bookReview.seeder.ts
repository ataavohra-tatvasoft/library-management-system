import { BookReview } from '../models'
import { loggerUtils } from '../../utils'
import { IAdmin, IBook, IUser } from '../../interfaces'

export const seedBookReviews = async (
  insertedBooks: IBook[],
  insertedAdmins: IAdmin[],
  insertedUsers: IUser[]
) => {
  await BookReview.deleteMany({})
  loggerUtils.logger.info('Deleted all reviews!')

  const reviews = [
    {
      bookID: insertedBooks[0]._id,
      userID: insertedUsers[0]._id,
      review: 'Amazing book with great insights.'
    },
    {
      bookID: insertedBooks[1]._id,
      userID: insertedAdmins[0]._id,
      review: 'Very informative and well-written.'
    },
    {
      bookID: insertedBooks[2]._id,
      userID: insertedUsers[0]._id,
      review: 'Good book, but could be better.'
    },
    {
      bookID: insertedBooks[3]._id,
      userID: insertedAdmins[0]._id,
      review: 'Interesting read, highly recommended!'
    }
  ]

  await BookReview.insertMany(reviews)
  loggerUtils.logger.info('Inserted new reviews!')
}
