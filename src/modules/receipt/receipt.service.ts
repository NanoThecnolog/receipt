import { Injectable } from '@nestjs/common'
import puppeteer from 'puppeteer'
import * as dayjs from 'dayjs'
import * as path from 'path'
import * as fs from 'fs'
import { RedisIdService } from 'src/services/utils/redis-id.service'

@Injectable()
export class ReceiptService {
  //private receiptNumber = 1852

  constructor(private readonly redis: RedisIdService) { }

  /*private getNextReceiptNumber(): number {
    this.receiptNumber += 1
    return this.receiptNumber
  }*/

  private getSignatureBase64(): string {
    const filePath = path.resolve(__dirname, '../../assets/signature.png')
    const file = fs.readFileSync(filePath)

    return `data:image/png;base64,${file.toString('base64')}`
  }

  private formatDate(date: Date): string {
    return dayjs(date).format('DD / MM / YYYY')
  }

  private formatPeriod(date: Date): string {
    return dayjs(date).format('MM / YYYY')
  }

  private buildHTML(data: {
    receiptNumber: number
    date: string
    period: string
  }): string {
    const signature = this.getSignatureBase64()
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 60px;
      font-size: 14px;
      line-height: 1.6;
      color: #242424;
    }

    .title {
      font-weight: bold;
      margin-bottom: 30px;
    }
    .block {
      margin-bottom: 20px;
    }

    .label {
      font-weight: bold;
    }

    .spaced {
      margin-top: 25px;
    }

    .signature{
      position: absolute;
      bottom: 120px;
      left: 50px;
      
    }
    .signature img {
      width: 120px;
      max-width: 100%;
    }
      .signature-line {
      width: 220px;
      border-top: 1px solid #000;
      margin-top: 5px;
      padding-top: 5px;
      font-size: 12px;
    }

    .footer {
      margin-top: 40px;
    }
  </style>
</head>
<body>

  <div class="title">RECIBO DE PRESTAÇÃO DE SERVIÇOS</div>

  <div class="block">
    <span class="bold">RECIBO Nº:</span> ${data.receiptNumber}<br/>
    <span class="bold">DATA:</span> ${data.date}
  </div>

  <div class="block">
    Recebi de SoluRH - Soluções em Recursos Humanos,<br/>
    CPF/CNPJ: 64503996/0001-30,
  </div>

  <div class="block">
    a quantia de R$ 100,00 (cem reais), referente à prestação de serviços de manutenção mensal do site.
  </div>

  <div class="block spaced">
    <div class="label">Período referente:</div>
    ${data.period}
  </div>

  <div class="block spaced">
    <div class="label">Forma de pagamento:</div>
    Pix – chave 21966296556
  </div>

  <div class="block spaced">
    <div class="label">Prestador de serviços:</div>
    Nome: Ericsson Gomes<br/>
    CPF/CNPJ: 14510752784<br/>
    E-mail: contato@ericssongomes.com<br/>
    Telefone: 21 966296556
  </div>

  <div class="footer">
    Rio de Janeiro/RJ, ${data.date}
  </div>

  <div class="signature">
    <img src="${signature}" />
    <div class="signature-line">
      Assinatura do prestador
    </div>
  </div>

</body>
</html>
`
  }

  async generate(): Promise<Buffer> {
    const now = new Date()

    const receiptNumber = await this.redis.generate()
    const date = this.formatDate(now)
    const period = this.formatPeriod(now)

    const html = this.buildHTML({
      receiptNumber,
      date,
      period
    })

    const browser = await puppeteer.launch({
      headless: true
    })

    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true
    })

    await browser.close()

    return Buffer.from(pdf)
  }
}