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
  bookID: IBookID
  userID: IUserID
  issuedBy: IUserID
  submittedBy: IUserID
  issueDate: Date
  submitDate: Date
  deletedAt: Date
}
