import { Injectable } from '@nestjs/common';
import { DataSource, Repository, QueryRunner } from 'typeorm';
import { Language } from '../entities/languages.entity';

@Injectable()
export class LanguagesRepository extends Repository<Language> {
  constructor(private dataSource: DataSource) {
    super(Language, dataSource.createEntityManager());
  }

  private getRepository(queryRunner?: QueryRunner): Repository<Language> {
    return queryRunner ? queryRunner.manager.getRepository(Language) : this;
  }

  async findAll(queryRunner?: QueryRunner): Promise<Language[]> {
    return this.getRepository(queryRunner).find({ order: { name: 'ASC' } });
  }

  async findAllActive(queryRunner?: QueryRunner): Promise<Language[]> {
    return this.getRepository(queryRunner).find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findOneById(id: string, queryRunner?: QueryRunner): Promise<Language | null> {
    return this.getRepository(queryRunner).findOne({ where: { id } });
  }

  async findOneByCode(code: string, queryRunner?: QueryRunner): Promise<Language | null> {
    return this.getRepository(queryRunner).findOne({ where: { code } });
  }

  async findOneByName(name: string, queryRunner?: QueryRunner): Promise<Language | null> {
    return this.getRepository(queryRunner).findOne({ where: { name } });
  }

  async createEntity(data: Partial<Language>, queryRunner?: QueryRunner): Promise<Language> {
    const repo = this.getRepository(queryRunner);
    const language = repo.create(data);
    return repo.save(language);
  }

  async updateEntity(
    id: string,
    data: Partial<Language>,
    queryRunner?: QueryRunner,
  ): Promise<Language | null> {
    await this.getRepository(queryRunner).update(id, data);
    return this.findOneById(id, queryRunner);
  }

  async deleteEntity(id: string, queryRunner?: QueryRunner): Promise<boolean> {
    const result = await this.getRepository(queryRunner).delete(id);
    return result.affected > 0;
  }
}
