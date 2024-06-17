import { Response } from 'express';
import loggerUtils from './logger.utils';
import { httpErrorMessageConstant, httpStatusConstant } from '../constant';
import { CelebrateError, isCelebrateError } from 'celebrate';

interface ResponseHandlerOptions {
    statusCode: number;
    data?: any;
    message?: string;
    error?: any;
}

async function responseHandler(res: Response, options: ResponseHandlerOptions) {
    const { statusCode, data, message = '', error } = options;

    try {
        const formattedResponse: any = {
            code: statusCode,
            message,
        };

        loggerUtils.logger.info(formattedResponse);

        if (isCelebrateError(error)) {
            const celebrateError = error as CelebrateError;
            const errorDetails: any[] = [];

            celebrateError.details.forEach((value, key) => {
                errorDetails.push({
                    message: value.message,
                    path: key,
                });
            });
            loggerUtils.logger.info(celebrateError);
            loggerUtils.logger.info(errorDetails);
            formattedResponse.message = httpErrorMessageConstant.VALIDATION_ERROR;
            formattedResponse.error = errorDetails;
        } else {
            if (data !== null && data !== undefined) {
                formattedResponse.data = data;
            }

            if (
                error !== null &&
                error !== undefined &&
                (typeof error !== 'object' || Object.keys(error).length > 0)
            ) {
                formattedResponse.error = { object: error, message: error.message };
            }
        }

        return res.status(statusCode).json(formattedResponse);
    } catch (error: any) {
        loggerUtils.logger.error('Response Handler Error:', error);
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
