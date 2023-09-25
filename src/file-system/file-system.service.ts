import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { google } from 'googleapis';
import * as fs from "node:fs"
import { Readable } from 'node:stream';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { FileSystem, FileSystemDocument } from './schema/file-system.schema';
import mongoose, { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

// const oauth2Client = new google.auth.OAuth2({
//     clientId: "168934949203-4nfd5hoffeqproi3uc6gvr5tret70te2.apps.googleusercontent.com",
//     clientSecret: "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",
//     redirectUri: "https://developers.google.com/oauthplayground",
// })
// const oauth2Client = new google.auth.OAuth2({
//     clientId: process.env.GOOGLE_CLIENT_ID,
//     clientSecret: process.env.GOOGLE_SECRET_KEY,
//     redirectUri: process.env.FRONTEND_DASHBOARD_URL,
// })

@Injectable()
export class FileSystemService {
    drive: any;
    private readonly oauth2Client

    @InjectModel(FileSystem.name) private FileSystemModel: Model<FileSystemDocument>
    constructor() {

        this.oauth2Client = new google.auth.OAuth2({
            // clientId: "168934949203-4nfd5hoffeqproi3uc6gvr5tret70te2.apps.googleusercontent.com",
            clientId: "369956568963-cbac9g1clg9ib486o8k7ggnqf6ia4m26.apps.googleusercontent.com",
            clientSecret: "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",
            // clientSecret: "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",
            redirectUri: "https://developers.google.com/oauthplayground",
        })
        // this.oauth2Client.setCredentials({ refresh_token: "1//04HxFhC0iZRa-CgYIARAAGAQSNwF-L9IrPs9Bq9blYc4EuthxGdYJTWZGATZUCc-shW4rxcOp68w9_2IRyRj1a-IxfdflEdCoAwI" })
        this.oauth2Client.setCredentials({ refresh_token: "1//04H7zUFnWrDuxCgYIARAAGAQSNwF-L9Irn9XFxFNTbASfe4nfW8ra-f-5i7wiHpboCpiSlA3wPF94tJqjKDOe0Hm6lBE0MbgwBN8" })

        this.drive = google.drive({
            version: 'v3',
            auth: this.oauth2Client
        }
        )
    }
    async uploadFile(originalname, mimetype, size, fileName) {
        try {
            console.log(originalname, mimetype, size, fileName);
            const response = await this.drive.files.create({
                requestBody: {
                    name: fileName,
                    mimeType: mimetype,
                },


                media: {
                    parent: "userProfile",
                    mimeType: mimetype,
                    body: fs.createReadStream(`./uploads/${fileName}`)
                    // fs.createReadStream("./uploads/cb58a10521b7810d793410b3c9646b8b7a.webp")
                    // fileData

                }
            })
            const { id, mimeType, name } = response?.["data"];
            console.log(response);
            if (response?.headers?.status == 200) {
                throw new BadRequestException("File Not Uploaded Sucessfully")
            }

            // Delete the file from your local server (assuming you are storing it locally)
            const filePath = `./uploads/${name}`;
            // fs.unlinkSync(filePath);

            await fs.promises.unlink(filePath);
            const result = await this.FileSystemModel.insertMany([{ FileId: id, mimeType, FileName: name }])
            console.log(result);
            return response;
        } catch (err) {
            console.log(err?.message);
            throw new InternalServerErrorException(err?.message)
        }
    }

    async uploadFileToLocal(file) {
        try {
            storage: diskStorage({
                destination: './uploads', // Choose the directory where files will be saved
                filename: (req, file, callback) => {
                    const randomName = Array(32)
                        .fill(null)
                        .map(() => Math.round(Math.random() * 16).toString(16))
                        .join('');
                    callback(null, `${randomName}${extname(file.originalname)}`);
                },
            })
        } catch (err) {
            throw new InternalServerErrorException(err?.message);
        }
    }

    async deleteFile(fileId) {
        try {
            console.log(fileId);
            const result = await this.drive.files.delete({
                fileId
            })
            console.log(result.data);
            return result;
        } catch (err) {
            throw new InternalServerErrorException(err?.message)
        }
    }

    async generatePublicUrl(fileId) {
        try {
            console.log(fileId);

            const result = await this.drive.permissions.create({
                fileId,
                requestBody: {
                    role: 'reader',
                    type: 'anyone'
                }
            })

            console.log(result.data);
            return result;

        } catch (err) {
            throw new InternalServerErrorException(err?.message)
        }
    }

    async getFileLinkById(fileId) {
        try {
            console.log(fileId);

            const result = await this.drive.files.get({
                fileId,
                fields: 'webViewLink, webContentLink',
                // alt: 'media',
            })

            console.log(result.data);
            return result;

        } catch (err) {
            throw new InternalServerErrorException(err?.message)
        }
    }
    async exportPdf(fileId) {
        try {
            const result = await this.drive.files.export({
                fileId: fileId,
                mimeType: 'application/pdf',
            });
            console.log(result.status);
            return result;
        } catch (err) {
            // TODO(developer) - Handle error
            throw new InternalServerErrorException(err.message);
        }
    }

    // async resumableUploads() {
    //     try {
    //         const result = await this.drive.files.create({
    //             requestBody: {
    //                 name: "1st_image",
    //                 // mimeType: "image/jpeg",
    //             },


    //             media: {
    //                 // mimeType: "image/jpeg",
    //                 // fs.createReadStream("./uploads/cb58a10521b7810d793410b3c9646b8b7a.webp")
    //                 // fileData
    //                 body: '',
    //                 fields: 'id, name, size',
    //                 supportsAllDrives: true,
    //                 keepRevisionForever: true,
    //                 resumable: true,

    //             }
    //         })
    //         return result
    //     } catch (err) {
    //         throw new InternalServerErrorException(err?.message)
    //     }
    // }
}