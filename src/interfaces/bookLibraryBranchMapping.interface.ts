import { ObjectId } from 'mongoose'

interface IBookID {
  _id: ObjectId
}

interface ILibraryBranchID {
  _id: ObjectId
}

export interface IBookLibraryBranchMapping {
  _id?: ObjectId
  bookID?: IBookID
  libraryBranchID?: ILibraryBranchID
  deletedAt?: Date
}
