import fs from 'fs';
import path from 'path';
import ejs from 'ejs';

const compileEmailTemplate = async (templateName: string, data: object) => {
    {
        const templatePath = path.join('public', 'templates', `${templateName}.ejs`);
        const templateContent = await fs.promises.readFile(templatePath, 'utf8');
        return ejs.render(templateContent, data, { async: true });
    }
};

export default { compileEmailTemplate };
