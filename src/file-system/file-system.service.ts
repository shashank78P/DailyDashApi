import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { google } from 'googleapis';
import * as fs from "node:fs"
import { Readable } from 'node:stream';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { FileSystem, FileSystemDocument } from './schema/file-system.schema';
import mongoose, { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import axios from 'axios';
import { buffer } from 'node:stream/consumers';

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
            clientId: "369956568963-c8tem7646hp3je8k9q5q6g8etudppui9.apps.googleusercontent.com",
            clientSecret: "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",
            redirectUri: "https://developers.google.com/oauthplayground",
        })
        this.oauth2Client.setCredentials({ refresh_token: "1//04vN74GOIIp3NCgYIARAAGAQSNwF-L9Ir2N_Q6PXquhuyVCwDFdeWOeGslW7AYJHt-P5tF4QhbIFclAN6wggLkJcqmzuSUnaE1tc" })

        this.drive = google.drive({
            version: 'v3',
            auth: this.oauth2Client
        }
        )
    }
    async uploadFile(file) {
        try {
            console.log(file)
            const { mimetype, filename } = file;
            const response = await this.drive.files.create({
                requestBody: {
                    name: filename,
                    mimeType: mimetype,
                },


                media: {
                    parent: "userProfile",
                    mimeType: mimetype,
                    body: fs.createReadStream(`./uploads/${filename}`)
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
            return result;
        } catch (err) {
            console.log(err?.message);
            throw new InternalServerErrorException(err?.message)
        }
    }

    async uploadFileAndGetUrl(file) {
        try {
            const result = await this.uploadFile(file);

            const fileId: String = result?.[0]?.FileId
            if (fileId) {
                await this.generatePublicUrl(fileId)
                const link = await this.getFileLinkById(fileId)
                return { ...link, fileId }
            } else {
                throw new BadRequestException("error in upload")
            }
        } catch (err) {
            throw new InternalServerErrorException(err?.message)
        }
    }

    async uploadFileToLocal(file) {
        try {
            storage: diskStorage({
                destination: './uploads', 
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

    async generatePublicUrl(fileId: String) {
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
            return result?.data;

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

    async uploadVideoBase64Data(body :any) {
        try {
            console.log(body);
            console.log(body?.file)
            const data = body?.file?.replace(/^data:video\/mp4;base64,/, '');

            // Converting base64 to binary
            const buffer = Buffer.from(data, 'base64');

            const randomName = Array(32).fill(null).map(()=>Math.round(Math.random()*16).toString(16)).join('')

            fs.writeFileSync(`${randomName}.webm`, buffer, {encoding : "binary"});
            const response = await this.drive.files.create({
                requestBody: {
                    name: `${randomName}.webm`,
                    mimeType: "video/webm",
                },
                media: {
                    parent: "userProfile",
                    mimeType: "video/webm",
                    body: fs.createReadStream(`./${randomName}.webm`)
                }
            })
            return response;
        } catch (err) {
            throw new InternalServerErrorException(err?.message)
        }
    }
    
    async uploadAudioBase64Data(body :any) {
        try {
            console.log(body);
            console.log(body?.file)
            const data = body?.file?.replace(/^data:audio\/mp4;base64,/, '');

            // Converting base64 to binary
            const buffer = Buffer.from(data, 'base64');

            const randomName = Array(32).fill(null).map(()=>Math.round(Math.random()*16).toString(16)).join('')

            fs.writeFileSync(`${randomName}.webm`, buffer, {encoding : "binary"});
            const response = await this.drive.files.create({
                requestBody: {
                    name: `${randomName}.webm`,
                    mimeType: "audio/webm",
                },
                media: {
                    parent: "userProfile",
                    mimeType: "audio/webm",
                    body: fs.createReadStream(`./${randomName}.webm`)
                }
            })
            return response;
        } catch (err) {
            throw new InternalServerErrorException(err?.message)
        }
    }
}