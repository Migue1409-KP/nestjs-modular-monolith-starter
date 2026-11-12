import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';
import { AssetType } from './constants/asset-types.constant';
import { RequestUploadDto } from './dto/request-upload.dto';

describe('StorageService', () => {
  const provider = {
    getPresignedUploadUrl: jest.fn(),
    deleteFile: jest.fn(),
    deleteFiles: jest.fn(),
    getPublicUrl: jest.fn(),
    extractKeyFromUrl: jest.fn((value: string) => value.replace('https://cdn.test/', '')),
  };
  const config = { get: jest.fn((_key: string, fallback: number) => fallback) };
  let service: StorageService;

  const dto = (overrides: Partial<RequestUploadDto> = {}): RequestUploadDto => ({
    assetType: AssetType.IMAGE,
    filename: 'Photo.PNG',
    mimeType: 'image/png',
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    provider.getPresignedUploadUrl.mockImplementation(async ({ key }) => ({
      uploadUrl: `https://upload.test/${key}`,
      publicUrl: `https://cdn.test/${key}`,
    }));
    service = new StorageService(provider, config as unknown as ConfigService);
  });

  describe('requestUpload', () => {
    it('builds a namespaced key with a lowercase extension and the configured expiry', async () => {
      const result = await service.requestUpload(dto());

      expect(result.key).toMatch(/^image\/\d{4}-\d{2}\/[0-9a-f-]{36}\.png$/);
      expect(result.uploadUrl).toBe(`https://upload.test/${result.key}`);
      expect(result.publicUrl).toBe(`https://cdn.test/${result.key}`);
      expect(provider.getPresignedUploadUrl).toHaveBeenCalledWith({
        key: result.key,
        mimeType: 'image/png',
        expiresInSeconds: 300,
      });
      expect(new Date(result.expiresAt).getTime()).toBeGreaterThan(Date.now());
    });

    it('derives the extension from the MIME type when the filename has none', async () => {
      const result = await service.requestUpload(dto({ filename: 'photo' }));
      expect(result.key.endsWith('.png')).toBe(true);
    });

    it('rejects a MIME type that is not allowed for the asset type', async () => {
      await expect(
        service.requestUpload(dto({ assetType: AssetType.AVATAR, mimeType: 'image/gif' })),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(provider.getPresignedUploadUrl).not.toHaveBeenCalled();
    });
  });

  it('resolves URLs to keys before deleting a single file', async () => {
    await service.deleteFile('https://cdn.test/image/2026-01/a.png');
    expect(provider.deleteFile).toHaveBeenCalledWith('image/2026-01/a.png');
  });

  it('batch-deletes after resolving every URL', async () => {
    await service.deleteFiles(['https://cdn.test/a.png', 'b.png']);
    expect(provider.deleteFiles).toHaveBeenCalledWith(['a.png', 'b.png']);
  });

  it('does nothing when there are no files to delete', async () => {
    await service.deleteFiles([]);
    expect(provider.deleteFiles).not.toHaveBeenCalled();
  });
});
