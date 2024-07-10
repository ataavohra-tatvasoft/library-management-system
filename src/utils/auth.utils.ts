import { createClient } from 'redis'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { envConfig } from '../config'
import { IVerifiedToken } from '../interfaces'
import { HttpError } from '../libs'
import { httpErrorMessageConstant, httpStatusConstant, messageConstant } from '../constant'

async function validateAuthorizationHeader(headers: {
  [key: string]: any
}): Promise<{ token: string }> {
  {
    const authHeader = headers.authorization || headers.Authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HttpError(httpErrorMessageConstant.UNAUTHORIZED, httpStatusConstant.UNAUTHORIZED)
    }

    const token = authHeader.split(' ')[1]
    return { token }
  }
}
async function verifyAccessToken(token: string): Promise<IVerifiedToken> {
  try {
    return jwt.verify(token, envConfig.jwtSecretKey as string) as IVerifiedToken
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      if (error.name === 'TokenExpiredError') {
        throw new HttpError(
          httpErrorMessageConstant.ACCESS_TOKEN_EXPIRED,
          httpStatusConstant.INVALID_TOKEN
        )
      } else {
        throw new HttpError(messageConstant.INVALID_ACCESS_TOKEN, httpStatusConstant.INVALID_TOKEN)
      }
    }
    throw error
  }
}
async function verifyRefreshToken(token: string): Promise<IVerifiedToken> {
  try {
    return jwt.verify(token, envConfig.jwtSecretKey as string) as IVerifiedToken
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      if (error.name === 'TokenExpiredError') {
        throw new HttpError(messageConstant.REFRESH_TOKEN_EXPIRED, httpStatusConstant.INVALID_TOKEN)
      } else {
        throw new HttpError(messageConstant.INVALID_REFRESH_TOKEN, httpStatusConstant.INVALID_TOKEN)
      }
    }
    throw error
  }
}
async function createRedisClient() {
  {
    const client = createClient({
      password: String(envConfig.redisPassword),
      socket: {
        host: String(envConfig.redisHost),
        port: Number(envConfig.redisPort)
      }
    })
    await client.connect()
    return client
  }
}
async function blockToken(token: string, type: 'access' | 'refresh'): Promise<void> {
  {
    const client = await createRedisClient()
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')
    const key = `blocked:${type}:tokens`

    await client.sAdd(key, hashedToken)
    await client.expire(key, 24 * 60 * 60)

    return Promise.resolve()
  }
}

export default {
  validateAuthorizationHeader,
  verifyAccessToken,
  verifyRefreshToken,
  blockToken,
  createRedisClient
}
