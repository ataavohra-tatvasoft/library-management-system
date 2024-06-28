import { ObjectId, Schema } from 'mongoose'
interface IBookID {
  _id: Schema.Types.ObjectId
  charges: number
  name: string
}

interface IUserID {
  _id: Schema.Types.ObjectId
  email: string
  firstname: string
  lastname: string
}
export interface IBookHistory {
  _id?: ObjectId
  bookID: Schema.Types.ObjectId
  userID: Schema.Types.ObjectId
  issueDate: Date
  submitDate: Date
  deletedAt: Date
}

export interface PopulatedBookHistory extends Omit<IBookHistory, 'bookID' | 'userID'> {
  bookID: IBookID
  userID: IUserID
}
