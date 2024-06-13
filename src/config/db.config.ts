import mongoose from 'mongoose';
import { messageConstant } from '../constant/message.constant';
import { loggerUtils } from '../utils';
import { envConfig } from '../config';

async function connectToDatabase() {
    try {
        const conn = await mongoose.connect(envConfig.dbURL as string, {
            autoIndex: true,
            connectTimeoutMS: 100000,
            socketTimeoutMS: 100000,
            serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
        });

        loggerUtils.logger.info(`${messageConstant.DB_CONNECTED}`);
        loggerUtils.logger.info(`Host: ${conn.connection.host}`);
    } catch (error) {
        handleError(error);
    }
}
function handleError(error: unknown) {
    const typedError = error as Error;
    loggerUtils.logger.error(typedError.message);
    throw new Error(messageConstant.CONNECTION_ERROR);
}

export default { connectToDatabase };
