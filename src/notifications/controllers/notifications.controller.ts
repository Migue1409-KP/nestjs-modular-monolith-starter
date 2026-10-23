import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { ZodValidationPipe } from '@/shared/pipes/zod-validation.pipe';
import { ApiSuccess, OffsetPaginationMeta } from '@/shared/interfaces/api-response';
import { Notification } from '@/core/notification/entities/notifications.entity';
import { NotificationsAdminService } from '../services/notifications-admin.service';
import {
  ListNotificationsQueryDto,
  ListNotificationsQuerySchema,
} from '../dto/list-notifications.dto';
import {
  SendNotificationDto,
  SendNotificationSchema,
  SendNotificationSwaggerDto,
} from '../dto/send-notification.dto';

const notificationExample = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  template: { id: '660e8400-e29b-41d4-a716-446655440000', code: 'MAGIC_LINK' },
  email: 'user@example.com',
  phone: null,
  subject: 'Your sign-in link',
  params: { url: 'https://example.com/verify' },
  status: 'sent',
  sentAt: '2025-11-23T10:30:00Z',
  createdAt: '2025-11-23T10:30:00Z',
  updatedAt: '2025-11-23T10:30:00Z',
};

/**
 * Admin-only: there is no `notifications` entry for USER in config/authorization.yaml,
 * so PolicyGuard (deny by default) only lets ADMIN through via its wildcard.
 */
@Controller('notifications')
@ApiSecurity('apiKeyAuth')
@ApiSecurity('cookieAuth')
export class NotificationsController {
  constructor(private readonly notificationsAdminService: NotificationsAdminService) {}

  @Get()
  @ApiOperation({
    summary: 'List notifications',
    description:
      'Paginated list (newest first). Optional filters: status, email, templateCode. Admin only.',
  })
  @ApiResponse({
    status: 200,
    description: 'Notifications retrieved successfully',
    schema: {
      example: {
        status: 'success',
        data: [notificationExample],
        meta: { total: 1, page: 1, pageSize: 20, pageCount: 1 },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  async findAll(
    @Query(new ZodValidationPipe(ListNotificationsQuerySchema)) query: ListNotificationsQueryDto,
  ): Promise<ApiSuccess<Notification[], OffsetPaginationMeta>> {
    const { items, meta } = await this.notificationsAdminService.findAll(query);
    return { status: 'success', data: items, meta };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification by ID', description: 'Admin only.' })
  @ApiParam({ name: 'id', format: 'uuid', example: notificationExample.id })
  @ApiResponse({
    status: 200,
    description: 'Notification retrieved successfully',
    schema: { example: { status: 'success', data: notificationExample } },
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async findById(@Param('id', new ParseUUIDPipe()) id: string): Promise<ApiSuccess<Notification>> {
    return { status: 'success', data: await this.notificationsAdminService.findById(id) };
  }

  @Post()
  @HttpCode(201)
  @ApiOperation({
    summary: 'Launch a new notification',
    description:
      'Renders the template, stores the notification and attempts delivery. A delivery failure is reported in `data.status` (`failed`), not as an HTTP error. Admin only.',
  })
  @ApiBody({ type: SendNotificationSwaggerDto })
  @ApiResponse({
    status: 201,
    description: 'Notification created (check `data.status` for the delivery result)',
    schema: { example: { status: 'success', data: notificationExample } },
  })
  @ApiResponse({ status: 400, description: 'Invalid request body' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async send(
    @Body(new ZodValidationPipe(SendNotificationSchema)) body: SendNotificationDto,
  ): Promise<ApiSuccess<Notification>> {
    return { status: 'success', data: await this.notificationsAdminService.send(body) };
  }

  @Post(':id/resend')
  @HttpCode(201)
  @ApiOperation({
    summary: 'Resend a notification',
    description:
      'Sends the same content again and stores it as a NEW notification record. The original is left unchanged. Admin only.',
  })
  @ApiParam({ name: 'id', format: 'uuid', example: notificationExample.id })
  @ApiResponse({
    status: 201,
    description: 'New notification record created and delivery attempted',
    schema: { example: { status: 'success', data: notificationExample } },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiResponse({ status: 422, description: 'Notification has no deliverable channel' })
  async resend(@Param('id', new ParseUUIDPipe()) id: string): Promise<ApiSuccess<Notification>> {
    return { status: 'success', data: await this.notificationsAdminService.resend(id) };
  }

  @Post(':id/retry')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Retry a failed notification',
    description:
      'Retries a `failed` notification in place: status goes failed -> pending -> sent | failed. Admin only.',
  })
  @ApiParam({ name: 'id', format: 'uuid', example: notificationExample.id })
  @ApiResponse({
    status: 200,
    description: 'Retry attempted (check `data.status` for the result)',
    schema: { example: { status: 'success', data: notificationExample } },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiResponse({ status: 409, description: 'Notification is not in failed status' })
  @ApiResponse({ status: 422, description: 'Notification has no deliverable channel' })
  async retry(@Param('id', new ParseUUIDPipe()) id: string): Promise<ApiSuccess<Notification>> {
    return { status: 'success', data: await this.notificationsAdminService.retry(id) };
  }
}
