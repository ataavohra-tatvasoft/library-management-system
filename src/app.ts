import express, { Express, Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import { dbConfig, envConfig } from './config';
import { httpStatusConstant, messageConstant } from './constant';
import routes from './routes';
import { loggerUtils, responseHandlerUtils } from './utils';

const app: Express = express();
(async () => {
    try {
        await dbConfig.connectToDatabase();
        loggerUtils.logger.info(messageConstant.APP_STARTED);
    } catch (error) {
        loggerUtils.logger.error(error);
    }
})();

app.set('view engine', 'ejs');

app.use(
    bodyParser.urlencoded({
        extended: false,
    })
);
app.use(bodyParser.json());
app.use(routes);
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
    return responseHandlerUtils.responseHandler(res, {
        statusCode: httpStatusConstant.INTERNAL_SERVER_ERROR,
        error,
    });
});

app.listen(envConfig.serverPort);
