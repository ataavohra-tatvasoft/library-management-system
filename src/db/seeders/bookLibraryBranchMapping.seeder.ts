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
    {
      bookID: { _id: insertedBooks[0]._id! },
      libraryBranchID: { _id: insertedLibraryBranches[0]._id! }
    },
    {
      bookID: { _id: insertedBooks[1]._id! },
      libraryBranchID: { _id: insertedLibraryBranches[1]._id! }
    },
    {
      bookID: { _id: insertedBooks[2]._id! },
      libraryBranchID: { _id: insertedLibraryBranches[2]._id! }
    },
    {
      bookID: { _id: insertedBooks[3]._id! },
      libraryBranchID: { _id: insertedLibraryBranches[3]._id! }
    },
    {
      bookID: { _id: insertedBooks[4]._id! },
      libraryBranchID: { _id: insertedLibraryBranches[4]._id! }
    },
    {
      bookID: { _id: insertedBooks[5]._id! },
      libraryBranchID: { _id: insertedLibraryBranches[5]._id! }
    }
  ]

  await BookLibraryBranchMapping.insertMany(bookLibraryBranchMappings)
  loggerUtils.logger.info('Inserted new user role mappings!')
}
