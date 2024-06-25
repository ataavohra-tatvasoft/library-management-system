import express, { Express } from 'express'
import bodyParser from 'body-parser'
import { dbConfig, envConfig } from './src/config'
import { messageConstant } from './src/constant'
import routes from './src/routes'
import { errorHandlerUtils, loggerUtils } from './src/utils'
import { nodeCronUtils } from './src/utils'

/**
 * Function to create and configure the Express app.
 */
const createServer = async (): Promise<Express> => {
  try {
    const app: Express = express()
    app.set('view engine', 'ejs')

    // Middleware setup
    app.use(bodyParser.urlencoded({ extended: false }))
    app.use(bodyParser.json())

    // Routes setup
    app.use(routes)

    // Error handling middleware
    app.use(errorHandlerUtils.errorHandler)

    return app
  } catch (error) {
    loggerUtils.logger.error('Error creating server: ', error)
    throw error
  }
}

/**
 * Function to start the Express server.
 */
const startServer = async (app: Express): Promise<void> => {
  try {
    await dbConfig.connectToDatabase()
    loggerUtils.logger.info(messageConstant.APP_STARTED)

    app.listen(envConfig.serverPort, () => {
      loggerUtils.logger.info(`Server started on port ${envConfig.serverPort}`)
    })

    // Schedule the cron job
    nodeCronUtils.scheduleUpdateDueCharges()
  } catch (error) {
    loggerUtils.logger.error('Error starting server: ', error)
    throw error
  }
}

export { createServer, startServer }
