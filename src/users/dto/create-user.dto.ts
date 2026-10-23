import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';
import { gender_type } from '../entities/user-profiles.entity';

// Better Auth user ids are opaque strings, not UUIDs.
export const CreateUserProfileSchema = z.object({
  authUserId: z.string().min(1),
  name: z.string().min(2).max(100),
  lastname: z.string().min(2).max(100).nullable().optional(),
  languageId: z.string().uuid().nullable().optional(),
  phone: z.string().nullable().optional(),
  birthDate: z.coerce.date().nullable().optional(),
  gender: z.nativeEnum(gender_type).nullable().optional(),
});

// Request body: authUserId is always taken from the session, never from the client.
export const CreateUserProfileBodySchema = CreateUserProfileSchema.omit({ authUserId: true });

export type CreateUserProfileDto = z.infer<typeof CreateUserProfileSchema>;
export type CreateUserProfileBodyDto = z.infer<typeof CreateUserProfileBodySchema>;

export class CreateUserProfileSwaggerDto {
  @ApiProperty({ type: 'string', minLength: 2, maxLength: 100 })
  name: string;
  @ApiProperty({ type: 'string', minLength: 2, maxLength: 100, nullable: true })
  lastname?: string | null;
  @ApiProperty({ type: 'string', format: 'uuid', nullable: true })
  languageId?: string;
  @ApiProperty({ type: 'string', nullable: true })
  phone?: string | null;
  @ApiProperty({ type: 'string', format: 'date', nullable: true })
  birthDate?: Date | null;
  @ApiProperty({ type: 'string', nullable: true })
  gender?: gender_type | null;
}
