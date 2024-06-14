import { Response } from 'express';
import { httpErrorMessageConstant, httpStatusConstant } from '../constant';
import loggerUtils from './logger.utils';

function errorHandler(error: Error, res: Response) {
    loggerUtils.logger.error(error);
    return res.status(httpStatusConstant.INTERNAL_SERVER_ERROR).json({
        status: false,
        message: httpErrorMessageConstant.INTERNAL_SERVER_ERROR,
        error: error.message || error,
    });
}

export default {
    errorHandler,
};
