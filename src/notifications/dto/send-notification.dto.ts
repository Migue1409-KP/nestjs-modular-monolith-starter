import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';

export const SendNotificationSchema = z
  .object({
    templateCode: z.string().min(1).max(100),
    email: z.string().email().optional(),
    phone: z.string().min(1).max(25).optional(),
    subject: z.string().min(1).max(255).optional(),
    languageCode: z.string().min(2).max(10).optional(),
    params: z.record(z.string()).default({}),
  })
  .refine((data) => data.email || data.phone, {
    message: 'Either email or phone is required',
    path: ['email'],
  });

export type SendNotificationDto = z.infer<typeof SendNotificationSchema>;

export class SendNotificationSwaggerDto {
  @ApiProperty({ type: 'string', example: 'MAGIC_LINK', description: 'Template code' })
  templateCode: string;
  @ApiPropertyOptional({ type: 'string', format: 'email', example: 'user@example.com' })
  email?: string;
  @ApiPropertyOptional({ type: 'string', example: '+1234567890' })
  phone?: string;
  @ApiPropertyOptional({ type: 'string', description: 'Overrides the template subject' })
  subject?: string;
  @ApiPropertyOptional({ type: 'string', example: 'es', description: 'Defaults to "en"' })
  languageCode?: string;
  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: { type: 'string' },
    example: { url: 'https://example.com/verify' },
    description: 'Template placeholder values',
  })
  params?: Record<string, string>;
}
