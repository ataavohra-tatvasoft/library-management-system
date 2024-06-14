import dotenv from 'dotenv';

dotenv.config();

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
    accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES,
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES,
    saltRounds: process.env.SALT_ROUNDS,
    redisPassword: process.env.REDIS_PASSWORD,
    redisHost: process.env.REDIS_HOST,
    redisPort: process.env.REDIS_PORT,
};
