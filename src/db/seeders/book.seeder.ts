import { Book } from '../models'
import { helperFunctionsUtils, loggerUtils } from '../../utils'
import { IBook, ILibraryBranch } from '../../interfaces'

export const seedBooks = async (insertedLibraryBranches: ILibraryBranch[]) => {
  await Book.deleteMany({})
  loggerUtils.logger.info('Deleted all books!')

  const books = [
    {
      bookID: helperFunctionsUtils.generatePlaceholderID('999', 10),
      name: 'Book 1',
      author: 'Author 1',
      charges: 120,
      issueCount: 100,
      submitCount: 90,
      publishedDate: new Date('2024-02-07'),
      subscriptionDays: 2,
      quantityAvailable: 12,
      numberOfFreeDays: 3,
      description: 'This is the description of the Book 1',
      branchID: insertedLibraryBranches[0]._id
    },
    {
      bookID: helperFunctionsUtils.generatePlaceholderID('999', 10),
      name: 'Book 2',
      author: 'Author 2',
      charges: 150,
      issueCount: 90,
      submitCount: 80,
      publishedDate: new Date('2024-03-17'),
      subscriptionDays: 2,
      quantityAvailable: 20,
      numberOfFreeDays: 5,
      description: 'This is the description of the Book 2',
      branchID: insertedLibraryBranches[1]._id
    },
    {
      bookID: helperFunctionsUtils.generatePlaceholderID('999', 10),
      name: 'Book 3',
      author: 'Author 3',
      charges: 160,
      issueCount: 80,
      submitCount: 70,
      publishedDate: new Date('2024-05-21'),
      subscriptionDays: 2,
      quantityAvailable: 22,
      numberOfFreeDays: 7,
      description: 'This is the description of the Book 3',
      branchID: insertedLibraryBranches[2]._id
    },
    {
      bookID: helperFunctionsUtils.generatePlaceholderID('999', 10),
      name: 'Book 4',
      author: 'Author 4',
      charges: 140,
      issueCount: 70,
      submitCount: 60,
      publishedDate: new Date('2024-04-20'),
      subscriptionDays: 2,
      quantityAvailable: 30,
      numberOfFreeDays: 9,
      description: 'This is the description of the Book 4',
      branchID: insertedLibraryBranches[3]._id
    },
    {
      bookID: helperFunctionsUtils.generatePlaceholderID('999', 10),
      name: 'Book 5',
      author: 'Author 5',
      charges: 145,
      issueCount: 40,
      submitCount: 30,
      publishedDate: new Date('2024-04-20'),
      subscriptionDays: 2,
      quantityAvailable: 30,
      numberOfFreeDays: 9,
      description: 'This is the description of the Book 5',
      branchID: insertedLibraryBranches[4]._id
    },
    {
      bookID: helperFunctionsUtils.generatePlaceholderID('999', 10),
      name: 'Book 6',
      author: 'Author 6',
      charges: 155,
      issueCount: 45,
      submitCount: 35,
      publishedDate: new Date('2024-04-20'),
      subscriptionDays: 2,
      quantityAvailable: 30,
      numberOfFreeDays: 9,
      description: 'This is the description of the Book 6',
      branchID: insertedLibraryBranches[5]._id
    }
  ]

  const insertedBooks: IBook[] = await Book.insertMany(books)
  loggerUtils.logger.info('Inserted new books!')
  return insertedBooks
}
