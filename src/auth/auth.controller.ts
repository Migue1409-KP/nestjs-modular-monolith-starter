import { Controller, Get } from '@nestjs/common';
import { Session, UserSession } from '@thallesp/nestjs-better-auth';
import { ApiTags, ApiSecurity, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiSuccess } from '@/shared/interfaces/api-response';
import { AllowAnonymous } from '@/shared/decorators/allow-anonymous.decorator';

@ApiTags('Local Auth')
@Controller('local-auth')
export class AuthController {
  @Get('me')
  @AllowAnonymous()
  @ApiSecurity('cookieAuth')
  @ApiOperation({ summary: 'Get current user information' })
  @ApiResponse({ status: 200, description: 'User information retrieved successfully.' })
  async getMe(@Session() session: UserSession): Promise<ApiSuccess<UserSession | null>> {
    return {
      status: 'success',
      data: session ?? null,
    };
  }
}
