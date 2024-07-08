import { Schema, model, Model } from 'mongoose'
import { IUserLibraryBranchMapping } from '../../interfaces'

type UserLibraryBranchMappingModel = Model<IUserLibraryBranchMapping>

const userLibraryBranchMappingSchema: Schema<
  IUserLibraryBranchMapping,
  UserLibraryBranchMappingModel
> = new Schema<IUserLibraryBranchMapping, UserLibraryBranchMappingModel>({
  userID: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  branchID: {
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

// Ensure userID and branchID pair is unique
userLibraryBranchMappingSchema.index({ userID: 1, branchID: 1 }, { unique: true })

export const UserLibraryBranchMapping: UserLibraryBranchMappingModel = model<
  IUserLibraryBranchMapping,
  UserLibraryBranchMappingModel
>('userlibrarybranchmappings', userLibraryBranchMappingSchema)
