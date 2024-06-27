import { dbConfig } from '../../config'
import { seedAdmins } from './admin.seeder'
import { seedUsers } from './user.seeder'
import { seedBooks } from './book.seeder'
import { seedBookGalleries } from './bookGallery.seeder'
import { seedBookRatings } from './bookRating.seeder'
import { seedBookReviews } from './bookReview.seeder'
import { loggerUtils } from '../../utils'
import { BookHistory } from '../models'
import { PaymentCard } from '../models/paymentCard.model'

const seedData = async () => {
  try {
    await dbConfig.connectToDatabase()
    loggerUtils.logger.info('Connected to database')

    const insertedAdmins = await seedAdmins()
    const insertedUsers = await seedUsers()
    const insertedBooks = await seedBooks()

    await seedBookGalleries(insertedBooks)
    await seedBookRatings(insertedBooks, insertedUsers, insertedAdmins)
    await seedBookReviews(insertedBooks, insertedUsers, insertedAdmins)

    await BookHistory.deleteMany()
    loggerUtils.logger.info('Deleted previous book history!')

    await PaymentCard.deleteMany()
    loggerUtils.logger.info('Deleted previous payment cards!')

    // eslint-disable-next-line no-undef
    process.exit(0)
  } catch (error) {
    loggerUtils.logger.error('Error seeding data:', error)
    // eslint-disable-next-line no-undef
    process.exit(1)
  }
}

seedData()
