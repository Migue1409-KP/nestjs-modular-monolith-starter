import { DataSource } from 'typeorm';
import { NotificationsRepository } from './notifications.repository';
import { NotificationStatus } from '../entities/notifications.entity';

describe('NotificationsRepository', () => {
  const dataSource = { createEntityManager: () => ({}) } as unknown as DataSource;
  const repo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const qr = { manager: { getRepository: () => repo } } as any;
  let repository: NotificationsRepository;

  beforeEach(() => {
    jest.resetAllMocks();
    repository = new NotificationsRepository(dataSource);
  });

  it('creates and saves a notification', async () => {
    repo.create.mockReturnValue({ email: 'a@b.co' });
    repo.save.mockResolvedValue({ id: 'n1', email: 'a@b.co' });
    await expect(repository.createEntity({ email: 'a@b.co' }, qr)).resolves.toMatchObject({
      id: 'n1',
    });
  });

  it('loads the template relation on every read', async () => {
    repo.find.mockResolvedValue([]);
    repo.findOne.mockResolvedValue({ id: 'n1' });

    await repository.findAll(qr);
    await repository.findById('n1', qr);
    await repository.findByEmail('a@b.co', qr);
    await repository.findByStatus(NotificationStatus.FAILED, qr);

    expect(repo.find).toHaveBeenNthCalledWith(1, { relations: ['template'] });
    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 'n1' }, relations: ['template'] });
    expect(repo.find).toHaveBeenNthCalledWith(2, {
      where: { email: 'a@b.co' },
      relations: ['template'],
    });
    expect(repo.find).toHaveBeenNthCalledWith(3, {
      where: { status: NotificationStatus.FAILED },
      relations: ['template'],
    });
  });

  describe('findPaginated', () => {
    it('applies filters, newest-first ordering and offset pagination', async () => {
      const spy = jest.spyOn(repository, 'findAndCount').mockResolvedValue([[], 0]);

      await repository.findPaginated(
        { status: NotificationStatus.SENT, email: 'a@b.co', templateCode: 'MAGIC_LINK' },
        3,
        10,
      );

      expect(spy).toHaveBeenCalledWith({
        where: {
          status: NotificationStatus.SENT,
          email: 'a@b.co',
          template: { code: 'MAGIC_LINK' },
        },
        relations: ['template'],
        order: { createdAt: 'DESC' },
        skip: 20,
        take: 10,
      });
    });

    it('omits filters that were not provided', async () => {
      const spy = jest.spyOn(repository, 'findAndCount').mockResolvedValue([[], 0]);
      await repository.findPaginated({}, 1, 25);
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ where: {}, skip: 0, take: 25 }));
    });
  });

  describe('claimFailedForRetry', () => {
    it('only touches rows that are still FAILED', async () => {
      repo.update.mockResolvedValue({ affected: 1 });
      await expect(repository.claimFailedForRetry('n1', qr)).resolves.toBe(true);
      expect(repo.update).toHaveBeenCalledWith(
        { id: 'n1', status: NotificationStatus.FAILED },
        { status: NotificationStatus.PENDING },
      );
    });

    it('returns false when another retry already claimed it', async () => {
      repo.update.mockResolvedValue({ affected: 0 });
      await expect(repository.claimFailedForRetry('n1', qr)).resolves.toBe(false);
    });
  });

  it('updates an entity and returns the refreshed record', async () => {
    repo.update.mockResolvedValue({ affected: 1 });
    repo.findOne.mockResolvedValue({ id: 'n1', status: NotificationStatus.SENT });
    await expect(
      repository.updateEntity('n1', { status: NotificationStatus.SENT }, qr),
    ).resolves.toMatchObject({ status: NotificationStatus.SENT });
  });

  it('updates only the status', async () => {
    repo.update.mockResolvedValue({ affected: 1 });
    repo.findOne.mockResolvedValue({ id: 'n1' });
    await repository.updateStatus('n1', NotificationStatus.FAILED, qr);
    expect(repo.update).toHaveBeenCalledWith('n1', { status: NotificationStatus.FAILED });
  });

  it('reports whether a delete removed a row', async () => {
    repo.delete.mockResolvedValueOnce({ affected: 1 }).mockResolvedValueOnce({ affected: null });
    await expect(repository.deleteEntity('n1', qr)).resolves.toBe(true);
    await expect(repository.deleteEntity('n1', qr)).resolves.toBe(false);
  });
});
