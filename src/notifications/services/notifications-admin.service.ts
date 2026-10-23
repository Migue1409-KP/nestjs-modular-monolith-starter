import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  BuildNotificationInput,
  NotificationService,
} from '@/core/notification/notification.service';
import { NotificationsRepository } from '@/core/notification/repositories/notifications.repository';
import {
  Notification,
  NotificationStatus,
} from '@/core/notification/entities/notifications.entity';
import { OffsetPaginationMeta } from '@/shared/interfaces/api-response';
import { ListNotificationsQueryDto } from '../dto/list-notifications.dto';
import { SendNotificationDto } from '../dto/send-notification.dto';

@Injectable()
export class NotificationsAdminService {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly notificationsRepository: NotificationsRepository,
  ) {}

  async findAll(
    query: ListNotificationsQueryDto,
  ): Promise<{ items: Notification[]; meta: OffsetPaginationMeta }> {
    const { page, pageSize, ...filters } = query;
    const [items, total] = await this.notificationsRepository.findPaginated(
      filters,
      page,
      pageSize,
    );

    return {
      items,
      meta: { total, page, pageSize, pageCount: Math.ceil(total / pageSize) },
    };
  }

  async findById(id: string): Promise<Notification> {
    const notification = await this.notificationsRepository.findById(id);
    if (!notification) {
      throw new NotFoundException({ message: `Notification not found: ${id}` });
    }
    return notification;
  }

  /** Launches a brand-new notification. A delivery failure is reflected in `status`, not thrown. */
  async send(data: SendNotificationDto): Promise<Notification> {
    // strictNullChecks is off, so zod infers every field as optional; the schema guarantees templateCode.
    const notification = await this.notificationService.buildNotification(
      data as BuildNotificationInput,
    );
    await this.notificationService.deliver(notification);
    return await this.findById(notification.id);
  }

  /** Sends the same content again as a NEW record, leaving the original untouched. */
  async resend(id: string): Promise<Notification> {
    const original = await this.findById(id);
    this.assertDeliverable(original);

    const copy = await this.notificationsRepository.createEntity({
      template: original.template,
      email: original.email,
      phone: original.phone,
      subject: original.subject,
      bodyHtml: original.bodyHtml,
      bodyText: original.bodyText,
      params: original.params,
      status: NotificationStatus.PENDING,
    });
    await this.notificationService.deliver(copy);

    return await this.findById(copy.id);
  }

  /** Retries a FAILED notification in place (failed -> pending -> sent | failed). */
  async retry(id: string): Promise<Notification> {
    const notification = await this.findById(id);
    this.assertDeliverable(notification);

    // Atomic claim so two concurrent retries cannot both send the email.
    const claimed = await this.notificationsRepository.claimFailedForRetry(id);
    if (!claimed) {
      throw new ConflictException({
        message: `Only failed notifications can be retried (current status: ${notification.status})`,
      });
    }

    await this.notificationService.deliver(notification);
    return await this.findById(id);
  }

  private assertDeliverable(notification: Notification): void {
    if (!this.notificationService.isDeliverable(notification)) {
      throw new UnprocessableEntityException({
        message: 'Notification has no deliverable channel (email with HTML body required)',
      });
    }
  }
}
