import { IBook, IBookLibraryBranchMapping, ILibraryBranch } from '../../interfaces'
import { loggerUtils } from '../../utils'
import { BookLibraryBranchMapping } from '../models'

export const seedBookLibraryBranchMapping = async (
  insertedBooks: IBook[],
  insertedLibraryBranches: ILibraryBranch[]
) => {
  await BookLibraryBranchMapping.deleteMany({})
  loggerUtils.logger.info('Deleted all user role mappings!')
  const bookLibraryBranchMappings: IBookLibraryBranchMapping[] = [
    { bookID: insertedBooks[0]._id, libraryBranchID: insertedLibraryBranches[0]._id },
    { bookID: insertedBooks[1]._id, libraryBranchID: insertedLibraryBranches[1]._id },
    { bookID: insertedBooks[2]._id, libraryBranchID: insertedLibraryBranches[2]._id },
    { bookID: insertedBooks[3]._id, libraryBranchID: insertedLibraryBranches[3]._id },
    { bookID: insertedBooks[4]._id, libraryBranchID: insertedLibraryBranches[4]._id },
    { bookID: insertedBooks[5]._id, libraryBranchID: insertedLibraryBranches[5]._id }
  ]

  await BookLibraryBranchMapping.insertMany(bookLibraryBranchMappings)
  loggerUtils.logger.info('Inserted new user role mappings!')
}
