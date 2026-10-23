import { Module } from '@nestjs/common';
import { NotificationModule } from '@/core/notification/notification.module';
import { NotificationsController } from './controllers/notifications.controller';
import { NotificationsAdminService } from './services/notifications-admin.service';

@Module({
  imports: [NotificationModule],
  controllers: [NotificationsController],
  providers: [NotificationsAdminService],
})
export class NotificationsModule {}
