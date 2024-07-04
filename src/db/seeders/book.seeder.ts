import { Book } from '../models'
import { helperFunctionsUtils, loggerUtils } from '../../utils'
import { IAuthor, IBook } from '../../interfaces'

export const seedBooks = async (insertedAuthors: IAuthor[]) => {
  await Book.deleteMany({})
  loggerUtils.logger.info('Deleted all books!')

  const books = [
    {
      bookID: helperFunctionsUtils.generatePlaceholderID('999', 10),
      name: 'Book 1',
      author: insertedAuthors[0]._id,
      charges: 120,
      issueCount: 100,
      submitCount: 90,
      publishedDate: new Date('2024-02-07'),
      subscriptionDays: 2,
      quantityAvailable: 12,
      numberOfFreeDays: 3,
      description: 'This is the description of the Book 1'
    },
    {
      bookID: helperFunctionsUtils.generatePlaceholderID('999', 10),
      name: 'Book 2',
      author: insertedAuthors[1]._id,
      charges: 150,
      issueCount: 90,
      submitCount: 80,
      publishedDate: new Date('2024-03-17'),
      subscriptionDays: 2,
      quantityAvailable: 20,
      numberOfFreeDays: 5,
      description: 'This is the description of the Book 2'
    },
    {
      bookID: helperFunctionsUtils.generatePlaceholderID('999', 10),
      name: 'Book 3',
      author: insertedAuthors[2]._id,
      charges: 160,
      issueCount: 80,
      submitCount: 70,
      publishedDate: new Date('2024-05-21'),
      subscriptionDays: 2,
      quantityAvailable: 22,
      numberOfFreeDays: 7,
      description: 'This is the description of the Book 3'
    },
    {
      bookID: helperFunctionsUtils.generatePlaceholderID('999', 10),
      name: 'Book 4',
      author: insertedAuthors[3]._id,
      charges: 140,
      issueCount: 70,
      submitCount: 60,
      publishedDate: new Date('2024-04-20'),
      subscriptionDays: 2,
      quantityAvailable: 30,
      numberOfFreeDays: 9,
      description: 'This is the description of the Book 4'
    },
    {
      bookID: helperFunctionsUtils.generatePlaceholderID('999', 10),
      name: 'Book 5',
      author: insertedAuthors[4]._id,
      charges: 145,
      issueCount: 40,
      submitCount: 30,
      publishedDate: new Date('2024-04-20'),
      subscriptionDays: 2,
      quantityAvailable: 30,
      numberOfFreeDays: 9,
      description: 'This is the description of the Book 5'
    },
    {
      bookID: helperFunctionsUtils.generatePlaceholderID('999', 10),
      name: 'Book 6',
      author: insertedAuthors[5]._id,
      charges: 155,
      issueCount: 45,
      submitCount: 35,
      publishedDate: new Date('2024-04-20'),
      subscriptionDays: 2,
      quantityAvailable: 30,
      numberOfFreeDays: 9,
      description: 'This is the description of the Book 6'
    }
  ]

  const insertedBooks: IBook[] = await Book.insertMany(books)
  loggerUtils.logger.info('Inserted new books!')
  return insertedBooks
}
