import { Transactional, TransactionalWithContext } from './transactional.decorator';

const makeQueryRunner = () => ({
  connect: jest.fn(),
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  rollbackTransaction: jest.fn(),
  release: jest.fn(),
});

describe('@Transactional', () => {
  class Service {
    constructor(public dataSource?: unknown) {}

    @Transactional()
    async run(value: number, shouldFail = false, queryRunner?: unknown) {
      if (shouldFail) throw new Error('boom');
      return { value, queryRunner };
    }
  }

  it('passes the query runner as the last argument and commits', async () => {
    const queryRunner = makeQueryRunner();
    const service = new Service({ createQueryRunner: () => queryRunner });

    const result = await service.run(7, false);

    expect(result.queryRunner).toBe(queryRunner);
    expect(queryRunner.startTransaction).toHaveBeenCalled();
    expect(queryRunner.commitTransaction).toHaveBeenCalled();
    expect(queryRunner.rollbackTransaction).not.toHaveBeenCalled();
    expect(queryRunner.release).toHaveBeenCalled();
  });

  it('rolls back, releases and re-throws when the method fails', async () => {
    const queryRunner = makeQueryRunner();
    const service = new Service({ createQueryRunner: () => queryRunner });

    await expect(service.run(1, true)).rejects.toThrow('boom');

    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
    expect(queryRunner.release).toHaveBeenCalled();
  });

  it('explains how to fix a service without an injected dataSource', async () => {
    await expect(new Service().run(1)).rejects.toThrow(/requires 'dataSource'/);
  });
});

describe('@TransactionalWithContext', () => {
  class Service {
    queryRunner?: unknown;
    constructor(public dataSource?: unknown) {}

    @TransactionalWithContext()
    async run(shouldFail = false) {
      const seen = this.queryRunner;
      if (shouldFail) throw new Error('boom');
      return seen;
    }
  }

  it('exposes the query runner on `this` during the call and restores it afterwards', async () => {
    const queryRunner = makeQueryRunner();
    const service = new Service({ createQueryRunner: () => queryRunner });
    const previous = { previous: true };
    service.queryRunner = previous;

    await expect(service.run()).resolves.toBe(queryRunner);

    expect(service.queryRunner).toBe(previous);
    expect(queryRunner.commitTransaction).toHaveBeenCalled();
    expect(queryRunner.release).toHaveBeenCalled();
  });

  it('rolls back, restores the context and re-throws on failure', async () => {
    const queryRunner = makeQueryRunner();
    const service = new Service({ createQueryRunner: () => queryRunner });

    await expect(service.run(true)).rejects.toThrow('boom');

    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    expect(service.queryRunner).toBeUndefined();
    expect(queryRunner.release).toHaveBeenCalled();
  });

  it('requires an injected dataSource', async () => {
    await expect(new Service().run()).rejects.toThrow(/requires 'dataSource'/);
  });
});
