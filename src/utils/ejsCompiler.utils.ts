import fs from 'fs';
import path from 'path';
import ejs from 'ejs';
import loggerUtils from './logger.utils';

const compileEmailTemplate = async (templateName: string, data?: object) => {
    try {
        const templatePath = path.join('public', 'templates', `${templateName}.ejs`);
        loggerUtils.logger.info(templatePath);
        const templateContent = await fs.promises.readFile(templatePath, 'utf8');

        return ejs.render(templateContent, data, { async: true });
    } catch (err) {
        loggerUtils.logger.error(err);
        throw Error('Failed to compile email template');
    }
};

export default { compileEmailTemplate };
