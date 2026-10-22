import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import * as mime from 'mime-types';
import * as dayjs from 'dayjs';
import { IStorageProvider, STORAGE_PROVIDER } from './interfaces/storage-provider.interface';
import { AssetType, ASSET_TYPE_CONFIG } from './constants/asset-types.constant';
import { RequestUploadDto } from './dto/request-upload.dto';

export interface RequestUploadResult {
  uploadUrl: string;
  key: string;
  publicUrl: string;
  expiresAt: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly defaultExpiresIn: number;

  constructor(
    @Inject(STORAGE_PROVIDER) private readonly provider: IStorageProvider,
    private readonly config: ConfigService,
  ) {
    this.defaultExpiresIn = this.config.get<number>('R2_PRESIGN_EXPIRES_IN', 300);
  }

  async requestUpload(dto: RequestUploadDto): Promise<RequestUploadResult> {
    const rule = ASSET_TYPE_CONFIG[dto.assetType];

    if (!rule.mimes.includes(dto.mimeType)) {
      throw new BadRequestException({
        message: `MIME type "${dto.mimeType}" is not allowed for asset type "${dto.assetType}"`,
        data: [
          {
            field: 'mimeType',
            message: `Allowed types: ${rule.mimes.join(', ')}`,
            code: 'mime_type_not_allowed',
          },
        ],
      });
    }

    const ext = this.resolveExtension(dto.filename, dto.mimeType);
    const month = dayjs().format('YYYY-MM');
    const key = `${dto.assetType}/${month}/${uuidv4()}${ext}`;

    const { uploadUrl, publicUrl } = await this.provider.getPresignedUploadUrl({
      key,
      mimeType: dto.mimeType,
      expiresInSeconds: this.defaultExpiresIn,
    });

    const expiresAt = dayjs().add(this.defaultExpiresIn, 'second').toISOString();

    return { uploadUrl, key, publicUrl, expiresAt };
  }

  async deleteFile(keyOrUrl: string): Promise<void> {
    const key = this.provider.extractKeyFromUrl(keyOrUrl);
    await this.provider.deleteFile(key);
  }

  async deleteFiles(keysOrUrls: string[]): Promise<void> {
    if (!keysOrUrls.length) return;
    const keys = keysOrUrls.map((u) => this.provider.extractKeyFromUrl(u));
    await this.provider.deleteFiles(keys);
  }

  private resolveExtension(filename: string, mimeType: string): string {
    const fromFilename = filename.includes('.') ? `.${filename.split('.').pop()}` : '';
    if (fromFilename) return fromFilename.toLowerCase();
    const fromMime = mime.extension(mimeType);
    return fromMime ? `.${fromMime}` : '';
  }
}
