import cron from 'node-cron'
import { User, Book } from '../db/models' // Adjust the import based on your project structure
import loggerUtils from './logger.utils'

const DAY_IN_MILLISECONDS = 1000 * 60 * 60 * 24

const updateDueCharges = async () => {
  try {
    const users = await User.find().populate('books')

    for (const user of users) {
      for (const issuedBook of user.books) {
        const bookID = issuedBook.bookId
        const issueDate = new Date(issuedBook.issueDate)
        const currentDate = new Date()
        const book = await Book.findById(bookID)

        if (!book) {
          loggerUtils.logger.info('Book not found for bookID: ', user, ' and bookID: ' + bookID)
          continue
        }

        if (book.subscriptionDays === undefined || book.charges === undefined) {
          continue // Skip if book doesn't have necessary fields
        }

        // Calculate subscription end date
        const subscriptionEndDate = new Date(
          issueDate.getTime() + book.subscriptionDays * DAY_IN_MILLISECONDS
        )

        // If current date is past the subscription end date, calculate due charges
        if (currentDate > subscriptionEndDate) {
          const durationInDays = Math.ceil(
            (currentDate.getTime() - subscriptionEndDate.getTime()) / DAY_IN_MILLISECONDS
          )

          const dueCharges = durationInDays * book.charges

          // Update user's due charges
          const userUpdate = await User.updateOne(
            { _id: user._id },
            { $inc: { dueCharges: dueCharges } }
          )
          if (!userUpdate) {
            throw new Error('Error updating user')
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
