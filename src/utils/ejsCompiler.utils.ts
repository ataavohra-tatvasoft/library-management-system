import fs from 'fs'
import path from 'path'
import ejs from 'ejs'
import { httpStatusConstant, messageConstant } from '../constant'
import { HttpError } from '../libs'

const compileTemplate = async (templateName: string, data: object) => {
  {
    const templatePath = path.join('public', 'templates', `${templateName}.ejs`)
    const templateContent = await fs.promises.readFile(templatePath, 'utf8')
    if (!templateContent) {
      throw new HttpError(
        messageConstant.ERROR_READING_FILE,
        httpStatusConstant.INTERNAL_SERVER_ERROR
      )
    }
    return ejs.render(templateContent, data, { async: true })
  }
}

export default { compileTemplate }
