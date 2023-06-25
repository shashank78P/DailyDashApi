import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as sgMail from "@sendgrid/mail"
import * as path from "node:path"
import fs from "fs"
import * as ejs from "ejs"
@Injectable()
export class MailServiceService {
    //     function loadTemplate(templateName: string, data: object): Promise<string> {
    //     const templatePath = path.join(__dirname, 'templates', `${templateName}.ejs`);
    //     return new Promise<string>((resolve, reject) => {
    //         fs.readFile(templatePath, 'utf8', (err, fileContent) => {
    //             if (err) {
    //                 reject(err);
    //             } else {
    //                 const renderedContent = ejs.render(fileContent, data);
    //                 resolve(renderedContent);
    //             }
    //         });
    //     });
    // }

    // sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    async sendMail(toEmail: string, subject: string, text: string, templateName: string, data: any) {
        try {
            await ejs.renderFile(`${"src"}/mail-service/templates/password-reset.ejs`, data, (err, renderedHtml) => {
                if (err) {
                    throw new InternalServerErrorException(err?.message)
                }
                console.log(renderedHtml)
                sgMail.setApiKey("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")
                const msg = {
                    to: toEmail,
                    from: 'dailydash155@gmail.com',
                    subject: subject,
                    text: text,
                    html: renderedHtml,
                }


                console.log(renderedHtml)
                sgMail
                    .send(msg)
                    .then(() => {
                        console.log('Email sent')
                    })
                    .catch((error) => {
                        console.error(error)
                        return error
                    })
            })

        } catch (err) {
            throw new InternalServerErrorException(err?.message);
        }
    }
}
