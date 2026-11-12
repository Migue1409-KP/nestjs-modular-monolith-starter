import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from '../repositories/user-profiles.repository';
import { UserProfile } from '../entities/user-profiles.entity';
import { CreateUserProfileDto } from '../dto/create-user.dto';
import { UpdateUserProfileDto } from '../dto/update-user.dto';
import { LanguagesRepository } from '@/core/parameters/repositories/languages.repostiry';
import { DataSource, QueryFailedError } from 'typeorm';
import { Language } from '@/core/parameters/entities/languages.entity';
import { Transactional } from '@/shared/decorators';

// A missing last name must not leak "null"/"undefined" into the Better Auth display name.
const fullName = (name: string, lastname?: string | null) =>
  [name, lastname].filter(Boolean).join(' ');

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
      language: data.languageId ? Object.assign(new Language(), { id: data.languageId }) : null,
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
        if (
          error instanceof QueryFailedError &&
          (error.driverError as { code?: string } | undefined)?.code === '23505'
        ) {
          throw new ConflictException('User profile already exists for this user');
        }
        throw error;
      });

    if (isInvokedFromController) {
      await this.userProfileRepository.updateUserNameByAuthUserId(
        data.authUserId,
        fullName(data.name, data.lastname),
        queryRunner,
      );
    }

    return userProfileResponse;
  }

  /** Returns null when the Better Auth user has no profile yet. */
  async findByAuthUserId(authUserId: string): Promise<(UserProfile & { provider: string }) | null> {
    const user = await this.userProfileRepository.findOneByAuthUserId(authUserId);
    if (!user) return null;
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
      updateData.language = Object.assign(new Language(), { id: languageId });
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
        fullName(updatedProfile.name, updatedProfile.lastname),
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
