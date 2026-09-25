import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
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

  onModuleInit(): void {
    this.logger.log(
      `SMTP transport configured host=${process.env.SMTP_HOST ?? 'unset'} port=${process.env.SMTP_PORT ?? '587'} secure=${process.env.SMTP_SECURE === 'true'} authConfigured=${Boolean(process.env.SMTP_USER && process.env.SMTP_PASS)}`,
    );
  }

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
