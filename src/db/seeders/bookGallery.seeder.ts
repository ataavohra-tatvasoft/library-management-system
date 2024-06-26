import { BookGallery } from '../models'
import { loggerUtils } from '../../utils'

export const seedBookGalleries = async (insertedBooks: any[]) => {
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
