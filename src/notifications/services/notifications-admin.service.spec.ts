import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { NotificationsAdminService } from './notifications-admin.service';
import { NotificationService } from '@/core/notification/notification.service';
import { NotificationsRepository } from '@/core/notification/repositories/notifications.repository';
import { NotificationStatus } from '@/core/notification/entities/notifications.entity';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const buildNotification = (overrides: Record<string, unknown> = {}) =>
  ({
    id: 'notification-uuid-1',
    template: { id: 'template-uuid-1', code: 'MAGIC_LINK' },
    email: 'user@example.com',
    phone: null,
    subject: 'Sign in',
    bodyHtml: '<p>hi</p>',
    bodyText: null,
    params: { url: 'https://example.com' },
    status: NotificationStatus.FAILED,
    ...overrides,
  }) as any;

const mockNotificationService = {
  buildNotification: jest.fn(),
  deliver: jest.fn(),
  isDeliverable: jest.fn(),
};

const mockNotificationsRepository = {
  findById: jest.fn(),
  findPaginated: jest.fn(),
  createEntity: jest.fn(),
  claimFailedForRetry: jest.fn(),
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('NotificationsAdminService', () => {
  let service: NotificationsAdminService;

  beforeEach(async () => {
    jest.resetAllMocks();
    mockNotificationService.isDeliverable.mockReturnValue(true);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsAdminService,
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: NotificationsRepository, useValue: mockNotificationsRepository },
      ],
    }).compile();

    service = module.get(NotificationsAdminService);
  });

  describe('findAll', () => {
    it('returns items with pagination meta', async () => {
      mockNotificationsRepository.findPaginated.mockResolvedValue([[buildNotification()], 45]);

      const result = await service.findAll({
        page: 2,
        pageSize: 20,
        status: NotificationStatus.SENT,
      });

      expect(mockNotificationsRepository.findPaginated).toHaveBeenCalledWith(
        { status: NotificationStatus.SENT },
        2,
        20,
      );
      expect(result.meta).toEqual({ total: 45, page: 2, pageSize: 20, pageCount: 3 });
    });
  });

  describe('findById', () => {
    it('returns the notification', async () => {
      const notification = buildNotification();
      mockNotificationsRepository.findById.mockResolvedValue(notification);

      await expect(service.findById(notification.id)).resolves.toBe(notification);
    });

    it('throws NotFoundException when it does not exist', async () => {
      mockNotificationsRepository.findById.mockResolvedValue(null);

      await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('send', () => {
    it('builds, delivers and returns the stored record without throwing on failure', async () => {
      const created = buildNotification({ status: NotificationStatus.PENDING });
      const failed = buildNotification({ status: NotificationStatus.FAILED });
      mockNotificationService.buildNotification.mockResolvedValue(created);
      mockNotificationService.deliver.mockResolvedValue(NotificationStatus.FAILED);
      mockNotificationsRepository.findById.mockResolvedValue(failed);

      const result = await service.send({
        templateCode: 'MAGIC_LINK',
        email: 'user@example.com',
        params: {},
      });

      expect(mockNotificationService.deliver).toHaveBeenCalledWith(created);
      expect(result.status).toBe(NotificationStatus.FAILED);
    });
  });

  describe('resend', () => {
    it('creates a new record with the original content and delivers it', async () => {
      const original = buildNotification({ status: NotificationStatus.SENT });
      const copy = buildNotification({
        id: 'notification-uuid-2',
        status: NotificationStatus.PENDING,
      });
      const delivered = buildNotification({
        id: 'notification-uuid-2',
        status: NotificationStatus.SENT,
      });
      mockNotificationsRepository.findById
        .mockResolvedValueOnce(original)
        .mockResolvedValueOnce(delivered);
      mockNotificationsRepository.createEntity.mockResolvedValue(copy);
      mockNotificationService.deliver.mockResolvedValue(NotificationStatus.SENT);

      const result = await service.resend(original.id);

      expect(mockNotificationsRepository.createEntity).toHaveBeenCalledWith(
        expect.objectContaining({
          email: original.email,
          subject: original.subject,
          bodyHtml: original.bodyHtml,
          params: original.params,
          status: NotificationStatus.PENDING,
        }),
      );
      expect(mockNotificationService.deliver).toHaveBeenCalledWith(copy);
      expect(result.id).toBe('notification-uuid-2');
    });

    it('throws NotFoundException when the original does not exist', async () => {
      mockNotificationsRepository.findById.mockResolvedValue(null);

      await expect(service.resend('missing')).rejects.toThrow(NotFoundException);
      expect(mockNotificationsRepository.createEntity).not.toHaveBeenCalled();
    });

    it('throws UnprocessableEntityException when there is no deliverable channel', async () => {
      mockNotificationsRepository.findById.mockResolvedValue(buildNotification({ email: null }));
      mockNotificationService.isDeliverable.mockReturnValue(false);

      await expect(service.resend('notification-uuid-1')).rejects.toThrow(
        UnprocessableEntityException,
      );
    });
  });

  describe('retry', () => {
    it('claims the failed notification and delivers it in place', async () => {
      const failed = buildNotification();
      const sent = buildNotification({ status: NotificationStatus.SENT });
      mockNotificationsRepository.findById
        .mockResolvedValueOnce(failed)
        .mockResolvedValueOnce(sent);
      mockNotificationsRepository.claimFailedForRetry.mockResolvedValue(true);
      mockNotificationService.deliver.mockResolvedValue(NotificationStatus.SENT);

      const result = await service.retry(failed.id);

      expect(mockNotificationsRepository.claimFailedForRetry).toHaveBeenCalledWith(failed.id);
      expect(mockNotificationService.deliver).toHaveBeenCalledWith(failed);
      expect(result.status).toBe(NotificationStatus.SENT);
    });

    it('throws ConflictException and does not send when it is not failed', async () => {
      mockNotificationsRepository.findById.mockResolvedValue(
        buildNotification({ status: NotificationStatus.SENT }),
      );
      mockNotificationsRepository.claimFailedForRetry.mockResolvedValue(false);

      await expect(service.retry('notification-uuid-1')).rejects.toThrow(ConflictException);
      expect(mockNotificationService.deliver).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when it does not exist', async () => {
      mockNotificationsRepository.findById.mockResolvedValue(null);

      await expect(service.retry('missing')).rejects.toThrow(NotFoundException);
    });
  });
});
