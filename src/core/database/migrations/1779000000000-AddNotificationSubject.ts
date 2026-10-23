import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotificationSubject1779000000000 implements MigrationInterface {
  name = 'AddNotificationSubject1779000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "notifications" ADD "subject" character varying(255)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "notifications" DROP COLUMN "subject"`);
  }
}
