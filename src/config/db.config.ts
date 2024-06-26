import mongoose from 'mongoose'
import { messageConstant } from '../constant/message.constant'
import { loggerUtils } from '../utils'
import { envConfig } from '../config'

async function connectToDatabase() {
  try {
    const conn = await mongoose.connect(envConfig.dbURL as string, {
      autoIndex: true,
      connectTimeoutMS: 100000,
      socketTimeoutMS: 100000,
      serverSelectionTimeoutMS: 30000
    })

    return conn // Return the connection object
  } catch (error: any) {
    loggerUtils.logger.error(error.message)
    throw new Error(messageConstant.CONNECTION_ERROR)
  }
}

export default { connectToDatabase }
