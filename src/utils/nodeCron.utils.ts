import cron from 'node-cron'
import { User, Book } from '../db/models'
import loggerUtils from './logger.utils'
import { httpStatusConstant, messageConstant } from '../constant'
import { HttpError } from '../libs'

const DAY_IN_MILLISECONDS = 1000 * 60 * 60 * 24

const updateDueCharges = async () => {
  try {
    const users = await User.find().populate('books')

    for (const user of users) {
      if (!user.books || !Array.isArray(user.books)) {
        continue
      }

      for (const issuedBook of user.books) {
        const bookID = issuedBook.bookId
        const issueDate = new Date(issuedBook.issueDate)
        const currentDate = new Date()
        const book = await Book.findOne({ bookID, deletedAt: null })

        if (!book) {
          loggerUtils.logger.info(`Book not found for user: ${user._id} and bookID: ${bookID}`)
          continue
        }

        if (book.subscriptionDays === undefined || book.charges === undefined) {
          continue
        }

        const subscriptionEndDate = new Date(
          issueDate.getTime() + book.subscriptionDays * DAY_IN_MILLISECONDS
        )

        if (currentDate > subscriptionEndDate) {
          const durationInDays = Math.ceil(
            (currentDate.getTime() - subscriptionEndDate.getTime()) / DAY_IN_MILLISECONDS
          )

          const dueCharges = durationInDays * book.charges

          const userUpdate = await User.updateOne(
            { _id: user._id },
            { $inc: { dueCharges: dueCharges } }
          )

          if (!userUpdate) {
            throw new HttpError(
              messageConstant.ERROR_UPDATING_USER,
              httpStatusConstant.INTERNAL_SERVER_ERROR
            )
          }
        }
      }
    }

    console.log('Due charges updated successfully')
  } catch (error) {
    console.error('Error updating due charges:', error)
  }
}

// Schedule the job to run daily at midnight
const scheduleUpdateDueCharges = () => {
  cron.schedule('0 0 * * *', updateDueCharges)
}

export default { scheduleUpdateDueCharges }
