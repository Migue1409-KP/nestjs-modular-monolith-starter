import { Test } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from '../services/users.service';
import { CreateUserProfileBodySchema } from '../dto/create-user.dto';

describe('UsersController.createProfile', () => {
  const service = {
    createProfile: jest.fn().mockResolvedValue({ id: 'p1' }),
    findByAuthUserId: jest.fn(),
    findProfileById: jest.fn().mockResolvedValue({ id: 'p1' }),
    updateProfile: jest.fn().mockResolvedValue({ id: 'p1' }),
  };
  let controller: UsersController;

  beforeEach(async () => {
    Object.values(service).forEach((fn) => fn.mockClear());
    const module = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: service }],
    }).compile();
    controller = module.get(UsersController);
  });

  it('uses the session user id (not a client-supplied one)', async () => {
    const session: any = { user: { id: 'abc123NotAUuid', email: 'a@b.com' } };
    const body = { name: 'Test', authUserId: 'attacker-id' } as any;

    await controller.createProfile(session, body);

    expect(service.createProfile).toHaveBeenCalledWith(
      expect.objectContaining({ authUserId: 'abc123NotAUuid', email: 'a@b.com' }),
      true,
    );
  });
});

describe('UsersController ownership on /profile/:id', () => {
  const service = {
    createProfile: jest.fn(),
    findByAuthUserId: jest.fn(),
    findProfileById: jest.fn().mockResolvedValue({ id: 'p1' }),
    updateProfile: jest.fn().mockResolvedValue({ id: 'p1' }),
  };
  let controller: UsersController;
  const user: any = { user: { id: 'u1', roles: ['USER'] } };
  const admin: any = { user: { id: 'a1', roles: ['ADMIN'] } };

  beforeEach(async () => {
    Object.values(service).forEach((fn) => fn.mockClear());
    const module = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: service }],
    }).compile();
    controller = module.get(UsersController);
  });

  it('lets a USER read and update their own profile', async () => {
    service.findByAuthUserId.mockResolvedValue({ id: 'p1' });
    await expect(controller.getProfileById(user, 'p1')).resolves.toBeDefined();
    await expect(controller.updateProfile(user, 'p1', { name: 'Nuevo' })).resolves.toBeDefined();
    expect(service.updateProfile).toHaveBeenCalledWith('p1', { name: 'Nuevo' });
  });

  it('forbids a USER from reading or updating another profile', async () => {
    service.findByAuthUserId.mockResolvedValue({ id: 'p1' });
    await expect(controller.getProfileById(user, 'p2')).rejects.toThrow(ForbiddenException);
    await expect(controller.updateProfile(user, 'p2', { name: 'Hack' })).rejects.toThrow(
      ForbiddenException,
    );
    expect(service.updateProfile).not.toHaveBeenCalled();
  });

  it('forbids a USER without a profile', async () => {
    service.findByAuthUserId.mockResolvedValue({ provider: 'local' });
    await expect(controller.getProfileById(user, 'p1')).rejects.toThrow(ForbiddenException);
  });

  it('lets an ADMIN access any profile without an ownership lookup', async () => {
    await expect(controller.getProfileById(admin, 'p2')).resolves.toBeDefined();
    await expect(controller.updateProfile(admin, 'p2', { name: 'Fix' })).resolves.toBeDefined();
    expect(service.findByAuthUserId).not.toHaveBeenCalled();
  });
});

describe('CreateUserProfileBodySchema', () => {
  it('accepts a body without authUserId', () => {
    expect(CreateUserProfileBodySchema.safeParse({ name: 'Test' }).success).toBe(true);
  });

  it('strips authUserId if the client sends it', () => {
    const parsed = CreateUserProfileBodySchema.parse({ name: 'Test', authUserId: 'x' });
    expect(parsed).not.toHaveProperty('authUserId');
  });
});
