import { dbConfig } from '../../config'
import { seedUsers } from './user.seeder'
import { seedBooks } from './book.seeder'
import { seedBookGalleries } from './bookGallery.seeder'
import { seedBookRatings } from './bookRating.seeder'
import { seedBookReviews } from './bookReview.seeder'
import { seedLibraryBranches } from './libraryBranch.seeder'
import { BookHistory, PaymentCard } from '../models'
import { loggerUtils } from '../../utils'
import { seedRoles } from './role.seeder'
import { seedUserRoleMapping } from './userRoleMapping.seeder'
import { seedAuthors } from './author.seeder'
import { seedBookLibraryBranchMapping } from './bookLibraryBranchMapping.seeder'
import { seedUserLibraryBranchMapping } from './userLibraryBranchMapping.seeder'

const seedData = async () => {
  try {
    await dbConfig.connectToDatabase()
    loggerUtils.logger.info('Connected to database')

    seedAuthors
    const insertedAuthors = await seedAuthors()
    const insertedBooks = await seedBooks(insertedAuthors)
    const insertedLibraryBranches = await seedLibraryBranches()
    const insertedRoles = await seedRoles()
    const insertedUsers = await seedUsers()

    await seedUserLibraryBranchMapping(insertedUsers, insertedLibraryBranches)
    await seedBookLibraryBranchMapping(insertedBooks, insertedLibraryBranches)
    await seedUserRoleMapping(insertedRoles, insertedUsers)
    await seedBookGalleries(insertedBooks)
    await seedBookRatings(insertedBooks, insertedUsers)
    await seedBookReviews(insertedBooks, insertedUsers)

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
