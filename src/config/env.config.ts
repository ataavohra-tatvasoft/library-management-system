/* eslint-disable no-undef */
import dotenv from 'dotenv'

dotenv.config()

export default {
  dbURL: process.env.DB_URL,
  database: process.env.DB_NAME,
  serverHost: process.env.SERVER_HOST,
  serverPort: process.env.SERVER_PORT,
  emailHost: process.env.EMAIL_HOST,
  emailPort: process.env.EMAIL_PORT,
  emailUser: process.env.EMAIL_USER,
  emailPass: process.env.EMAIL_PASS,
  resetPassLink: process.env.RESET_PASS_LINK,
  jwtSecretKey: process.env.JWT_SECRET_KEY,
  accessTokenExpiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES,
  refreshTokenExpiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES,
  saltRounds: process.env.SALT_ROUNDS,
  redisPassword: process.env.REDIS_PASSWORD,
  redisHost: process.env.REDIS_HOST,
  redisPort: process.env.REDIS_PORT,
  stripeApiKey: process.env.STRIPE_API_KEY,
  googleClientID: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URIS,
  googleTokenPath: process.env.GOOGLE_TOKEN_PATH,
  googleRefreshToken: process.env.GOOGLE_REFRESH_TOKEN
}
