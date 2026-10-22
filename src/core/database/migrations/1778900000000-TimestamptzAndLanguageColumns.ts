import { MigrationInterface, QueryRunner } from 'typeorm';

const TIMESTAMP_COLUMNS: Array<[table: string, columns: string[]]> = [
  ['languages', ['created_at', 'updated_at']],
  ['user_profiles', ['created_at', 'updated_at']],
  ['notification_templates', ['created_at', 'updated_at']],
  ['notifications', ['sent_at', 'created_at', 'updated_at']],
  ['notification_template_translations', ['created_at', 'updated_at']],
];

export class TimestamptzAndLanguageColumns1778900000000 implements MigrationInterface {
  name = 'TimestamptzAndLanguageColumns1778900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Existing values were stored as UTC wall-clock time, so interpret them as UTC.
    for (const [table, columns] of TIMESTAMP_COLUMNS) {
      for (const column of columns) {
        await queryRunner.query(
          `ALTER TABLE "${table}" ALTER COLUMN "${column}" TYPE TIMESTAMP WITH TIME ZONE USING "${column}" AT TIME ZONE 'UTC'`,
        );
      }
    }

    await queryRunner.query(
      `ALTER TABLE "languages" ALTER COLUMN "code" TYPE character varying(10)`,
    );
    await queryRunner.query(`ALTER TABLE "languages" ADD "native_name" character varying(100)`);
    await queryRunner.query(
      `ALTER TABLE "languages" ADD "is_active" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `COMMENT ON COLUMN "languages"."code" IS 'ISO 639-1 two-letter language code'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`COMMENT ON COLUMN "languages"."code" IS NULL`);
    await queryRunner.query(`ALTER TABLE "languages" DROP COLUMN "is_active"`);
    await queryRunner.query(`ALTER TABLE "languages" DROP COLUMN "native_name"`);
    await queryRunner.query(`ALTER TABLE "languages" ALTER COLUMN "code" TYPE character varying`);

    for (const [table, columns] of TIMESTAMP_COLUMNS) {
      for (const column of columns) {
        await queryRunner.query(
          `ALTER TABLE "${table}" ALTER COLUMN "${column}" TYPE TIMESTAMP USING "${column}" AT TIME ZONE 'UTC'`,
        );
      }
    }
  }
}
