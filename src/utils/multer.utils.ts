import { Express } from 'express'
import path from 'path'
import { promises as fs } from 'fs'
import { httpStatusConstant, messageConstant } from '../constant'
import { HttpError } from '../libs'

const userUploadDirectory = path.join('public', 'uploads', 'user')
const bookUploadDirectory = path.join('public', 'uploads', 'book')

const getUploadDirectory = (url: string): string => {
  if (url.includes('/upload-profile-photo')) {
    return userUploadDirectory
  } else if (url.includes('/upload-book-photo') || url.includes('/upload-book-cover-photo')) {
    return bookUploadDirectory
  } else {
    throw new HttpError(messageConstant.INVALID_UPLOAD_ROUTE, httpStatusConstant.BAD_REQUEST)
  }
}

const generateUniqueFileName = (
  url: string,
  params: { email: string; bookID: string },
  file: Express.Multer.File
): string => {
  const extension = file.originalname.split('.').pop()
  const baseFileName = file.fieldname
  let uniqueName: string

  if (url.includes('/upload-profile-photo')) {
    uniqueName = `user-${params.email}-profilePhoto.${extension}`
  } else if (url.includes('/upload-book-photo')) {
    uniqueName = `bookID-${params.bookID}-${baseFileName}.${extension}`
  } else if (url.includes('/upload-book-cover-photo')) {
    uniqueName = `bookID-${params.bookID}-coverImage.${extension}`
  } else {
    uniqueName = `${baseFileName}.${extension}`
  }

  return uniqueName
}

const deleteExistingProfilePhoto = async (directory: string, email: string) => {
  const files = await fs.readdir(directory)
  const profilePhotos = files.filter((file: string) =>
    file.startsWith(`user-${String(email)}-profilePhoto.`)
  )

  for (const photo of profilePhotos) {
    const filePath = path.join(directory, photo)
    await fs.unlink(filePath)
  }
}

const deleteExistingCoverPhoto = async (directory: string, bookID: string) => {
  const files: string[] = await fs.readdir(directory)
  const coverPhotos: string[] = files.filter((file: string) =>
    file.startsWith(`bookID-${String(bookID)}-coverImage.`)
  )

  for (const photo of coverPhotos) {
    const filePath = path.join(directory, photo)
    await fs.unlink(filePath)
  }
}

export default {
  getUploadDirectory,
  generateUniqueFileName,
  deleteExistingProfilePhoto,
  deleteExistingCoverPhoto
}
