import mongoose from 'mongoose'
import { httpStatusConstant, messageConstant } from '../constant'
import { HttpError } from '../libs'

const connectToCollection = async (
  db: mongoose.Connection,
  collectionName: string
): Promise<mongoose.Collection<mongoose.mongo.BSON.Document>> => {
  try {
    const collection = db.collection(collectionName) as mongoose.Collection
    return collection
  } catch (error) {
    throw new HttpError(
      messageConstant.COLLECTION_CONNECTION_ERROR,
      httpStatusConstant.INTERNAL_SERVER_ERROR
    )
  }
}

const fetchCollectionData = async (db: mongoose.Connection, collectionName: string) => {
  const collection = db.collection(collectionName)
  return await collection.find().toArray()
}

export default { connectToCollection, fetchCollectionData }
