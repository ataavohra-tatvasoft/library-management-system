import mongoose from 'mongoose'
import { loggerUtils } from '../utils'

const connectToCollection = async (
  conn: mongoose.Connection,
  collectionName: string
): Promise<mongoose.Collection<any>> => {
  try {
    const collection = conn.collection(collectionName) as mongoose.Collection
    return collection
  } catch (error: any) {
    loggerUtils.logger.error(error.message)
    throw new Error('Error while connection with collection')
  }
}

export default { connectToCollection }
