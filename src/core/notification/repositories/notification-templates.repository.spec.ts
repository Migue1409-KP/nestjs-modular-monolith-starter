import { DataSource } from 'typeorm';
import { NotificationTemplatesRepository } from './notification-templates.repository';
import { NotificationTemplateTranslationsRepository } from './notification-template-translations.repository';

const dataSource = { createEntityManager: () => ({}) } as unknown as DataSource;
const makeRepo = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});
const runnerFor = (repo: ReturnType<typeof makeRepo>) =>
  ({ manager: { getRepository: () => repo } }) as any;

describe('NotificationTemplatesRepository', () => {
  const repo = makeRepo();
  const qr = runnerFor(repo);
  let repository: NotificationTemplatesRepository;

  beforeEach(() => {
    jest.resetAllMocks();
    repository = new NotificationTemplatesRepository(dataSource);
  });

  it('creates and saves a template', async () => {
    repo.create.mockReturnValue({ code: 'X' });
    repo.save.mockResolvedValue({ id: '1', code: 'X' });
    await expect(repository.createEntity({ code: 'X' }, qr)).resolves.toEqual({
      id: '1',
      code: 'X',
    });
  });

  it('reads templates by id, by code (with translations) and only the active ones', async () => {
    repo.find.mockResolvedValue([]);
    repo.findOne.mockResolvedValue({ id: '1' });

    await repository.findAll(qr);
    await repository.findById('1', qr);
    await repository.findByCode('MAGIC_LINK', qr);
    await repository.findActive(qr);

    expect(repo.find).toHaveBeenNthCalledWith(1);
    expect(repo.findOne).toHaveBeenNthCalledWith(1, { where: { id: '1' } });
    expect(repo.findOne).toHaveBeenNthCalledWith(2, {
      where: { code: 'MAGIC_LINK' },
      relations: ['translations'],
    });
    expect(repo.find).toHaveBeenNthCalledWith(2, { where: { isActive: true } });
  });

  it('updates and re-reads the template', async () => {
    repo.update.mockResolvedValue({ affected: 1 });
    repo.findOne.mockResolvedValue({ id: '1', description: 'new' });
    await expect(repository.updateEntity('1', { description: 'new' }, qr)).resolves.toMatchObject({
      description: 'new',
    });
  });

  it('soft-deletes by deactivating and reports whether a row changed', async () => {
    repo.update.mockResolvedValueOnce({ affected: 1 }).mockResolvedValueOnce({ affected: 0 });
    await expect(repository.softDeleteTemplate('1', qr)).resolves.toBe(true);
    await expect(repository.softDeleteTemplate('1', qr)).resolves.toBe(false);
    expect(repo.update).toHaveBeenCalledWith('1', { isActive: false });
  });

  it('reports whether a hard delete removed a row', async () => {
    repo.delete.mockResolvedValueOnce({ affected: 1 }).mockResolvedValueOnce({ affected: null });
    await expect(repository.deleteEntity('1', qr)).resolves.toBe(true);
    await expect(repository.deleteEntity('1', qr)).resolves.toBe(false);
  });
});

describe('NotificationTemplateTranslationsRepository', () => {
  const repo = makeRepo();
  const qr = runnerFor(repo);
  let repository: NotificationTemplateTranslationsRepository;

  beforeEach(() => {
    jest.resetAllMocks();
    repository = new NotificationTemplateTranslationsRepository(dataSource);
  });

  it('creates and saves a translation', async () => {
    repo.create.mockReturnValue({ subject: 's' });
    repo.save.mockResolvedValue({ id: '1', subject: 's' });
    await expect(repository.createEntity({ subject: 's' }, qr)).resolves.toMatchObject({ id: '1' });
  });

  it('always loads template and language relations', async () => {
    repo.find.mockResolvedValue([]);
    repo.findOne.mockResolvedValue({ id: '1' });

    await repository.findAll(qr);
    await repository.findById('1', qr);

    expect(repo.find).toHaveBeenCalledWith({ relations: ['template', 'language'] });
    expect(repo.findOne).toHaveBeenCalledWith({
      where: { id: '1' },
      relations: ['template', 'language'],
    });
  });

  it('looks a translation up by template code and language code', async () => {
    repo.findOne.mockResolvedValue({ id: '1' });
    await repository.findByTemplateCodeAndLanguageCode('MAGIC_LINK', 'es', qr);
    expect(repo.findOne).toHaveBeenCalledWith({
      where: { template: { code: 'MAGIC_LINK' }, language: { code: 'es' } },
      relations: ['template', 'language'],
    });
  });

  it('updates, re-reads and deletes', async () => {
    repo.update.mockResolvedValue({ affected: 1 });
    repo.findOne.mockResolvedValue({ id: '1', subject: 'n' });
    repo.delete.mockResolvedValueOnce({ affected: 1 }).mockResolvedValueOnce({ affected: 0 });

    await expect(repository.updateEntity('1', { subject: 'n' }, qr)).resolves.toMatchObject({
      subject: 'n',
    });
    await expect(repository.deleteEntity('1', qr)).resolves.toBe(true);
    await expect(repository.deleteEntity('1', qr)).resolves.toBe(false);
  });
});
