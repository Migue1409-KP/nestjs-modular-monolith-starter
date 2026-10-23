import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from '../repositories/user-profiles.repository';
import { UserProfile } from '../entities/user-profiles.entity';
import { CreateUserProfileDto } from '../dto/create-user.dto';
import { UpdateUserProfileDto } from '../dto/update-user.dto';
import { LanguagesRepository } from '@/core/parameters/repositories/languages.repostiry';
import { DataSource, QueryFailedError } from 'typeorm';
import { Language } from '@/core/parameters/entities/languages.entity';
import { Transactional } from '@/shared/decorators';

@Injectable()
export class UsersService {
  constructor(
    private readonly userProfileRepository: UserRepository,
    private readonly languageRepository: LanguagesRepository,
    private readonly dataSource: DataSource, // Required by @Transactional decorator
  ) {}

  @Transactional()
  async createProfile(
    data: CreateUserProfileDto & { email: string },
    isInvokedFromController: boolean = false,
    queryRunner?: any,
  ): Promise<UserProfile> {
    const userProfileReq: UserProfile = {
      ...new UserProfile(),
      ...data,
      language: { id: data.languageId, ...new Language() },
    };

    if (data.languageId && !(await this.languageRepository.findOneById(data.languageId))) {
      throw new NotFoundException({
        message: 'Language not found',
        data: [
          {
            field: 'languageId',
            message: 'No language with given id',
            code: 'language_id_not_found',
          },
        ],
      });
    }

    const userProfileResponse = await this.userProfileRepository
      .createEntity(userProfileReq, queryRunner)
      .catch((error) => {
        // 23505 = unique_violation (auth_user_id already has a profile)
        if (error instanceof QueryFailedError && (error as any).driverError?.code === '23505') {
          throw new ConflictException('User profile already exists for this user');
        }
        throw error;
      });

    if (isInvokedFromController) {
      await this.userProfileRepository.updateUserNameByAuthUserId(
        data.authUserId,
        `${data.name} ${data.lastname}`.trim(),
        queryRunner,
      );
    }

    return userProfileResponse;
  }

  async findByAuthUserId(authUserId: string): Promise<UserProfile & { provider: string }> {
    const user = await this.userProfileRepository.findOneByAuthUserId(authUserId);
    const provider = await this.userProfileRepository.getProviderLogin(authUserId);
    return { ...user, provider };
  }

  @Transactional()
  async updateProfile(
    id: string,
    data: UpdateUserProfileDto,
    queryRunner?: any,
  ): Promise<UserProfile> {
    const existingProfile = await this.userProfileRepository.findOneById(id);
    if (!existingProfile) {
      throw new NotFoundException({
        message: 'User profile not found',
        data: [
          {
            field: 'id',
            message: 'No user profile with given id',
            code: 'id_not_found',
          },
        ],
      });
    }

    const { languageId, ...restData } = data;

    const updateData: Partial<UserProfile> = { ...restData };

    if (languageId) {
      updateData.language = { id: languageId, ...new Language() };
    }

    const updatedProfile = await this.userProfileRepository.updateEntity(
      id,
      updateData,
      queryRunner,
    );

    if (!updatedProfile) {
      throw new NotFoundException({ message: 'Failed to update user profile' });
    }

    if (
      updatedProfile.name !== existingProfile.name ||
      updatedProfile.lastname !== existingProfile.lastname
    ) {
      await this.userProfileRepository.updateUserNameByAuthUserId(
        updatedProfile.authUserId,
        `${updatedProfile.name} ${updatedProfile.lastname}`.trim(),
        queryRunner,
      );
    }

    return updatedProfile;
  }

  async findProfileById(id: string): Promise<UserProfile> {
    const profile = await this.userProfileRepository.findOneById(id);
    if (!profile) {
      throw new NotFoundException({
        message: 'User profile not found',
        data: [
          {
            field: 'id',
            message: 'No user profile with given id',
            code: 'id_not_found',
          },
        ],
      });
    }
    return profile;
  }
}
