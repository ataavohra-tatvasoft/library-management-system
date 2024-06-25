import { createClient } from 'redis'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { envConfig } from '../config'
import { VerifiedToken } from '../interfaces'

async function validateAuthorizationHeader(headers: any): Promise<{ token: string }> {
  try {
    const authHeader = headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Unauthorized')
    }

    const token = authHeader.split(' ')[1]
    return { token }
  } catch (error) {
    throw error
  }
}
async function verifyAccessToken(token: string): Promise<VerifiedToken> {
  try {
    return jwt.verify(token, envConfig.jwtSecretKey as string) as VerifiedToken
  } catch (error: any) {
    if (error instanceof jwt.JsonWebTokenError) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Access Token Expired')
      } else {
        throw new Error('Invalid Access Token')
      }
    }
    throw error
  }
}
async function verifyRefreshToken(token: string): Promise<VerifiedToken> {
  try {
    return jwt.verify(token, envConfig.jwtSecretKey as string) as VerifiedToken
  } catch (error: any) {
    if (error instanceof jwt.JsonWebTokenError) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Refresh Token Expired, kindly login again.')
      } else {
        throw new Error('Invalid Refresh Token')
      }
    }
    throw error
  }
}
async function createRedisClient() {
  try {
    const client = createClient({
      password: String(envConfig.redisPassword),
      socket: {
        host: String(envConfig.redisHost),
        port: Number(envConfig.redisPort)
      }
    })
    await client.connect()
    return client
  } catch (error) {
    throw error
  }
}
async function blockToken(token: string, type: 'access' | 'refresh'): Promise<void> {
  try {
    const client = await createRedisClient()
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')
    const key = `blocked:${type}:tokens`

    await client.sAdd(key, hashedToken)
    await client.expire(key, 24 * 60 * 60)

    return Promise.resolve()
  } catch (error) {
    throw error
  }
}

export default {
  validateAuthorizationHeader,
  verifyAccessToken,
  verifyRefreshToken,
  blockToken,
  createRedisClient
}
