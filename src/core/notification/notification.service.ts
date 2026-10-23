import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { NotificationsRepository } from './repositories/notifications.repository';
import { NotificationTemplatesRepository } from './repositories/notification-templates.repository';
import { Notification, NotificationStatus } from './entities/notifications.entity';
import { NotificationTemplateTranslationsRepository } from './repositories/notification-template-translations.repository';

export interface BuildNotificationInput {
  email?: string;
  phone?: string;
  subject?: string;
  templateCode: string;
  params: Record<string, string>;
  languageCode?: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly ses: SESClient;
  private readonly sender: string;
  private readonly defaultParams: Record<string, string>;

  constructor(
    private readonly configService: ConfigService,
    private readonly notificationsRepository: NotificationsRepository,
    private readonly notificationTemplateTranslationsRepository: NotificationTemplateTranslationsRepository,
  ) {
    this.ses = new SESClient({
      region: this.configService.get<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID')!,
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY')!,
      },
    });

    this.sender = this.configService.get<string>('AWS_SES_SENDER')!;

    // Parámetros por defecto para templates (pueden ser sobrescritos por params específicos)
    this.defaultParams = {
      emailSupportNotification: '',
    };
  }

  async onModuleInit() {
    await this.initializeDefaultParams();
  }

  private async initializeDefaultParams() {
    try {
      // Cargar parámetros por defecto desde la base de datos o configuración
      // const emailSupport = await this.businessParametersRepository.getValueByKey<{ email: string }>('email_support_notification');
      // if (emailSupport?.email) {
      //   this.defaultParams.emailSupportNotification = emailSupport.email;
      // }
    } catch (error) {
      this.logger.warn('Failed to load email support notification parameter', error);
    }
  }

  // ----------------------------------------------------------------
  // método principal: armar y enviar notificación
  // ----------------------------------------------------------------
  async buildAndSendNotification(data: BuildNotificationInput) {
    const notificationRecord = await this.buildNotification(data);
    const status = await this.deliver(notificationRecord);

    if (status === NotificationStatus.FAILED) {
      throw new InternalServerErrorException({
        message: `Failed to send email to ${notificationRecord.email}`,
      });
    }

    return { success: true };
  }

  // ----------------------------------------------------------------
  // Renderiza el template y registra la notificación en estado PENDING
  // ----------------------------------------------------------------
  async buildNotification(data: BuildNotificationInput): Promise<Notification> {
    const { email, phone, subject, templateCode, params } = data;

    const mergedParams = { ...this.defaultParams, ...params };

    // consultar template
    let template =
      await this.notificationTemplateTranslationsRepository.findByTemplateCodeAndLanguageCode(
        templateCode,
        data.languageCode || 'en',
      );
    if (!template) {
      template =
        await this.notificationTemplateTranslationsRepository.findByTemplateCodeAndLanguageCode(
          templateCode,
          'en',
        );

      if (!template) {
        throw new NotFoundException({
          message: `Template not found for code: ${templateCode}`,
        });
      }
    }

    // Reemplazar placeholders dinámicos
    const render = (templateStr: string | null): string | null => {
      if (!templateStr) return null;
      let result = templateStr;
      Object.entries(mergedParams).forEach(([key, value]) => {
        result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
      });
      return result;
    };

    const html = render(template.htmlTemplate);
    const sms = render(template.smsTemplate);
    const finalSubject = subject ?? render(template.subject) ?? 'Notification';

    // Registrar la notificación en la base de datos
    return await this.notificationsRepository.createEntity({
      template: template.template,
      email: email,
      phone: phone,
      subject: finalSubject,
      bodyHtml: html,
      bodyText: sms,
      params: mergedParams,
      status: NotificationStatus.PENDING,
    });
  }

  // ----------------------------------------------------------------
  // Si la notificación tiene un canal entregable (por ahora solo email)
  // ----------------------------------------------------------------
  isDeliverable(notification: Pick<Notification, 'email' | 'bodyHtml'>): boolean {
    return Boolean(notification.email && notification.bodyHtml);
  }

  // ----------------------------------------------------------------
  // Entrega una notificación ya registrada y persiste el estado resultante.
  // No lanza si el envío falla: devuelve FAILED. Sin canal entregable queda PENDING.
  // ----------------------------------------------------------------
  async deliver(notification: Notification): Promise<NotificationStatus> {
    // Enviar email si corresponde
    if (this.isDeliverable(notification)) {
      const status = await this.sendEmail(
        notification.email,
        notification.subject ?? 'Notification',
        notification.bodyHtml,
      )
        .then(() => NotificationStatus.SENT)
        .catch(() => {
          this.logger.error(`Failed to send notification ${notification.id}`);
          return NotificationStatus.FAILED;
        });

      await this.notificationsRepository.updateEntity(notification.id, {
        status,
        ...(status === NotificationStatus.SENT && { sentAt: new Date() }),
      });

      return status;
    }

    // Enviar SMS si corresponde (por ahora deshabilitado)

    return NotificationStatus.PENDING;
  }

  // ----------------------------------------------------------------
  // Enviar correo electrónico con AWS SES
  // ----------------------------------------------------------------
  private async sendEmail(to: string, subject: string, html: string) {
    try {
      const command = new SendEmailCommand({
        Destination: { ToAddresses: [to] },
        Message: {
          Body: { Html: { Data: html, Charset: 'UTF-8' } },
          Subject: { Data: subject, Charset: 'UTF-8' },
        },
        Source: this.sender,
      });

      await this.ses.send(command);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to send email to ${to}: ${errorMessage}`);

      const statusCode = (error as any).$metadata?.httpStatusCode;

      this.handleAuthError(
        statusCode || 500,
        `Failed to send email to ${to} error: ${errorMessage}`,
      );
    }
  }

  private handleAuthError(status: number, message?: string): never {
    switch (status) {
      case 400:
        throw new BadRequestException(message || 'Invalid request data');
      case 401:
        throw new UnauthorizedException(message || 'Unauthorized: Invalid credentials');
      case 403:
        throw new ForbiddenException(message || 'Forbidden: Access denied');
      case 404:
        throw new NotFoundException(message || 'User or resource not found');
      case 422:
        throw new UnprocessableEntityException(
          message || 'Validation error: Please check your input',
        );
      case 429:
        throw new UnprocessableEntityException({
          statusCode: 429,
          message: message || 'Too many requests: Please try again later',
          error: 'Too Many Requests',
        });
      case 500:
        throw new InternalServerErrorException(
          message || 'Internal server error: Please try again',
        );
      default:
        throw new Error(`Unexpected error: Status ${status}`);
    }
  }
}
