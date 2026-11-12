import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1778862199075 implements MigrationInterface {
  name = 'InitialSchema1778862199075';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "languages" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "code" character varying NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_9c0e155475f0aa782e4a6178969" UNIQUE ("name"),
                CONSTRAINT "UQ_7397752718d1c9eb873722ec9b2" UNIQUE ("code"),
                CONSTRAINT "PK_b517f827ca496b29f4d549c631d" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "user_profiles" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "auth_user_id" text NOT NULL,
                "name" character varying NOT NULL,
                "last_name" character varying,
                "roles" text array NOT NULL DEFAULT '{USER}',
                "phone" character varying,
                "birth_date" date,
                "gender" character varying,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "language" uuid,
                CONSTRAINT "UQ_0182bd232f7cd50face0b8340de" UNIQUE ("auth_user_id"),
                CONSTRAINT "PK_1ec6662219f4605723f1e41b6cb" PRIMARY KEY ("id")
            );
            COMMENT ON COLUMN "user_profiles"."roles" IS 'List of roles assigned to the user. Valid values: ADMIN | USER'
        `);
    await queryRunner.query(`
            CREATE TABLE "notification_templates" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "code" character varying(100) NOT NULL,
                "description" character varying(150) NOT NULL,
                "params" jsonb NOT NULL DEFAULT '[]',
                "is_active" boolean NOT NULL DEFAULT true,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_0f527489aa40b6ba96faf6b5024" UNIQUE ("code"),
                CONSTRAINT "PK_76f0fc48b8d057d2ae7f3a2848a" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "notifications" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "email" text,
                "phone" character varying(25),
                "body_html" text,
                "body_text" text,
                "params" jsonb NOT NULL DEFAULT '{}',
                "status" character varying(20) NOT NULL DEFAULT 'sent',
                "sent_at" TIMESTAMP NOT NULL DEFAULT now(),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "template" uuid,
                CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "notification_template_translations" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "subject" character varying(255) NOT NULL,
                "html_template" text,
                "sms_template" text,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "template" uuid,
                "language" uuid,
                CONSTRAINT "PK_4e938c4588eef8d191f9e4377ac" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "user_profiles"
            ADD CONSTRAINT "FK_042736c583dd711aa21efc988aa" FOREIGN KEY ("language") REFERENCES "languages"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "notifications"
            ADD CONSTRAINT "FK_bf4b677e4eeffd6241d66eba383" FOREIGN KEY ("template") REFERENCES "notification_templates"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "notification_template_translations"
            ADD CONSTRAINT "FK_40066968c4e3caeb85762ad9ea4" FOREIGN KEY ("template") REFERENCES "notification_templates"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "notification_template_translations"
            ADD CONSTRAINT "FK_648beb8ea5089d1ad729c6d823f" FOREIGN KEY ("language") REFERENCES "languages"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "notification_template_translations" DROP CONSTRAINT "FK_648beb8ea5089d1ad729c6d823f"
        `);
    await queryRunner.query(`
            ALTER TABLE "notification_template_translations" DROP CONSTRAINT "FK_40066968c4e3caeb85762ad9ea4"
        `);
    await queryRunner.query(`
            ALTER TABLE "notifications" DROP CONSTRAINT "FK_bf4b677e4eeffd6241d66eba383"
        `);
    await queryRunner.query(`
            ALTER TABLE "user_profiles" DROP CONSTRAINT "FK_042736c583dd711aa21efc988aa"
        `);
    await queryRunner.query(`
            DROP TABLE "notification_template_translations"
        `);
    await queryRunner.query(`
            DROP TABLE "notifications"
        `);
    await queryRunner.query(`
            DROP TABLE "notification_templates"
        `);
    await queryRunner.query(`
            DROP TABLE "user_profiles"
        `);
    await queryRunner.query(`
            DROP TABLE "languages"
        `);
  }
}
