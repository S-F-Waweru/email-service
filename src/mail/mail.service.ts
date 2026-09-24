import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      : undefined,
  });

  async send(
    to: string,
    subject: string,
    html: string,
    text: string,
    replyTo?: string,
  ) {
    return this.transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
      text,
      replyTo,
    });
  }
}
