import { ConfigService } from '@nestjs/config';
import { SesMailProvider } from './ses-mail.provider';

const send = jest.fn();

jest.mock('@aws-sdk/client-ses', () => ({
  SESClient: jest.fn().mockImplementation(() => ({ send })),
  SendEmailCommand: jest.fn().mockImplementation((input) => ({ input })),
}));

describe('SesMailProvider', () => {
  const values: Record<string, string> = {
    AWS_REGION: 'us-east-1',
    AWS_ACCESS_KEY_ID: 'id',
    AWS_SECRET_ACCESS_KEY: 'secret',
    AWS_SES_SENDER: 'no-reply@example.com',
  };
  let provider: SesMailProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new SesMailProvider({
      get: (key: string) => values[key],
    } as unknown as ConfigService);
  });

  it('sends an HTML email from the configured sender', async () => {
    send.mockResolvedValue({});

    await provider.send({ to: 'a@b.co', subject: 'Hi', html: '<p>Hi</p>' });

    expect(send).toHaveBeenCalledWith({
      input: {
        Destination: { ToAddresses: ['a@b.co'] },
        Message: {
          Body: { Html: { Data: '<p>Hi</p>', Charset: 'UTF-8' } },
          Subject: { Data: 'Hi', Charset: 'UTF-8' },
        },
        Source: 'no-reply@example.com',
      },
    });
  });

  it('re-throws SES errors so the caller can mark the notification as failed', async () => {
    send.mockRejectedValue(new Error('Throttling'));
    await expect(provider.send({ to: 'a@b.co', subject: 's', html: 'h' })).rejects.toThrow(
      'Throttling',
    );
  });

  it('re-throws non-Error rejections too', async () => {
    send.mockRejectedValue('weird');
    await expect(provider.send({ to: 'a@b.co', subject: 's', html: 'h' })).rejects.toBe('weird');
  });
});
