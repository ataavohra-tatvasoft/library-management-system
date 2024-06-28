import multer, { StorageEngine } from 'multer'
import { Request } from 'express'
import { existsSync } from 'fs'
import path from 'path'
import multerUtils from './multer.utils'

const fileStorage: StorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const uploadDirectory = multerUtils.getUploadDirectory(req.url)
      cb(null, uploadDirectory)
    } catch (error) {
      cb(error as Error, '')
    }
  },
  filename: async (req: Request<{ email: string; bookID: string }>, file, cb) => {
    try {
      const uniqueName = multerUtils.generateUniqueFileName(req.url, req.params, file)
      const uploadDirectory = multerUtils.getUploadDirectory(req.url)
      let finalFileName = uniqueName

      if (req.url.includes('/upload-profile-photo')) {
        await multerUtils.deleteExistingProfilePhoto(uploadDirectory, req.params.email)
        finalFileName = uniqueName
      } else if (req.url.includes('/upload-book-cover-photo')) {
        await multerUtils.deleteExistingCoverPhoto(uploadDirectory, req.params.bookID)
        finalFileName = `bookID-${req.params.bookID}-coverImage.${file.originalname.split('.').pop()}`
      } else {
        let counter = 1
        while (existsSync(path.join(uploadDirectory, finalFileName))) {
          if (req.url.includes('/upload-book-photo')) {
            finalFileName = `bookID-${req.params.bookID}-${file.fieldname}-${counter}.${file.originalname.split('.').pop()}`
          } else {
            finalFileName = `${file.fieldname}-${counter}.${file.originalname.split('.').pop()}`
          }
          counter++
        }
      }

      cb(null, finalFileName)
    } catch (error) {
      cb(error as Error, '')
    }
  }
})

const fileFilter = (req: Request, file: any, cb: any) => {
  const allowedImageTypes = ['image/png', 'image/jpg', 'image/jpeg']
  const allowedDocumentTypes = ['application/pdf']
  const isImage = allowedImageTypes.includes(file.mimetype)
  const isDocument = allowedDocumentTypes.includes(file.mimetype)

  if (isImage || isDocument) {
    cb(null, true)
  } else {
    cb(null, false)
  }
}

export const upload = multer({
  storage: fileStorage,
  fileFilter: fileFilter,
  limits: { fileSize: 2000000 } // 2MB limit
})
