import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { google } from 'googleapis';
import * as fs from "node:fs"
const fileSyetem = require('fs').promises;

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
        this.oauth2Client.setCredentials({ refresh_token: "1//04pm1tHFdbCpQCgYIARAAGAQSNwF-L9IrpOtsBEg-BFmDxaQvtVr-jci9c5z6VO507Ci59v441GVK5MQLCMsq9kg-EO6PWFgwHn4" })

        this.drive = google.drive({
            version: 'v3',
            auth: this.oauth2Client
        }
        )
    }

    async uploadFileToDrive(filename: string, mimetype: string) {
        try {
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
            console.log(response)
            if (response?.headers?.status == 200) {
                throw new BadRequestException("File Not Uploaded Sucessfully")
            }
            return response;
        } catch (err) {
            throw new InternalServerErrorException(err);
        }
    }
    async uploadFile(user, file) {
        try {
            console.log(file)
            const { mimetype, filename } = file;
            const response = await this.uploadFileToDrive(filename, mimetype);
            const { id, mimeType, name } = response?.["data"];

            const filePath = `./uploads/${name}`;
            await fs.promises.unlink(filePath);
            if (!id) {
                throw new BadRequestException("Upload failed")
            }
            await this.generatePublicUrl(user, id)
            const fileLink = await this.getFileLinkById(user, id);
            let result = await this.FileSystemModel.insertMany([{ FileId: id, mimeType, FileName: name, link: fileLink?.webContentLink, createdBy: user?._id }])
            return result;

        } catch (err) {
            console.log(err);
            throw new InternalServerErrorException(err?.message)
        }
    }

    async uploadFileAndGetUrl(user, file) {
        try {
            const result = await this.uploadFile(user, file);

            const fileId: String = result?.[0]?.FileId
            if (fileId) {
                await this.generatePublicUrl(user, fileId)
                const link = await this.getFileLinkById(user, fileId)
                return { ...link, fileId }
            } else {
                throw new BadRequestException("error in upload")
            }
        } catch (err) {
            throw new InternalServerErrorException(err?.message)
        }
    }

    async uploadFileToLocal(user, file) {
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

    async deleteFile(user, fileId) {
        try {
            console.log("deleting file")
            console.log(fileId)
            const file = await this.FileSystemModel.findOne({ _id: new mongoose.Types.ObjectId(fileId) })
            console.log(file)
            if (file?.FileId) {
                await this.FileSystemModel.deleteOne({ _id: new mongoose.Types.ObjectId(fileId) })
            }

            const result = await this.drive.files.delete({
                fileId: file?.FileId
            })
            console.log(result)
            console.log("deleted file")
            return result;
        } catch (err) {
            throw new InternalServerErrorException(err?.message)
        }
    }

    async generatePublicUrl(user, fileId: String) {
        try {

            const result = await this.drive.permissions.create({
                fileId,
                requestBody: {
                    role: 'reader',
                    type: 'anyone'
                }
            })

            return result;

        } catch (err) {
            throw new InternalServerErrorException(err?.message)
        }
    }

    async getFileLinkById(user, fileId) {
        try {

            const result = await this.drive.files.get({
                fileId,
                fields: 'webViewLink, webContentLink',
                // alt: 'media',
            })

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

    async uploadVideoBase64Data(user, body: any) {
        try {
            const data = body?.file?.replace(/^data:video\/mp4;base64,/, '');

            // Converting base64 to binary
            const buffer = Buffer.from(data, 'base64');

            const randomName = Array(32).fill(null).map(() => Math.round(Math.random() * 16).toString(16)).join('')

            fs.writeFileSync(`./uploads/${randomName}.webm`, buffer, { encoding: "binary" });
            const response = await this.drive.files.create({
                requestBody: {
                    name: `${randomName}.webm`,
                    mimeType: "video/webm",
                },
                media: {
                    parent: "userProfile",
                    mimeType: "video/webm",
                    body: fs.createReadStream(`./uploads/${randomName}.webm`)
                }
            })
            const { id, mimeType, name } = response?.["data"];
            if (response?.headers?.status == 200) {
                throw new BadRequestException("File Not Uploaded Sucessfully")
            }

            // Delete the file from your local server (assuming you are storing it locally)
            const filePath = `./uploads/${randomName}.webm`;
            // fs.unlinkSync(filePath);

            await fs.promises.unlink(filePath);
            if (!id) {
                throw new BadRequestException("Not uploaded successfully")
            }
            await this.generatePublicUrl(user, id)
            const fileLink = await this.getFileLinkById(user, id);
            const result = await this.FileSystemModel.insertMany([{
                FileId: id,
                mimeType,
                FileName: name,
                link: fileLink?.webContentLink,
                uploadedBy: user?._id,
                // belongsTo : 
            }])
            return result;

        } catch (err) {
            throw new InternalServerErrorException(err?.message)
        }
    }

    async uploadAudioBase64Data(user, body: any) {
        try {
            const data = body?.file?.replace(/^data:audio\/wav;base64,/, '');

            // Converting base64 to binary
            const buffer = Buffer.from(data, 'base64');

            const randomName = Array(32).fill(null).map(() => Math.round(Math.random() * 16).toString(16)).join('')

            fs.writeFileSync(`./uploads/${randomName}.wav`, buffer, { encoding: "binary" });
            const response = await this.drive.files.create({
                requestBody: {
                    name: `${randomName}.wav`,
                    mimeType: "audio/wav",
                },
                media: {
                    parent: "userProfile",
                    mimeType: "audio/wav",
                    body: fs.createReadStream(`./uploads/${randomName}.wav`)
                }
            })
            const { id, mimeType, name } = response?.["data"];
            if (response?.headers?.status == 200) {
                throw new BadRequestException("File Not Uploaded Sucessfully")
            }

            // Delete the file from your local server (assuming you are storing it locally)
            const filePath = `./uploads/${randomName}.wav`;
            // fs.unlinkSync(filePath);

            await fs.promises.unlink(filePath);

            if (!id) {
                throw new BadRequestException("Not uploaded successfully")
            }
            await this.generatePublicUrl(user, id)
            const fileLink = await this.getFileLinkById(user, id);
            const result = await this.FileSystemModel.insertMany([{ FileId: id, mimeType, FileName: name, link: fileLink?.webContentLink }])
            return result;
        } catch (err) {
            throw new InternalServerErrorException(err?.message)
        }
    }

    async getFileById(userId: string, fileId: string) {
        try {
            return await this.FileSystemModel.findOne({
                _id: new mongoose.Types.ObjectId(fileId),
                uploadedBy: new mongoose.Types.ObjectId(userId)
            })
        } catch (err) {
            throw new InternalServerErrorException(err?.message)
        }
    }

    async uploadGetOtherWebSiteIcoByLink(user: any, link: string) {
        try {
            const response: any = await fetch(`https://www.google.com/s2/favicons?sz=64&domain=${link}`, {
                method: 'GET',
                // mode: 'no-cors',
                // credentials: "omit",
            });
            const buffer = await response.arrayBuffer();
            const fileName = Array(32)
                .fill(null)
                .map(() => Math.round(Math.random() * 16).toString(16))
                .join('');
            const filePath = `./uploads/${fileName}.png`;
            fileSyetem?.writeFile(filePath, Buffer.from(buffer));

            const uploadedFile = await this.uploadFileToDrive(`${fileName}.png`, "image/png")
            await fs.promises.unlink(filePath);

            console.log(uploadedFile?.["data"])

            const { id, mimeType, name } = uploadedFile?.["data"];

            if (!id) {
                throw new BadRequestException("Upload failed")
            }
            await this.generatePublicUrl(user, id)
            const fileLink = await this.getFileLinkById(user, id);
            let result = await this.FileSystemModel.insertMany([{ FileId: id, mimeType, FileName: name, link: fileLink?.webContentLink, createdBy: user?._id }])
            return result;

        } catch (err) {
            console.log(err)
            throw new InternalServerErrorException(err?.message)
        }
    }
}
