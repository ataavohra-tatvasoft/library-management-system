import { BookGallery } from '../models'
import { loggerUtils } from '../../utils'
import { IBook } from '../../interfaces'

export const seedBookGalleries = async (insertedBooks: IBook[]) => {
  await BookGallery.deleteMany({})
  loggerUtils.logger.info('Deleted all book gallery entries!')

  const bookGalleryEntries = insertedBooks.map((book, index) => ({
    bookID: book._id,
    imagePath: `public/images/book${index + 1}.jpg`,
    imageName: 'coverImage'
  }))

  await BookGallery.insertMany(bookGalleryEntries)
  loggerUtils.logger.info('Inserted new book gallery entries!')
}
