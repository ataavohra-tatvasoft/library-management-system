import { ObjectId } from 'mongoose'
interface IBookID {
  _id: ObjectId
  bookID: number
  charges: number
  name: string
}

interface IUserID {
  _id: ObjectId
  email: string
  firstname: string
  lastname: string
}
export interface IBookHistory {
  _id?: ObjectId
  bookID: ObjectId
  userID: ObjectId
  issueDate: Date
  submitDate: Date
  deletedAt: Date
}

export interface PopulatedBookHistory extends Omit<IBookHistory, 'bookID' | 'userID'> {
  bookID: IBookID
  userID: IUserID
}
