import { Response } from 'express';
import loggerUtils from './logger.utils';
import { httpErrorMessageConstant, httpStatusConstant } from '../constant';

async function responseHandler(
    res: Response,
    statusCode: number,
    data?: any | null,
    message?: string | null,
    error?: any | null
) {
    try {
        const formattedResponse = {
            code: statusCode,
            data,
            message,
            error: error ? { object: error, message: error.message } : {},
        };

        return res.status(statusCode).json(formattedResponse);
    } catch (error: any) {
        loggerUtils.logger.error(error);
        return res.status(httpStatusConstant.INTERNAL_SERVER_ERROR).json({
            status: false,
            message: httpErrorMessageConstant.RESPONSE_HANDLER_ERROR,
            error: error.message || error,
        });
    }
}

export default {
    responseHandler,
};
