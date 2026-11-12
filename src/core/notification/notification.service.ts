import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { NotificationsRepository } from './repositories/notifications.repository';
import { Notification, NotificationStatus } from './entities/notifications.entity';
import { NotificationTemplateTranslationsRepository } from './repositories/notification-template-translations.repository';
import { IMailProvider, MAIL_PROVIDER } from './interfaces/mail-provider.interface';
import { renderTemplate } from './utils/render-template.util';

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

  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly notificationTemplateTranslationsRepository: NotificationTemplateTranslationsRepository,
    @Inject(MAIL_PROVIDER) private readonly mailProvider: IMailProvider,
  ) {}

  // ----------------------------------------------------------------
  // Armar, registrar y enviar esperando el resultado (lanza si el envío falla)
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
  // Armar y registrar la notificación; la entrega corre en segundo plano.
  // Un fallo del proveedor no rompe el flujo que la dispara (p. ej. el magic link):
  // la notificación queda FAILED y puede reintentarse desde el módulo admin.
  // ----------------------------------------------------------------
  async notify(data: BuildNotificationInput): Promise<Notification> {
    const notification = await this.buildNotification(data);
    void this.deliver(notification).catch((error) =>
      this.logger.error(
        `Unexpected error delivering notification ${notification.id}: ${
          error instanceof Error ? error.message : error
        }`,
      ),
    );
    return notification;
  }

  // ----------------------------------------------------------------
  // Renderiza el template y registra la notificación en estado PENDING
  // ----------------------------------------------------------------
  async buildNotification(data: BuildNotificationInput): Promise<Notification> {
    const { email, phone, subject, templateCode, params = {} } = data;

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

    // Reemplazar placeholders dinámicos. El HTML escapa los valores; asunto y SMS son texto plano.
    const renderText = (templateStr: string | null): string | null =>
      templateStr ? renderTemplate(templateStr, params) : null;

    const html = template.htmlTemplate
      ? renderTemplate(template.htmlTemplate, params, { escape: true })
      : null;
    const sms = renderText(template.smsTemplate);
    const finalSubject = subject ?? renderText(template.subject) ?? 'Notification';

    // Registrar la notificación en la base de datos
    return await this.notificationsRepository.createEntity({
      template: template.template,
      email: email,
      phone: phone,
      subject: finalSubject,
      bodyHtml: html,
      bodyText: sms,
      params,
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
      const status = await this.mailProvider
        .send({
          to: notification.email,
          subject: notification.subject ?? 'Notification',
          html: notification.bodyHtml,
        })
        .then(() => NotificationStatus.SENT)
        .catch((error) => {
          this.logger.error(
            `Failed to send notification ${notification.id}: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`,
          );
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
}
