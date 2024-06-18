import { Request, Response, NextFunction } from 'express';
import { ObjectId } from 'mongoose';

export type Controller = (req: Request, res: Response, next: NextFunction) => Promise<any>;

export type VerifiedToken = {
    _id: ObjectId;
    email: string;
    tokenType: string;
};
