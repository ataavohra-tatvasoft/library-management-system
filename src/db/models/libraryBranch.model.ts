import { Model, model, Schema } from 'mongoose'
import { ILibraryBranch } from '../../interfaces'

type LibraryBranchModel = Model<ILibraryBranch>

const libraryBranchSchema: Schema<ILibraryBranch, LibraryBranchModel> = new Schema(
  {
    branchID: {
      type: String,
      unique: true,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    phoneNumber: {
      type: String,
      required: true
    },
    deletedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
)

export const LibraryBranch: LibraryBranchModel = model<ILibraryBranch, LibraryBranchModel>(
  'librarybranches',
  libraryBranchSchema
)
