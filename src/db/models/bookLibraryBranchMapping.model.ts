import { Schema, model, Model } from 'mongoose'
import { IBookLibraryBranchMapping } from '../../interfaces'

type BookLibraryBranchMappingModel = Model<IBookLibraryBranchMapping>

const bookLibraryMappingSchema: Schema<IBookLibraryBranchMapping, BookLibraryBranchMappingModel> =
  new Schema<IBookLibraryBranchMapping, BookLibraryBranchMappingModel>({
    bookID: {
      type: Schema.Types.ObjectId,
      ref: 'books',
      required: true
    },
    libraryBranchID: {
      type: Schema.Types.ObjectId,
      ref: 'librarybranches',
      required: true
    },
    deletedAt: {
      type: Date,
      allownull: true,
      default: null
    }
  })

// Ensure bookID and libraryBranchID pair is unique
bookLibraryMappingSchema.index({ bookID: 1, libraryBranchID: 1 }, { unique: true })

export const BookLibraryBranchMapping: BookLibraryBranchMappingModel = model<
  IBookLibraryBranchMapping,
  BookLibraryBranchMappingModel
>('booklibrarybranchmappings', bookLibraryMappingSchema)
