import { Injectable } from '@nestjs/common';
import { DataSource, Repository, QueryRunner } from 'typeorm';
import { UserProfile } from '../entities/user-profiles.entity';

@Injectable()
export class UserRepository extends Repository<UserProfile> {
  constructor(private dataSource: DataSource) {
    super(UserProfile, dataSource.createEntityManager());
  }

  private getRepository(queryRunner?: QueryRunner): Repository<UserProfile> {
    return queryRunner ? queryRunner.manager.getRepository(UserProfile) : this;
  }

  async findAll(queryRunner?: QueryRunner): Promise<UserProfile[]> {
    return this.getRepository(queryRunner).find();
  }

  async findOneById(id: string, queryRunner?: QueryRunner): Promise<UserProfile | null> {
    return this.getRepository(queryRunner).findOne({
      where: { id },
      relations: ['language'],
    });
  }

  async findOneByAuthUserId(
    auth_user_id: string,
    queryRunner?: QueryRunner,
  ): Promise<UserProfile | null> {
    return this.getRepository(queryRunner).findOne({
      where: { authUserId: auth_user_id },
      relations: ['language'],
    });
  }

  async createEntity(data: UserProfile, queryRunner?: QueryRunner): Promise<UserProfile> {
    const repo = this.getRepository(queryRunner);
    const userProfile = repo.create(data);
    return repo.save(userProfile);
  }

  async updateEntity(
    id: string,
    data: Partial<UserProfile>,
    queryRunner?: QueryRunner,
  ): Promise<UserProfile | null> {
    await this.getRepository(queryRunner).update(id, data);
    return this.findOneById(id, queryRunner);
  }

  async deleteEntity(id: string, queryRunner?: QueryRunner): Promise<boolean> {
    const result = await this.getRepository(queryRunner).delete(id);
    return (result.affected ?? 0) > 0;
  }

  async softDeleteProfile(id: string, queryRunner?: QueryRunner): Promise<boolean> {
    const result = await this.getRepository(queryRunner).softDelete(id);
    return (result.affected ?? 0) > 0;
  }

  async updateUserNameByAuthUserId(
    authUserId: string,
    name: string,
    queryRunner?: QueryRunner,
  ): Promise<boolean> {
    const connection = queryRunner ? queryRunner.connection : this.dataSource;
    const result = await connection.query(
      `
        UPDATE users
        SET "name"=$1
        WHERE id=$2;
      `,
      [name, authUserId],
    );

    return result.rowCount > 0;
  }

  async getProviderLogin(authUserId: string, queryRunner?: QueryRunner): Promise<string> {
    const connection = queryRunner ? queryRunner.connection : this.dataSource;
    const result: any[] = await connection.query(
      `
        SELECT a."providerId"
        FROM users u
        JOIN accounts a
          ON u.id = a."userId"
        WHERE u.id = $1
        LIMIT 1;
      `,
      [authUserId],
    );

    return result && result.length > 0 ? result[0].providerId : 'local';
  }
}
