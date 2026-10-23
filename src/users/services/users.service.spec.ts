import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UserRepository } from '../repositories/user-profiles.repository';
import { LanguagesRepository } from '@/core/parameters/repositories/languages.repostiry';
import { DataSource, QueryFailedError } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UserProfile } from '../entities/user-profiles.entity';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockUserProfile: UserProfile = {
  id: 'profile-uuid-1',
  authUserId: 'auth-user-uuid-1',
  name: 'John',
  lastname: 'Doe',
  roles: ['USER'],
  language: null,
  phone: null,
  birthDate: null,
  gender: null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
} as any;

const mockUserRepository = {
  findOneByAuthUserId: jest.fn(),
  findOneById: jest.fn(),
  createEntity: jest.fn(),
  updateEntity: jest.fn(),
  updateUserNameByAuthUserId: jest.fn(),
  getProviderLogin: jest.fn(),
};

const mockLanguageRepository = {
  findOneById: jest.fn(),
};

const mockDataSource = {
  createQueryRunner: jest.fn().mockReturnValue({
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      getRepository: jest.fn().mockReturnValue({
        create: jest.fn((data) => data),
        save: jest.fn((data) => Promise.resolve(data)),
        update: jest.fn(),
        findOne: jest.fn(),
      }),
    },
    connection: {
      query: jest.fn(),
    },
  }),
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UserRepository, useValue: mockUserRepository },
        { provide: LanguagesRepository, useValue: mockLanguageRepository },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createProfile', () => {
    it('maps a unique violation to ConflictException', async () => {
      mockUserRepository.createEntity.mockRejectedValue(
        new QueryFailedError('INSERT', [], { code: '23505' } as any),
      );

      await expect(
        service.createProfile({ authUserId: 'abc', email: 'a@b.com', name: 'John' }, true),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findByAuthUserId', () => {
    it('should return user profile combined with provider info', async () => {
      mockUserRepository.findOneByAuthUserId.mockResolvedValue(mockUserProfile);
      mockUserRepository.getProviderLogin.mockResolvedValue('credential');

      const result = await service.findByAuthUserId('auth-user-uuid-1');

      expect(mockUserRepository.findOneByAuthUserId).toHaveBeenCalledWith('auth-user-uuid-1');
      expect(result.id).toEqual('profile-uuid-1');
      expect(result.provider).toEqual('credential');
    });
  });

  describe('updateProfile', () => {
    it('should throw NotFoundException when profile does not exist', async () => {
      mockUserRepository.findOneById.mockResolvedValue(null);

      await expect(service.updateProfile('non-existent-id', { name: 'New Name' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should update and return the updated profile', async () => {
      const updated: UserProfile = { ...mockUserProfile, name: 'Jane' };
      mockUserRepository.findOneById.mockResolvedValue(mockUserProfile);
      mockUserRepository.updateEntity.mockResolvedValue(updated);
      mockUserRepository.updateUserNameByAuthUserId.mockResolvedValue(true);

      const result = await service.updateProfile('profile-uuid-1', { name: 'Jane' });

      expect(mockUserRepository.findOneById).toHaveBeenCalledWith('profile-uuid-1');
      expect(result.name).toEqual('Jane');
    });
  });
});
