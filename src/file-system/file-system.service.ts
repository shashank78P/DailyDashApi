import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { google } from 'googleapis';
import * as fs from "node:fs"

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

    constructor() {
        this.oauth2Client = new google.auth.OAuth2({
            clientId: "168934949203-4nfd5hoffeqproi3uc6gvr5tret70te2.apps.googleusercontent.com",
            clientSecret: "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",
            redirectUri: "https://developers.google.com/oauthplayground",
        })
        this.oauth2Client.setCredentials({ refresh_token: "1//04zfPE3N5tljSCgYIARAAGAQSNwF-L9IrlzaktNHL7oWLaoozcfx0YA1J33iDtdXZkSmicBF4VNgLofqDvdsmyWIGpBedr4cqAPM" })

        this.drive = google.drive({
            version: 'v3',
            auth: this.oauth2Client
        })
    }
    async uploadFile(fileData, req) {
        try {
            console.log(fileData)
            const response = await this.drive.files.create({
                requestBody: {
                    name: "1st_image",
                    mimeType: "image/jpeg",
                },
                media: {
                    mimeType: "image/jpeg",
                    body: fileData?.file
                    // fs.createReadStream(fileData)

                }
            })
            console.log(response)
            return response
        } catch (err) {
            throw new InternalServerErrorException(err?.message)
        }
    }
}
