import { StorageController } from './storage.controller';

describe('StorageController', () => {
  const storageService = { requestUpload: jest.fn(), deleteFile: jest.fn() };
  const controller = new StorageController(storageService as any);

  beforeEach(() => jest.resetAllMocks());

  it('wraps the presigned upload in a success envelope', async () => {
    const upload = { uploadUrl: 'u', key: 'k', publicUrl: 'p', expiresAt: 'e' };
    storageService.requestUpload.mockResolvedValue(upload);
    const body = { assetType: 'image', filename: 'a.png', mimeType: 'image/png' } as any;

    await expect(controller.presign(body)).resolves.toEqual({ status: 'success', data: upload });
    expect(storageService.requestUpload).toHaveBeenCalledWith(body);
  });

  it('deletes by key and confirms it', async () => {
    storageService.deleteFile.mockResolvedValue(undefined);

    await expect(controller.deleteFile({ key: 'image/a.png' })).resolves.toEqual({
      status: 'success',
      data: { deleted: true },
    });
    expect(storageService.deleteFile).toHaveBeenCalledWith('image/a.png');
  });
});
