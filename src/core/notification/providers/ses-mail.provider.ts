import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { IMailProvider, SendMailParams } from '../interfaces/mail-provider.interface';

@Injectable()
export class SesMailProvider implements IMailProvider {
  private readonly logger = new Logger(SesMailProvider.name);
  private readonly ses: SESClient;
  private readonly sender: string;

  constructor(configService: ConfigService) {
    this.ses = new SESClient({
      region: configService.get<string>('AWS_REGION'),
      credentials: {
        accessKeyId: configService.get<string>('AWS_ACCESS_KEY_ID')!,
        secretAccessKey: configService.get<string>('AWS_SECRET_ACCESS_KEY')!,
      },
    });
    this.sender = configService.get<string>('AWS_SES_SENDER')!;
  }

  async send({ to, subject, html }: SendMailParams): Promise<void> {
    try {
      await this.ses.send(
        new SendEmailCommand({
          Destination: { ToAddresses: [to] },
          Message: {
            Body: { Html: { Data: html, Charset: 'UTF-8' } },
            Subject: { Data: subject, Charset: 'UTF-8' },
          },
          Source: this.sender,
        }),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to send email to ${to}: ${message}`);
      throw error;
    }
  }
}
