import { Request, Response, NextFunction } from 'express';
import responseHandlerUtils from './responseHandler.utils';
import { httpStatusConstant } from '../constant';

const errorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
    return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.INTERNAL_SERVER_ERROR,
        error,
    });
};

export default {
    errorHandler,
};
