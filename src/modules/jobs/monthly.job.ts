// monthly.job.ts
import { Injectable } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import * as nodemailer from 'nodemailer'
import { ReceiptService } from '../receipt/receipt.service'

@Injectable()
export class MonthlyJob {
    constructor(private readonly receiptService: ReceiptService) { }
    //'*/1 * * * *'
    @Cron('0 9 10 * *', {
        timeZone: 'America/Sao_Paulo'
    })
    async handle() {
        console.log("handle iniciando...")
        const pdfBuffer = await this.receiptService.generate()
        console.log("Solicitando envio de email")
        await this.sendEmail(pdfBuffer)
    }

    private async sendEmail(pdf: Buffer) {
        console.log("enviando email")
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: Number(process.env.SMTP_PORT) === 465,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            pool: true,
            maxConnections: 2,
            maxMessages: 50,

            connectionTimeout: 10_000,
            greetingTimeout: 10_000,
            socketTimeout: 20_000
        })

        await transporter.sendMail({
            from: '"Ericsson Gomes" <contato@ericssongomes.com>',
            to: process.env.Recipient,
            subject: 'Recibo mensal',
            text: 'Segue recibo em anexo',
            attachments: [
                {
                    filename: 'recibo.pdf',
                    content: pdf
                }
            ]
        })
        console.log("email enviado")
        setTimeout(async () => {
            await transporter.sendMail({
                from: '"Ericsson Gomes" <contato@ericssongomes.com>',
                to: 'ericssongomes.fotografia@gmail.com',
                subject: 'Recibo mensal',
                text: 'Segue recibo em anexo',
                attachments: [
                    {
                        filename: 'recibo.pdf',
                        content: pdf
                    }
                ]
            })
        }, 5000)

    }
}