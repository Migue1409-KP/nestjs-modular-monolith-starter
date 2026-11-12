import { Injectable } from '@nestjs/common';
import { DataSource, Repository, QueryRunner } from 'typeorm';
import { NotificationTemplate } from '../entities/notification-templates.entity';

@Injectable()
export class NotificationTemplatesRepository extends Repository<NotificationTemplate> {
  constructor(private dataSource: DataSource) {
    super(NotificationTemplate, dataSource.createEntityManager());
  }

  private getRepository(queryRunner?: QueryRunner): Repository<NotificationTemplate> {
    return queryRunner ? queryRunner.manager.getRepository(NotificationTemplate) : this;
  }

  async createEntity(
    data: Partial<NotificationTemplate>,
    queryRunner?: QueryRunner,
  ): Promise<NotificationTemplate> {
    const repo = this.getRepository(queryRunner);
    const template = repo.create(data);
    return await repo.save(template);
  }

  async findAll(queryRunner?: QueryRunner): Promise<NotificationTemplate[]> {
    return await this.getRepository(queryRunner).find();
  }

  async findById(id: string, queryRunner?: QueryRunner): Promise<NotificationTemplate | null> {
    return await this.getRepository(queryRunner).findOne({ where: { id } });
  }

  async findByCode(code: string, queryRunner?: QueryRunner): Promise<NotificationTemplate | null> {
    return await this.getRepository(queryRunner).findOne({
      where: { code },
      relations: ['translations'],
    });
  }

  async findActive(queryRunner?: QueryRunner): Promise<NotificationTemplate[]> {
    return await this.getRepository(queryRunner).find({ where: { isActive: true } });
  }

  async updateEntity(
    id: string,
    data: Partial<NotificationTemplate>,
    queryRunner?: QueryRunner,
  ): Promise<NotificationTemplate | null> {
    await this.getRepository(queryRunner).update(id, data);
    return await this.findById(id, queryRunner);
  }

  async deleteEntity(id: string, queryRunner?: QueryRunner): Promise<boolean> {
    const result = await this.getRepository(queryRunner).delete(id);
    return (result.affected ?? 0) > 0;
  }

  async softDeleteTemplate(id: string, queryRunner?: QueryRunner): Promise<boolean> {
    const result = await this.getRepository(queryRunner).update(id, { isActive: false });
    return (result.affected ?? 0) > 0;
  }
}
