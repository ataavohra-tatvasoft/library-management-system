import dotenv from 'dotenv'

dotenv.config()

export default {
  dbURL: process.env.DB_URL, // eslint-disable-line no-undef
  database: process.env.DB_NAME, // eslint-disable-line no-undef
  serverHost: process.env.SERVER_HOST, // eslint-disable-line no-undef
  serverPort: process.env.SERVER_PORT, // eslint-disable-line no-undef
  emailHost: process.env.EMAIL_HOST, // eslint-disable-line no-undef
  emailPort: process.env.EMAIL_PORT, // eslint-disable-line no-undef
  emailUser: process.env.EMAIL_USER, // eslint-disable-line no-undef
  emailPass: process.env.EMAIL_PASS, // eslint-disable-line no-undef
  resetPassLink: process.env.RESET_PASS_LINK, // eslint-disable-line no-undef
  jwtSecretKey: process.env.JWT_SECRET_KEY, // eslint-disable-line no-undef
  accessTokenExpiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES, // eslint-disable-line no-undef
  refreshTokenExpiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES, // eslint-disable-line no-undef
  saltRounds: process.env.SALT_ROUNDS, // eslint-disable-line no-undef
  redisPassword: process.env.REDIS_PASSWORD, // eslint-disable-line no-undef
  redisHost: process.env.REDIS_HOST, // eslint-disable-line no-undef
  redisPort: process.env.REDIS_PORT, // eslint-disable-line no-undef
  stripeApiKey: process.env.STRIPE_API_KEY // eslint-disable-line no-undef
}
