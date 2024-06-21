import multer, { StorageEngine } from 'multer';
import { Request } from 'express';
import { existsSync } from 'fs';
import path from 'path';

const uploadDirectory = path.join('public', 'images');
export const fileStorage: StorageEngine = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDirectory);
    },
    filename: (req, file, cb) => {
        let fileName = file.originalname;
        const extension = fileName.split('.').pop();
        const baseFileName = fileName.substring(0, fileName.lastIndexOf('.'));

        let counter = 1;
        while (existsSync(`${uploadDirectory}/${fileName}`)) {
            fileName = `${baseFileName} (${counter}).${extension}`;
            counter++;
        }
        cb(null, fileName);
    },
});

export const fileFilter = (req: Request, file: any, cb: any) => {
    if (
        file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg' ||
        file.mimetype === 'application/pdf'
    ) {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

export const upload = multer({
    storage: fileStorage,
    fileFilter: fileFilter,
    limits: { fileSize: 2000000 },
});
