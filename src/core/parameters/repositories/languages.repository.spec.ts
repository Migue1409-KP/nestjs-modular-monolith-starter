import { DataSource } from 'typeorm';
import { LanguagesRepository } from './languages.repostiry';

const fakeDataSource = () => ({ createEntityManager: () => ({}) }) as unknown as DataSource;

// A QueryRunner whose manager hands out the mocked TypeORM repository.
const queryRunnerWith = (repo: Record<string, jest.Mock>) =>
  ({ manager: { getRepository: () => repo } }) as any;

describe('LanguagesRepository', () => {
  let repository: LanguagesRepository;
  const repo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const qr = queryRunnerWith(repo);

  beforeEach(() => {
    jest.resetAllMocks();
    repository = new LanguagesRepository(fakeDataSource());
  });

  it('lists every language ordered by name', async () => {
    repo.find.mockResolvedValue([{ id: '1' }]);
    await expect(repository.findAll(qr)).resolves.toEqual([{ id: '1' }]);
    expect(repo.find).toHaveBeenCalledWith({ order: { name: 'ASC' } });
  });

  it('lists only active languages', async () => {
    repo.find.mockResolvedValue([]);
    await repository.findAllActive(qr);
    expect(repo.find).toHaveBeenCalledWith({ where: { isActive: true }, order: { name: 'ASC' } });
  });

  it.each([
    ['findOneById', 'id-1', { id: 'id-1' }],
    ['findOneByCode', 'es', { code: 'es' }],
    ['findOneByName', 'Spanish', { name: 'Spanish' }],
  ] as const)('%s queries by the matching column', async (method, value, where) => {
    repo.findOne.mockResolvedValue({ id: '1' });
    await expect(repository[method](value, qr)).resolves.toEqual({ id: '1' });
    expect(repo.findOne).toHaveBeenCalledWith({ where });
  });

  it('creates and saves an entity', async () => {
    repo.create.mockReturnValue({ code: 'en' });
    repo.save.mockResolvedValue({ id: '1', code: 'en' });
    await expect(repository.createEntity({ code: 'en' }, qr)).resolves.toEqual({
      id: '1',
      code: 'en',
    });
    expect(repo.save).toHaveBeenCalledWith({ code: 'en' });
  });

  it('updates and returns the refreshed entity', async () => {
    repo.update.mockResolvedValue({ affected: 1 });
    repo.findOne.mockResolvedValue({ id: '1', name: 'New' });
    await expect(repository.updateEntity('1', { name: 'New' }, qr)).resolves.toEqual({
      id: '1',
      name: 'New',
    });
    expect(repo.update).toHaveBeenCalledWith('1', { name: 'New' });
  });

  it('reports whether a delete removed a row', async () => {
    repo.delete.mockResolvedValueOnce({ affected: 1 }).mockResolvedValueOnce({ affected: 0 });
    await expect(repository.deleteEntity('1', qr)).resolves.toBe(true);
    await expect(repository.deleteEntity('1', qr)).resolves.toBe(false);
  });

  it('treats an unknown affected count as no rows deleted', async () => {
    repo.delete.mockResolvedValue({ affected: undefined });
    await expect(repository.deleteEntity('1', qr)).resolves.toBe(false);
  });
});
