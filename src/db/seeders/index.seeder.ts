import { dbConfig } from '../../config'
import {
  Author,
  Book,
  BookGallery,
  BookHistory,
  BookLibraryBranchMapping,
  BookRating,
  BookReview,
  LibraryBranch,
  PaymentCard,
  Role,
  User,
  UserLibraryBranchMapping,
  UserRoleMapping
} from '../models'
import { loggerUtils } from '../../utils'
import { seedRoles } from './role.seeder'

const seedData = async () => {
  try {
    await dbConfig.connectToDatabase()
    loggerUtils.logger.info('Connected to database')

    await Author.deleteMany()
    loggerUtils.logger.info('Deleted previous authors!')

    await Book.deleteMany()
    loggerUtils.logger.info('Deleted previous books!')

    await BookGallery.deleteMany()
    loggerUtils.logger.info('Deleted previous book galleries!')

    await BookHistory.deleteMany()
    loggerUtils.logger.info('Deleted previous book histories!')

    await BookLibraryBranchMapping.deleteMany()
    loggerUtils.logger.info('Deleted previous book - library branch mappings!')

    await BookRating.deleteMany()
    loggerUtils.logger.info('Deleted previous book ratings!')

    await BookReview.deleteMany()
    loggerUtils.logger.info('Deleted previous book reviews!')

    await LibraryBranch.deleteMany()
    loggerUtils.logger.info('Deleted previous library branches!')

    await PaymentCard.deleteMany()
    loggerUtils.logger.info('Deleted previous payment cards!')

    await Role.deleteMany()
    loggerUtils.logger.info('Deleted previous roles!')

    await User.deleteMany()
    loggerUtils.logger.info('Deleted previous users!')

    await UserLibraryBranchMapping.deleteMany()
    loggerUtils.logger.info('Deleted previous user - library branch mappings!')

    await UserRoleMapping.deleteMany()
    loggerUtils.logger.info('Deleted previous user - role mappings!')

    await seedRoles()

    // eslint-disable-next-line no-undef
    process.exit(0)
  } catch (error) {
    loggerUtils.logger.error('Error seeding data:', error)
    // eslint-disable-next-line no-undef
    process.exit(1)
  }
}

seedData()
