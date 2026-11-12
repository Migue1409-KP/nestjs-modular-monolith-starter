import { DataSource } from 'typeorm';
import { UserRepository } from './user-profiles.repository';

describe('UserRepository', () => {
  const query = jest.fn();
  const dataSource = {
    createEntityManager: () => ({}),
    query,
  } as unknown as DataSource;

  const repo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    softDelete: jest.fn(),
  };
  const qr = { manager: { getRepository: () => repo }, connection: { query } } as any;
  let repository: UserRepository;

  beforeEach(() => {
    jest.resetAllMocks();
    repository = new UserRepository(dataSource);
  });

  it('finds a profile by id including its language', async () => {
    repo.findOne.mockResolvedValue({ id: 'p1' });
    await expect(repository.findOneById('p1', qr)).resolves.toEqual({ id: 'p1' });
    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 'p1' }, relations: ['language'] });
  });

  it('finds a profile by Better Auth user id', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(repository.findOneByAuthUserId('auth-1', qr)).resolves.toBeNull();
    expect(repo.findOne).toHaveBeenCalledWith({
      where: { authUserId: 'auth-1' },
      relations: ['language'],
    });
  });

  it('creates a profile through the repository', async () => {
    repo.create.mockReturnValue({ name: 'Ana' });
    repo.save.mockResolvedValue({ id: 'p1', name: 'Ana' });
    await expect(repository.createEntity({ name: 'Ana' } as any, qr)).resolves.toEqual({
      id: 'p1',
      name: 'Ana',
    });
  });

  it('updates and re-reads the profile', async () => {
    repo.update.mockResolvedValue({ affected: 1 });
    repo.findOne.mockResolvedValue({ id: 'p1', name: 'Bea' });
    await expect(repository.updateEntity('p1', { name: 'Bea' }, qr)).resolves.toMatchObject({
      name: 'Bea',
    });
  });

  it('reports hard and soft deletes by affected rows', async () => {
    repo.delete.mockResolvedValueOnce({ affected: 1 }).mockResolvedValueOnce({ affected: null });
    repo.softDelete.mockResolvedValueOnce({ affected: 1 }).mockResolvedValueOnce({ affected: 0 });

    await expect(repository.deleteEntity('p1', qr)).resolves.toBe(true);
    await expect(repository.deleteEntity('p1', qr)).resolves.toBe(false);
    await expect(repository.softDeleteProfile('p1', qr)).resolves.toBe(true);
    await expect(repository.softDeleteProfile('p1', qr)).resolves.toBe(false);
  });

  it('updates the Better Auth display name with a parametrised query', async () => {
    query.mockResolvedValue({ rowCount: 1 });
    await expect(repository.updateUserNameByAuthUserId('auth-1', 'Ana Gil', qr)).resolves.toBe(
      true,
    );
    expect(query).toHaveBeenCalledWith(expect.stringContaining('UPDATE users'), [
      'Ana Gil',
      'auth-1',
    ]);
  });

  it('returns false when no Better Auth user was updated', async () => {
    query.mockResolvedValue({ rowCount: 0 });
    await expect(repository.updateUserNameByAuthUserId('x', 'n', qr)).resolves.toBe(false);
  });

  describe('getProviderLogin', () => {
    it('returns the provider of the first linked account', async () => {
      query.mockResolvedValue([{ providerId: 'google' }]);
      await expect(repository.getProviderLogin('auth-1', qr)).resolves.toBe('google');
    });

    it("falls back to 'local' when the user has no accounts", async () => {
      query.mockResolvedValue([]);
      await expect(repository.getProviderLogin('auth-1')).resolves.toBe('local');
    });
  });
});
