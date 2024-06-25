import { createServer, startServer } from './server'
import { loggerUtils } from './src/utils'

/**
 * app initialization
 */
createServer()
  .then(startServer)
  .catch((error: Error) => {
    loggerUtils.logger.error(error)
  })
