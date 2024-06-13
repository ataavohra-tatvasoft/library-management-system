import jwt from 'jsonwebtoken';
import { envConfig } from '../config';

type VerifiedToken = {
    user_id: number;
    email: string;
};

async function validateAuthorizationHeader(headers: any): Promise<{ token: string }> {
    try {
        const authHeader = headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new Error('Unauthorized');
        }

        const token = authHeader.split(' ')[1];
        return { token };
    } catch (error) {
        throw error;
    }
}

async function verifyJwtToken(token: string): Promise<VerifiedToken> {
    try {
        return jwt.verify(token, envConfig.jwtSecretKey as string) as VerifiedToken;
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            throw new Error('Invalid Token');
        }
        throw error;
    }
}

export default {
    validateAuthorizationHeader,
    verifyJwtToken,
};
