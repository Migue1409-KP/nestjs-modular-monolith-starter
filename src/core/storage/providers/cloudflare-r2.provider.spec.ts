import { ConfigService } from '@nestjs/config';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { CloudflareR2Provider } from './cloudflare-r2.provider';

const send = jest.fn();

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({ send })),
  PutObjectCommand: jest.fn().mockImplementation((input) => ({ kind: 'put', input })),
  DeleteObjectCommand: jest.fn().mockImplementation((input) => ({ kind: 'delete', input })),
  DeleteObjectsCommand: jest.fn().mockImplementation((input) => ({ kind: 'deleteMany', input })),
}));
jest.mock('@aws-sdk/s3-request-presigner', () => ({ getSignedUrl: jest.fn() }));

const values: Record<string, string> = {
  R2_ACCOUNT_ID: 'acc',
  R2_BUCKET_NAME: 'bucket',
  R2_PUBLIC_URL: 'https://cdn.test/',
  R2_ACCESS_KEY_ID: 'key',
  R2_SECRET_ACCESS_KEY: 'secret',
};

describe('CloudflareR2Provider', () => {
  let provider: CloudflareR2Provider;

  beforeEach(() => {
    jest.clearAllMocks();
    const config = {
      getOrThrow: (key: string) => {
        if (!(key in values)) throw new Error(`${key} missing`);
        return values[key];
      },
    } as unknown as ConfigService;
    provider = new CloudflareR2Provider(config);
  });

  it('refuses to start when a required R2 variable is missing', () => {
    const config = {
      getOrThrow: (key: string) => {
        throw new Error(`${key} missing`);
      },
    } as unknown as ConfigService;
    expect(() => new CloudflareR2Provider(config)).toThrow('R2_ACCOUNT_ID missing');
  });

  it('builds public URLs without a duplicated slash', () => {
    expect(provider.getPublicUrl('image/a.png')).toBe('https://cdn.test/image/a.png');
  });

  it('extracts the key from a public URL and leaves bare keys untouched', () => {
    expect(provider.extractKeyFromUrl('https://cdn.test/image/a.png')).toBe('image/a.png');
    expect(provider.extractKeyFromUrl('image/a.png')).toBe('image/a.png');
  });

  it('presigns a PUT with the requested content type and expiry', async () => {
    (getSignedUrl as jest.Mock).mockResolvedValue('https://signed.test/x');

    const result = await provider.getPresignedUploadUrl({
      key: 'image/a.png',
      mimeType: 'image/png',
      expiresInSeconds: 120,
    });

    expect(result).toEqual({
      uploadUrl: 'https://signed.test/x',
      publicUrl: 'https://cdn.test/image/a.png',
    });
    expect(getSignedUrl).toHaveBeenCalledWith(
      expect.anything(),
      { kind: 'put', input: { Bucket: 'bucket', Key: 'image/a.png', ContentType: 'image/png' } },
      { expiresIn: 120 },
    );
  });

  it('deletes a single object', async () => {
    send.mockResolvedValue({});
    await provider.deleteFile('image/a.png');
    expect(send).toHaveBeenCalledWith({
      kind: 'delete',
      input: { Bucket: 'bucket', Key: 'image/a.png' },
    });
  });

  it('swallows delete failures so orphaned files never break the caller', async () => {
    send.mockRejectedValue(new Error('boom'));
    await expect(provider.deleteFile('a')).resolves.toBeUndefined();
    await expect(provider.deleteFiles(['a', 'b'])).resolves.toBeUndefined();
  });

  it('batch-deletes quietly and skips empty batches', async () => {
    send.mockResolvedValue({});
    await provider.deleteFiles([]);
    expect(send).not.toHaveBeenCalled();

    await provider.deleteFiles(['a', 'b']);
    expect(send).toHaveBeenCalledWith({
      kind: 'deleteMany',
      input: { Bucket: 'bucket', Delete: { Objects: [{ Key: 'a' }, { Key: 'b' }], Quiet: true } },
    });
  });
});
