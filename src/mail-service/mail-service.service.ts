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
            console.log(toEmail, subject, text);
            await ejs.renderFile(`${"src"}/mail-service/templates/${templateName}.ejs`, data, (err, renderedHtml) => {

                if (err) {
                    throw new InternalServerErrorException(err?.message)
                }
                // sgMail.setApiKey("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")
                sgMail.setApiKey(process.env.EMAIL_API_KEY)
                    // ""
                const msg = {
                    to: toEmail,
                    from: 'dailydash155@gmail.com',
                    subject: (subject) ? subject : "Subject",
                    text: (text) ? text : "text",
                    html: renderedHtml,
                }


                console.log("renderedHtml")
                sgMail
                    .send(msg)
                    .then(() => {
                        console.log('Email sent')
                        return "Mail send successfully";
                    })
                    .catch((error) => {
                        console.error("error?.message")
                        console.error(error?.response?.body)
                        return error
                    })
                console.log(renderedHtml)
            })

        } catch (err) {
            console.log(err)
            throw new InternalServerErrorException(err);
        }
    }
}
