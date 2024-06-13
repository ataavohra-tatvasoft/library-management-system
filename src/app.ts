import express, { Express } from 'express';
import bodyParser from 'body-parser';
import { dbConfig, envConfig } from './config';
import { messageConstant } from './constant';
import routes from './routes';
import { errors } from 'celebrate';
import { errorHandlerUtils, loggerUtils } from './utils';

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
app.use(errors());
app.use(errorHandlerUtils.errorHandler);

app.listen(envConfig.serverPort);
