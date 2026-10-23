import { z } from 'zod';
import { NotificationStatus } from '@/core/notification/entities/notifications.entity';

export const ListNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(NotificationStatus).optional(),
  email: z.string().email().optional(),
  templateCode: z.string().min(1).max(100).optional(),
});

export type ListNotificationsQueryDto = z.infer<typeof ListNotificationsQuerySchema>;
