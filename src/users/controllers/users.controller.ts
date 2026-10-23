// users.controller.ts
import {
  Controller,
  Post,
  Body,
  HttpCode,
  Patch,
  Param,
  Get,
  ForbiddenException,
} from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import { UsersService } from '../services/users.service';
import { ZodValidationPipe } from '@/shared/pipes/zod-validation.pipe';
import {
  CreateUserProfileDto,
  CreateUserProfileBodyDto,
  CreateUserProfileBodySchema,
  CreateUserProfileSwaggerDto,
} from '../dto/create-user.dto';
import {
  UpdateUserProfileDto,
  UpdatePartialUserProfileSchema,
  UpdatePartialUserProfileSwaggerDto,
} from '../dto/update-user.dto';
import { ApiBody, ApiOperation, ApiResponse, ApiSecurity, ApiParam } from '@nestjs/swagger';
import { ApiSuccess } from '@/shared/interfaces/api-response';
import { UserProfile } from '../entities/user-profiles.entity';
import { ExtendedUserSession } from '@/shared/interfaces/extended-session';
import { ROLES } from '@/shared/authorization/constants/roles.constant';

@Controller('users')
@ApiSecurity('apiKeyAuth')
@ApiSecurity('cookieAuth')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // The RBAC matrix only checks the route, so ownership of :id is enforced here.
  // Non-admins get a uniform 403 whether the profile is foreign or does not exist.
  private async assertOwnerOrAdmin(session: ExtendedUserSession, profileId: string) {
    if (session.user.roles?.includes(ROLES.ADMIN)) return;
    const own = await this.usersService.findByAuthUserId(session.user.id);
    if (!own?.id || own.id !== profileId) {
      throw new ForbiddenException('Access denied');
    }
  }

  @Post('profile')
  @HttpCode(201)
  @ApiOperation({
    summary: 'Create user profile',
    description:
      'Creates a user profile for the authenticated user. User must have a valid session. Can only create one profile per user.',
  })
  @ApiBody({ type: CreateUserProfileSwaggerDto })
  @ApiResponse({
    status: 201,
    description: 'User profile created successfully',
    schema: {
      example: {
        status: 'success',
        data: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          authUserId: 'clh1234567890abcdef',
          email: 'user@example.com',
          name: 'John',
          lastname: 'Doe',
          languageId: '550e8400-e29b-41d4-a716-446655440000',
          phone: '+1234567890',
          birthDate: '1990-01-15',
          gender: 'M',
          createdAt: '2025-11-23T10:30:00Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request body or validation error',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - missing or invalid session cookie',
  })
  @ApiResponse({
    status: 409,
    description: 'User profile already exists for this user',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async createProfile(
    @Session() session: ExtendedUserSession,
    @Body(new ZodValidationPipe(CreateUserProfileBodySchema)) body: CreateUserProfileBodyDto,
  ): Promise<ApiSuccess<CreateUserProfileDto>> {
    const authUserId = session.user.id;
    return {
      status: 'success',
      data: await this.usersService.createProfile(
        { ...body, authUserId, email: session.user.email },
        true,
      ),
    };
  }

  @Patch('profile/:id')
  @ApiOperation({
    summary: 'Update user profile',
    description:
      'Partially updates an existing user profile. Can update any combination of fields. All fields are optional.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the user profile to update',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({ type: UpdatePartialUserProfileSwaggerDto })
  @ApiResponse({
    status: 200,
    description: 'User profile updated successfully',
    schema: {
      example: {
        status: 'success',
        data: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Jane',
          lastname: 'Smith',
          phone: '+9876543210',
          updatedAt: '2025-11-23T10:45:00Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request body or parameters',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - missing or invalid session cookie',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - the profile belongs to another user',
  })
  @ApiResponse({
    status: 404,
    description: 'User profile not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async updateProfile(
    @Session() session: ExtendedUserSession,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdatePartialUserProfileSchema)) body: UpdateUserProfileDto,
  ): Promise<ApiSuccess<UserProfile>> {
    await this.assertOwnerOrAdmin(session, id);
    return {
      status: 'success',
      data: await this.usersService.updateProfile(id, body),
    };
  }

  @Get('profile/me')
  @ApiOperation({
    summary: 'Get current user profile',
    description:
      'Retrieves the profile of the authenticated user based on their session. Returns null if user has not created a profile yet.',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    schema: {
      example: {
        status: 'success',
        data: {
          userProfile: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            authUserId: 'clh1234567890abcdef',
            email: 'user@example.com',
            name: 'John',
            lastname: 'Doe',
            languageId: '550e8400-e29b-41d4-a716-446655440000',
            phone: '+1234567890',
            birthDate: '1990-01-15',
            gender: 'M',
            createdAt: '2025-11-23T10:30:00Z',
            updatedAt: '2025-11-23T10:30:00Z',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - missing or invalid session cookie',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getProfile(
    @Session() session: ExtendedUserSession,
  ): Promise<ApiSuccess<{ userProfile: UserProfile | null }>> {
    const userProfile = await this.usersService.findByAuthUserId(session.user.id);
    return {
      status: 'success',
      data: { userProfile },
    };
  }

  @Get('profile/:id')
  @ApiOperation({
    summary: 'Get user profile by ID',
    description:
      'Retrieves a specific user profile by its UUID. Returns all profile information including personal data and preferences.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID of the user profile to retrieve',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    schema: {
      example: {
        status: 'success',
        data: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          authUserId: 'clh1234567890abcdef',
          email: 'user@example.com',
          name: 'John',
          lastname: 'Doe',
          languageId: '550e8400-e29b-41d4-a716-446655440000',
          phone: '+1234567890',
          birthDate: '1990-01-15',
          gender: 'M',
          createdAt: '2025-11-23T10:30:00Z',
          updatedAt: '2025-11-23T10:30:00Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - missing or invalid session cookie',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - the profile belongs to another user',
  })
  @ApiResponse({
    status: 404,
    description: 'User profile not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async getProfileById(
    @Session() session: ExtendedUserSession,
    @Param('id') id: string,
  ): Promise<ApiSuccess<any>> {
    await this.assertOwnerOrAdmin(session, id);
    return {
      status: 'success',
      data: await this.usersService.findProfileById(id),
    };
  }
}
