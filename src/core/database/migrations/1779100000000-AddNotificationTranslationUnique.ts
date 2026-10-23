import { MigrationInterface, QueryRunner } from 'typeorm';

// The entity declares this unique constraint but no earlier migration created it.
export class AddNotificationTranslationUnique1779100000000 implements MigrationInterface {
  name = 'AddNotificationTranslationUnique1779100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notification_template_translations" ADD CONSTRAINT "UQ_notification_template_translations_template_language" UNIQUE ("template", "language")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notification_template_translations" DROP CONSTRAINT "UQ_notification_template_translations_template_language"`,
    );
  }
}
