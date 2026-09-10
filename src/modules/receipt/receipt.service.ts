import { Injectable } from '@nestjs/common';
//import puppeteer from 'puppeteer'
import * as dayjs from 'dayjs';
import * as path from 'path';
import * as fs from 'fs';
import { RedisIdService } from 'src/services/utils/redis-id.service';
import { chromium } from 'playwright';

interface ItemProps {
  name: string;
  ref: string;
  value: string;
  description: string;
  date: string;
}

@Injectable()
export class ReceiptService {
  //private receiptNumber = 1852

  constructor(private readonly redis: RedisIdService) {}

  /*private getNextReceiptNumber(): number {
    this.receiptNumber += 1
    return this.receiptNumber
  }*/

  private getSignatureBase64(): string {
    const filePath = path.resolve(__dirname, '../../assets/signature.png');
    const file = fs.readFileSync(filePath);

    return `data:image/png;base64,${file.toString('base64')}`;
  }

  private formatDate(date: Date): string {
    return dayjs(date).format('DD / MM / YYYY');
  }

  private formatPeriod(date: Date): string {
    return dayjs(date).format('MM / YYYY');
  }

  private formatValue(value: number): string {
    if (!value || isNaN(value)) return '';

    return Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(value / 100);
  }

  private buildHTML(data: {
    receiptNumber: number;
    date: string;
    period: string;
    item?: ItemProps;
  }): string {
    const signature = this.getSignatureBase64();
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
    a quantia de ${data.item?.value}, referente à ${data.item?.description} ${data.item?.ref}.
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
`;
  }

  async generate(): Promise<Buffer> {
    const now = new Date();

    const receiptNumber = await this.redis.generate();
    const date = this.formatDate(now);
    const period = this.formatPeriod(now);

    const mensal: ItemProps = {
      name: 'Manutenção Mensal',
      ref: 'solurh.pro',
      value: this.formatValue(10000),
      description: 'Manutenção mensal do site',
      date,
    };

    const item: ItemProps = {
      name: 'Renovação de Domínio',
      ref: 'solurh.pro',
      value: this.formatValue(16710),
      description: 'Renovação anual de domínio',
      date,
    };

    const html = this.buildHTML({
      receiptNumber,
      date,
      period,
      item: mensal,
    });

    /*const browser = await puppeteer.launch({
      executablePath: '/usr/bin/chromium',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true
    })*/
    const browser = await chromium.launch({
      args: ['--no-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(html /*,{ waitUntil: 'networkidle0'}*/);

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
    });

    await browser.close();

    return Buffer.from(pdf);
  }
}
