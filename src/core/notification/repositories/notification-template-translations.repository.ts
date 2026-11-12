import { Injectable } from '@nestjs/common';
import { DataSource, Repository, QueryRunner } from 'typeorm';
import { NotificationTemplateTranslation } from '../entities/notifcation-template-translations.entity';

@Injectable()
export class NotificationTemplateTranslationsRepository extends Repository<NotificationTemplateTranslation> {
  constructor(private dataSource: DataSource) {
    super(NotificationTemplateTranslation, dataSource.createEntityManager());
  }

  private getRepository(queryRunner?: QueryRunner): Repository<NotificationTemplateTranslation> {
    return queryRunner ? queryRunner.manager.getRepository(NotificationTemplateTranslation) : this;
  }

  async createEntity(
    data: Partial<NotificationTemplateTranslation>,
    queryRunner?: QueryRunner,
  ): Promise<NotificationTemplateTranslation> {
    const repo = this.getRepository(queryRunner);
    const translation = repo.create(data);
    return await repo.save(translation);
  }

  async findAll(queryRunner?: QueryRunner): Promise<NotificationTemplateTranslation[]> {
    return await this.getRepository(queryRunner).find({
      relations: ['template', 'language'],
    });
  }

  async findById(
    id: string,
    queryRunner?: QueryRunner,
  ): Promise<NotificationTemplateTranslation | null> {
    return await this.getRepository(queryRunner).findOne({
      where: { id },
      relations: ['template', 'language'],
    });
  }

  async findByTemplateCodeAndLanguageCode(
    templateCode: string,
    languageCode: string,
    queryRunner?: QueryRunner,
  ): Promise<NotificationTemplateTranslation | null> {
    return await this.getRepository(queryRunner).findOne({
      where: {
        template: { code: templateCode },
        language: { code: languageCode },
      },
      relations: ['template', 'language'],
    });
  }

  async updateEntity(
    id: string,
    data: Partial<NotificationTemplateTranslation>,
    queryRunner?: QueryRunner,
  ): Promise<NotificationTemplateTranslation | null> {
    await this.getRepository(queryRunner).update(id, data);
    return await this.findById(id, queryRunner);
  }

  async deleteEntity(id: string, queryRunner?: QueryRunner): Promise<boolean> {
    const result = await this.getRepository(queryRunner).delete(id);
    return (result.affected ?? 0) > 0;
  }
}
