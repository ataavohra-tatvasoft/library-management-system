import mongoose from 'mongoose'
import { loggerUtils } from '../utils'

const connectToCollection = async (
  db: mongoose.Connection,
  collectionName: string
): Promise<mongoose.Collection<any>> => {
  try {
    const collection = db.collection(collectionName) as mongoose.Collection
    return collection
  } catch (error: any) {
    loggerUtils.logger.error(error.message)
    throw new Error('Error while connection with collection')
  }
}

const fetchCollectionData = async (db: mongoose.Connection, collectionName: string) => {
  const collection = db.collection(collectionName)
  return await collection.find().toArray()
}

export default { connectToCollection, fetchCollectionData }
