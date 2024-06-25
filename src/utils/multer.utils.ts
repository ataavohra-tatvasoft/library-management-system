import path from 'path'
import { promises as fs } from 'fs'

// Set base directories for uploads
const userUploadDirectory = path.join('public', 'uploads', 'user')
const bookUploadDirectory = path.join('public', 'uploads', 'book')

// Function to determine the upload directory based on the request URL
const getUploadDirectory = (url: string): string => {
  if (url.includes('/upload-profile-photo')) {
    return userUploadDirectory
  } else if (url.includes('/upload-book-photo') || url.includes('/upload-book-cover-photo')) {
    return bookUploadDirectory
  } else {
    throw new Error('Invalid upload route')
  }
}

// Function to generate a unique file name
const generateUniqueFileName = (url: string, params: any, file: any): string => {
  {
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
}

// Function to delete existing profile photo (moved outside storage config)
const deleteExistingProfilePhoto = async (directory: string, email: string) => {
  {
    const files = await fs.readdir(directory) // List files in the directory
    const profilePhotos = files.filter((file: any) =>
      file.startsWith(`user-${String(email)}-profilePhoto.`)
    )

    for (const photo of profilePhotos) {
      const filePath = path.join(directory, photo)
      await fs.unlink(filePath)
    }
  }
}

// Function to delete existing cover photo (moved outside storage config)
const deleteExistingCoverPhoto = async (directory: string, bookID: string) => {
  {
    console.log(directory)
    const files = await fs.readdir(directory) // List files in the directory
    const coverPhotos = files.filter(
      async (file: any) => await file.startsWith(`bookID-${Number(bookID)}-coverImage.`)
    ) // Filter book cover photo

    // Delete each cover photo
    for (const photo of coverPhotos) {
      const filePath = path.join(directory, photo)
      await fs.unlink(filePath)
    }
  }
}

export default {
  getUploadDirectory,
  generateUniqueFileName,
  deleteExistingProfilePhoto,
  deleteExistingCoverPhoto
}
