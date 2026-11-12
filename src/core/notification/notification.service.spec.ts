import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { NotificationsRepository } from './repositories/notifications.repository';
import { NotificationTemplateTranslationsRepository } from './repositories/notification-template-translations.repository';
import { MAIL_PROVIDER } from './interfaces/mail-provider.interface';
import { NotificationStatus } from './entities/notifications.entity';

const translation = {
  template: 'MAGIC_LINK',
  subject: 'Hello {{name}}',
  htmlTemplate: '<a href="{{url}}">Hi {{name}}</a>',
  smsTemplate: 'Hi {{name}}',
};

describe('NotificationService', () => {
  let service: NotificationService;
  const notificationsRepository = {
    createEntity: jest.fn(),
    updateEntity: jest.fn(),
  };
  const translationsRepository = { findByTemplateCodeAndLanguageCode: jest.fn() };
  const mailProvider = { send: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();
    notificationsRepository.createEntity.mockImplementation(async (data) => ({
      id: 'n1',
      ...data,
    }));
    notificationsRepository.updateEntity.mockResolvedValue(undefined);
    translationsRepository.findByTemplateCodeAndLanguageCode.mockResolvedValue(translation);
    mailProvider.send.mockResolvedValue(undefined);

    const module = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: NotificationsRepository, useValue: notificationsRepository },
        { provide: NotificationTemplateTranslationsRepository, useValue: translationsRepository },
        { provide: MAIL_PROVIDER, useValue: mailProvider },
      ],
    }).compile();
    service = module.get(NotificationService);
  });

  describe('buildNotification', () => {
    it('renders subject, html and sms and stores the record as PENDING', async () => {
      const result = await service.buildNotification({
        email: 'a@b.co',
        templateCode: 'MAGIC_LINK',
        params: { name: 'Ana', url: 'https://x.io/?a=1&b=2' },
      });

      expect(result).toMatchObject({
        subject: 'Hello Ana',
        bodyHtml: '<a href="https://x.io/?a=1&amp;b=2">Hi Ana</a>',
        bodyText: 'Hi Ana',
        status: NotificationStatus.PENDING,
      });
    });

    it('escapes HTML in params but not in the plain-text subject', async () => {
      const result = await service.buildNotification({
        email: 'a@b.co',
        templateCode: 'MAGIC_LINK',
        params: { name: '<b>Ana</b>', url: 'u' },
      });

      expect(result.bodyHtml).toContain('&lt;b&gt;Ana&lt;/b&gt;');
      expect(result.subject).toBe('Hello <b>Ana</b>');
    });

    it('prefers an explicit subject', async () => {
      const result = await service.buildNotification({
        email: 'a@b.co',
        subject: 'Custom',
        templateCode: 'MAGIC_LINK',
        params: {},
      });
      expect(result.subject).toBe('Custom');
    });

    it('falls back to the English translation', async () => {
      translationsRepository.findByTemplateCodeAndLanguageCode
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(translation);

      await service.buildNotification({
        email: 'a@b.co',
        templateCode: 'MAGIC_LINK',
        params: {},
        languageCode: 'fr',
      });

      expect(translationsRepository.findByTemplateCodeAndLanguageCode).toHaveBeenNthCalledWith(
        2,
        'MAGIC_LINK',
        'en',
      );
    });

    it('throws NotFound when the template does not exist', async () => {
      translationsRepository.findByTemplateCodeAndLanguageCode.mockResolvedValue(null);
      await expect(
        service.buildNotification({ templateCode: 'NOPE', params: {} }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('deliver', () => {
    const notification: any = { id: 'n1', email: 'a@b.co', subject: 's', bodyHtml: '<p/>' };

    it('marks the notification SENT with a timestamp', async () => {
      await expect(service.deliver(notification)).resolves.toBe(NotificationStatus.SENT);
      expect(mailProvider.send).toHaveBeenCalledWith({
        to: 'a@b.co',
        subject: 's',
        html: '<p/>',
      });
      expect(notificationsRepository.updateEntity).toHaveBeenCalledWith(
        'n1',
        expect.objectContaining({ status: NotificationStatus.SENT, sentAt: expect.any(Date) }),
      );
    });

    it('returns FAILED instead of throwing when the provider fails', async () => {
      mailProvider.send.mockRejectedValue(new Error('boom'));
      await expect(service.deliver(notification)).resolves.toBe(NotificationStatus.FAILED);
      expect(notificationsRepository.updateEntity).toHaveBeenCalledWith('n1', {
        status: NotificationStatus.FAILED,
      });
    });

    it('stays PENDING when there is no deliverable channel', async () => {
      await expect(service.deliver({ id: 'n2', phone: '1' } as any)).resolves.toBe(
        NotificationStatus.PENDING,
      );
      expect(mailProvider.send).not.toHaveBeenCalled();
    });
  });

  describe('buildAndSendNotification', () => {
    const input = { email: 'a@b.co', templateCode: 'MAGIC_LINK', params: {} };

    it('throws when the delivery fails', async () => {
      mailProvider.send.mockRejectedValue(new Error('boom'));
      await expect(service.buildAndSendNotification(input)).rejects.toBeInstanceOf(
        InternalServerErrorException,
      );
    });

    it('resolves on success', async () => {
      await expect(service.buildAndSendNotification(input)).resolves.toEqual({ success: true });
    });
  });

  describe('notify', () => {
    it('does not reject when the provider fails', async () => {
      mailProvider.send.mockRejectedValue(new Error('SES down'));
      await expect(
        service.notify({ email: 'a@b.co', templateCode: 'MAGIC_LINK', params: {} }),
      ).resolves.toMatchObject({ id: 'n1', status: NotificationStatus.PENDING });

      await new Promise(setImmediate);
      expect(notificationsRepository.updateEntity).toHaveBeenCalledWith('n1', {
        status: NotificationStatus.FAILED,
      });
    });

    it('still surfaces a missing template to the caller', async () => {
      translationsRepository.findByTemplateCodeAndLanguageCode.mockResolvedValue(null);
      await expect(service.notify({ templateCode: 'NOPE', params: {} })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
