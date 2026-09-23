import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: +process.env.SMTP_PORT!,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  async send(to: string, subject: string, html: string, replyTo?: string) {
    return this.transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
      replyTo,
    });
  }
}
