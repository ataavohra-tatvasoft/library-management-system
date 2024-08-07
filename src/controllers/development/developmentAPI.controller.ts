import { Request, Response } from 'express'
import { dbConfig } from '../../config'
import {
  Author,
  Book,
  BookGallery,
  BookRating,
  BookReview,
  BookLibraryBranchMapping,
  LibraryBranch,
  Role,
  User,
  UserLibraryBranchMapping,
  UserRoleMapping
} from '../../db/models'
import { helperFunctionsUtils, loggerUtils, responseHandlerUtils } from '../../utils'
import {
  IAuthor,
  IBook,
  IBookLibraryBranchMapping,
  IUser,
  ILibraryBranch,
  IUserLibraryBranchMapping,
  IUserRoleMapping
} from '../../interfaces'
import { hash } from 'bcrypt'
import { UserType } from '../../types'
import { httpStatusConstant, messageConstant } from '../../constant'

const SALT_ROUNDS = 10

const seedDatabase = async (req: Request, res: Response) => {
  await dbConfig.connectToDatabase()
  loggerUtils.logger.info('Connected to database')

  // Seed Authors

  const authors: IAuthor[] = [
    {
      email: 'jane.doe@example.com',
      firstname: 'Jane',
      lastname: 'Doe',
      bio: 'Jane Doe is an acclaimed writer known for her vivid storytelling and rich characters.',
      website: 'https://janedoe.com',
      address: '123 Main St, Springfield'
    },
    {
      email: 'john.smith@example.com',
      firstname: 'John',
      lastname: 'Smith',
      bio: 'John Smith is a prolific author with numerous bestsellers across various genres.',
      website: 'https://johnsmith.com',
      address: '456 Elm St, Shelbyville'
    },
    {
      email: 'emily.brown@example.com',
      firstname: 'Emily',
      lastname: 'Brown',
      bio: 'Emily Brown writes inspiring and heartwarming tales that captivate readers of all ages.',
      website: 'https://emilybrown.com',
      address: '789 Oak St, Capital City'
    },
    {
      email: 'michael.jones@example.com',
      firstname: 'Michael',
      lastname: 'Jones',
      bio: 'Michael Jones is known for his thrilling novels that keep readers on the edge of their seats.',
      website: 'https://michaeljones.com',
      address: '101 Maple St, Ogdenville'
    },
    {
      email: 'sarah.wilson@example.com',
      firstname: 'Sarah',
      lastname: 'Wilson',
      bio: 'Sarah Wilson’s works are a perfect blend of fantasy and reality, drawing readers into magical worlds.',
      website: 'https://sarahwilson.com',
      address: '202 Birch St, North Haverbrook'
    },
    {
      email: 'david.taylor@example.com',
      firstname: 'David',
      lastname: 'Taylor',
      bio: 'David Taylor is a celebrated author known for his deep and thought-provoking works.',
      website: 'https://davidtaylor.com',
      address: '303 Pine St, Brockway'
    },
    {
      email: 'olivia.moore@example.com',
      firstname: 'Olivia',
      lastname: 'Moore',
      bio: 'Olivia Moore crafts intricate mysteries that leave readers guessing until the last page.',
      website: 'https://oliviamoore.com',
      address: '404 Cedar St, Ogdenville'
    },
    {
      email: 'william.thomas@example.com',
      firstname: 'William',
      lastname: 'Thomas',
      bio: 'William Thomas writes historical fiction that brings past eras to life with meticulous detail.',
      website: 'https://williamthomas.com',
      address: '505 Walnut St, North Haverbrook'
    },
    {
      email: 'amelia.jackson@example.com',
      firstname: 'Amelia',
      lastname: 'Jackson',
      bio: 'Amelia Jackson’s novels are known for their emotional depth and compelling characters.',
      website: 'https://ameliajackson.com',
      address: '606 Ash St, Springfield'
    },
    {
      email: 'james.white@example.com',
      firstname: 'James',
      lastname: 'White',
      bio: 'James White’s science fiction novels explore futuristic worlds and complex moral dilemmas.',
      website: 'https://jameswhite.com',
      address: '707 Willow St, Shelbyville'
    }
  ]

  const insertedAuthors: IAuthor[] = await Author.insertMany(authors)
  loggerUtils.logger.info('Inserted new authors!')

  // Seed Books

  const books: IBook[] = [
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

  // Seed Book Galleries

  const bookGalleryEntries = insertedBooks.map((book, index) => ({
    bookID: book._id,
    imagePath: `public/images/book${index + 1}.jpg`,
    imageName: 'coverImage'
  }))

  await BookGallery.insertMany(bookGalleryEntries)
  loggerUtils.logger.info('Inserted new book gallery entries!')

  // Seed Library Branches

  const libraryBranches: ILibraryBranch[] = [
    {
      branchID: helperFunctionsUtils.generatePlaceholderID('9', 5),
      name: 'Branch 1',
      address: 'Bodakdev, Ahmedabad',
      phoneNumber: '919845754510'
    },
    {
      branchID: helperFunctionsUtils.generatePlaceholderID('9', 5),
      name: 'Branch 2',
      address: 'Ambavadi, Ahmedabad',
      phoneNumber: '919849784510'
    },
    {
      branchID: helperFunctionsUtils.generatePlaceholderID('9', 5),
      name: 'Branch 3',
      address: 'Prahladhnagar, Ahmedabad',
      phoneNumber: '919878864510'
    },
    {
      branchID: helperFunctionsUtils.generatePlaceholderID('9', 5),
      name: 'Branch 4',
      address: 'Thaltej, Ahmedabad',
      phoneNumber: '919884514510'
    },
    {
      branchID: helperFunctionsUtils.generatePlaceholderID('9', 5),
      name: 'Branch 5',
      address: 'South Bopal, Ahmedabad',
      phoneNumber: '919878844510'
    },
    {
      branchID: helperFunctionsUtils.generatePlaceholderID('9', 5),
      name: 'Branch 6',
      address: 'Chandkheda, Ahmedabad',
      phoneNumber: '919845884510'
    }
  ]

  const insertedLibraryBranches: ILibraryBranch[] = await LibraryBranch.insertMany(libraryBranches)
  loggerUtils.logger.info('Inserted new library branches!')

  // Seed Users

  const users = [
    {
      email: 'user@mailinator.com',
      password: await hash('Password@789', SALT_ROUNDS),
      isAuthToken: false,
      firstname: 'Dummy',
      lastname: 'Dummy',
      gender: 'female',
      dateOfBirth: new Date('2008-01-01'),
      mobileNumber: BigInt(8642204572),
      address: 'Demo_Address_1',
      city: 'Demo_City_1',
      state: 'Demo_State_1',
      paidAmount: 0
    },
    {
      email: 'admin@mailinator.com',
      password: await hash('Password@789', SALT_ROUNDS),
      isAuthToken: false,
      firstname: 'Dummy',
      lastname: 'Dummy',
      gender: 'male',
      dateOfBirth: new Date('2011-01-01'),
      mobileNumber: BigInt(8542103572),
      address: 'Demo_Address',
      city: 'Demo_City',
      state: 'Demo_State'
    },
    {
      email: 'librarian@mailinator.com',
      password: await hash('Password@789', SALT_ROUNDS),
      isAuthToken: false,
      firstname: 'Dummy',
      lastname: 'Dummy',
      gender: 'male',
      dateOfBirth: new Date('2008-01-01'),
      mobileNumber: BigInt(8642204572),
      address: 'Demo_Address_1',
      city: 'Demo_City_1',
      state: 'Demo_State_1',
      libraryBranchID: insertedLibraryBranches[0]._id
    }
  ]

  const insertedUsers: IUser[] = await User.insertMany(users)
  loggerUtils.logger.info('Inserted new users!')

  // Seed User-Library Branch Mapping

  const userLibraryBranchMappings: IUserLibraryBranchMapping[] = [
    {
      userID: { _id: insertedUsers[0]._id! },
      branchID: { _id: insertedLibraryBranches[0]._id! }
    },
    {
      userID: { _id: insertedUsers[0]._id! },
      branchID: { _id: insertedLibraryBranches[1]._id! }
    },
    {
      userID: { _id: insertedUsers[1]._id! },
      branchID: { _id: insertedLibraryBranches[0]._id! }
    },
    { userID: { _id: insertedUsers[1]._id! }, branchID: { _id: insertedLibraryBranches[1]._id! } }
  ]

  await UserLibraryBranchMapping.insertMany(userLibraryBranchMappings)
  loggerUtils.logger.info('Inserted new user role mappings!')

  // Seed Book-Library Branch Mapping

  const bookLibraryBranchMappings: IBookLibraryBranchMapping[] = [
    {
      bookID: { _id: insertedBooks[0]._id! },
      libraryBranchID: { _id: insertedLibraryBranches[0]._id! }
    },
    {
      bookID: { _id: insertedBooks[0]._id! },
      libraryBranchID: { _id: insertedLibraryBranches[1]._id! }
    },
    {
      bookID: { _id: insertedBooks[1]._id! },
      libraryBranchID: { _id: insertedLibraryBranches[1]._id! }
    },
    {
      bookID: { _id: insertedBooks[1]._id! },
      libraryBranchID: { _id: insertedLibraryBranches[2]._id! }
    },
    {
      bookID: { _id: insertedBooks[2]._id! },
      libraryBranchID: { _id: insertedLibraryBranches[2]._id! }
    },
    {
      bookID: { _id: insertedBooks[2]._id! },
      libraryBranchID: { _id: insertedLibraryBranches[3]._id! }
    },
    {
      bookID: { _id: insertedBooks[3]._id! },
      libraryBranchID: { _id: insertedLibraryBranches[3]._id! }
    },
    {
      bookID: { _id: insertedBooks[3]._id! },
      libraryBranchID: { _id: insertedLibraryBranches[4]._id! }
    },
    {
      bookID: { _id: insertedBooks[4]._id! },
      libraryBranchID: { _id: insertedLibraryBranches[4]._id! }
    },
    {
      bookID: { _id: insertedBooks[4]._id! },
      libraryBranchID: { _id: insertedLibraryBranches[5]._id! }
    },
    {
      bookID: { _id: insertedBooks[5]._id! },
      libraryBranchID: { _id: insertedLibraryBranches[5]._id! }
    },
    {
      bookID: { _id: insertedBooks[5]._id! },
      libraryBranchID: { _id: insertedLibraryBranches[0]._id! }
    }
  ]

  await BookLibraryBranchMapping.insertMany(bookLibraryBranchMappings)
  loggerUtils.logger.info('Inserted new book-library branch mappings!')

  // Seed User-Role Mapping

  const userRole = await Role.findOne({ role: UserType.User })
  const adminRole = await Role.findOne({ role: UserType.Admin })
  const librarianRole = await Role.findOne({ role: UserType.Librarian })

  const userRoleMappings: IUserRoleMapping[] = [
    { userID: { _id: insertedUsers[0]._id! }, roleID: { _id: userRole?._id! } },
    { userID: { _id: insertedUsers[1]._id! }, roleID: { _id: adminRole?._id! } },
    { userID: { _id: insertedUsers[2]._id! }, roleID: { _id: librarianRole?._id! } }
  ]

  await UserRoleMapping.insertMany(userRoleMappings)
  loggerUtils.logger.info('Inserted new user role mappings!')

  // Seed Book Ratings

  const ratings = [
    {
      bookID: insertedBooks[0]._id,
      userID: insertedUsers[0]._id,
      rating: 5
    },
    {
      bookID: insertedBooks[0]._id,
      userID: insertedUsers[1]._id,
      rating: 3
    },
    {
      bookID: insertedBooks[1]._id,
      userID: insertedUsers[1]._id,
      rating: 4
    },
    {
      bookID: insertedBooks[2]._id,
      userID: insertedUsers[0]._id,
      rating: 3
    },
    {
      bookID: insertedBooks[3]._id,
      userID: insertedUsers[1]._id,
      rating: 4
    }
  ]

  await BookRating.insertMany(ratings)
  loggerUtils.logger.info('Inserted new ratings!')

  // Seed Book Reviews

  const reviews = [
    {
      bookID: insertedBooks[0]._id,
      userID: insertedUsers[0]._id,
      review: 'Amazing book with great insights.'
    },
    {
      bookID: insertedBooks[1]._id,
      userID: insertedUsers[1]._id,
      review: 'Very informative and well-written.'
    },
    {
      bookID: insertedBooks[2]._id,
      userID: insertedUsers[0]._id,
      review: 'Good book, but could be better.'
    },
    {
      bookID: insertedBooks[3]._id,
      userID: insertedUsers[1]._id,
      review: 'Interesting read, highly recommended!'
    }
  ]

  await BookReview.insertMany(reviews)
  loggerUtils.logger.info('Inserted new reviews!')

  return responseHandlerUtils.responseHandler(res, {
    statusCode: httpStatusConstant.OK,
    message: messageConstant.SAMPLE_DATA_ADDED
  })
}

export default {
  seedDatabase
}
