import multer, { StorageEngine } from 'multer';
import { Request } from 'express';
import { existsSync, unlinkSync } from 'fs';
import path from 'path';
import glob from 'glob';

// Set base directories for uploads
const userUploadDirectory = path.join('public', 'uploads', 'user');
const bookUploadDirectory = path.join('public', 'uploads', 'book');

// Function to determine the upload directory based on the request URL
const getUploadDirectory = (url: string): string => {
    if (url.includes('/upload-profile-photo')) {
        return userUploadDirectory;
    } else if (url.includes('/upload-book-photo') || url.includes('/upload-book-cover-photo')) {
        return bookUploadDirectory;
    } else {
        throw new Error('Invalid upload route');
    }
};

// Function to generate a unique file name
const generateUniqueFileName = (url: string, params: any, file: any): string => {
    const extension = file.originalname.split('.').pop();
    const baseFileName = file.fieldname;
    let uniqueName: string;

    if (url.includes('/upload-profile-photo')) {
        uniqueName = `user-${params.email}-profilePhoto.${extension}`;
    } else if (url.includes('/upload-book-photo')) {
        uniqueName = `bookID-${params.bookID}-${baseFileName}.${extension}`;
    } else if (url.includes('/upload-book-cover-photo')) {
        uniqueName = `bookID-${params.bookID}-coverImage.${extension}`;
    } else {
        uniqueName = `${baseFileName}.${extension}`;
    }

    return uniqueName;
};

// Function to delete existing profile photo
const deleteExistingProfilePhoto = (directory: string, email: string) => {
    const pattern = path.join(directory, `user-${email}-profilePhoto.*`);
    glob(pattern, (err, files) => {
        if (err) {
            console.error(`Error finding existing profile photos: ${err}`);
            return;
        }
        files.forEach((filePath) => {
            try {
                unlinkSync(filePath);
            } catch (err) {
                console.error(`Error deleting existing profile photo: ${err}`);
            }
        });
    });
};

// Multer storage configuration
const fileStorage: StorageEngine = multer.diskStorage({
    destination: (req, file, cb) => {
        try {
            const uploadDirectory = getUploadDirectory(req.url);
            cb(null, uploadDirectory);
        } catch (error) {
            cb(error as Error, '');
        }
    },
    filename: (req, file, cb) => {
        try {
            const uniqueName = generateUniqueFileName(req.url, req.params, file);
            const uploadDirectory = getUploadDirectory(req.url);
            let finalFileName = uniqueName;

            // If the upload is for a profile photo, delete the existing one
            if (req.url.includes('/upload-profile-photo')) {
                deleteExistingProfilePhoto(uploadDirectory, req.params.email);
                finalFileName = uniqueName;
            } else {
                let counter = 1;
                while (existsSync(path.join(uploadDirectory, finalFileName))) {
                    if (req.url.includes('/upload-book-photo')) {
                        finalFileName = `bookID-${req.params.bookID}-${file.fieldname}-${counter}.${file.originalname.split('.').pop()}`;
                    } else if (req.url.includes('/upload-book-cover-photo')) {
                        finalFileName = `bookID-${req.params.bookID}-coverImage-${counter}.${file.originalname.split('.').pop()}`;
                    } else {
                        finalFileName = `${file.fieldname}-${counter}.${file.originalname.split('.').pop()}`;
                    }
                    counter++;
                }
            }

            cb(null, finalFileName);
        } catch (error) {
            cb(error as Error, '');
        }
    },
});

// Multer file filter configuration
const fileFilter = (req: Request, file: any, cb: any) => {
    const allowedImageTypes = ['image/png', 'image/jpg', 'image/jpeg'];
    const allowedDocumentTypes = ['application/pdf'];
    const isImage = allowedImageTypes.includes(file.mimetype);
    const isDocument = allowedDocumentTypes.includes(file.mimetype);

    if (isImage || isDocument) {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

export const upload = multer({
    storage: fileStorage,
    fileFilter: fileFilter,
    limits: { fileSize: 2000000 }, // 2MB limit
});
