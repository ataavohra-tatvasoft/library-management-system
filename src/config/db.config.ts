import mongoose from 'mongoose'
import { messageConstant } from '../constant/message.constant'
import { loggerUtils } from '../utils'
import { envConfig } from '../config'
import { httpStatusConstant } from '../constant'
import { HttpError } from '../libs'

async function connectToDatabase() {
  try {
    const conn = await mongoose.connect(envConfig.dbURL as string, {
      autoIndex: true,
      connectTimeoutMS: 100000,
      socketTimeoutMS: 100000,
      serverSelectionTimeoutMS: 30000
    })

    return conn
  } catch (error) {
    loggerUtils.logger.error(error)
    throw new HttpError(messageConstant.CONNECTION_ERROR, httpStatusConstant.INTERNAL_SERVER_ERROR)
  }
}

export default { connectToDatabase }
