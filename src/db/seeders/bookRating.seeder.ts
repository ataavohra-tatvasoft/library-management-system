import { BookRating } from '../models'
import { loggerUtils } from '../../utils'

export const seedBookRatings = async (
  insertedBooks: any[],
  insertedUsers: any[],
  insertedAdmins: any[]
) => {
  await BookRating.deleteMany({})
  loggerUtils.logger.info('Deleted all ratings!')

  const ratings = [
    {
      bookID: insertedBooks[0]._id,
      userID: insertedUsers[0]._id,
      rating: 5
    },
    {
      bookID: insertedBooks[0]._id,
      userID: insertedAdmins[0]._id,
      rating: 3
    },
    {
      bookID: insertedBooks[1]._id,
      userID: insertedAdmins[0]._id,
      rating: 4
    },
    {
      bookID: insertedBooks[2]._id,
      userID: insertedUsers[0]._id,
      rating: 3
    },
    {
      bookID: insertedBooks[3]._id,
      userID: insertedAdmins[0]._id,
      rating: 4
    }
  ]

  await BookRating.insertMany(ratings)
  loggerUtils.logger.info('Inserted new ratings!')
}
