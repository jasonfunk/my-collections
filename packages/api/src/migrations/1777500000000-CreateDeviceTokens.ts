import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDeviceTokens1777500000000 implements MigrationInterface {
  name = 'CreateDeviceTokens1777500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TYPE "public"."device_tokens_platform_enum" AS ENUM('android', 'ios')
    `);

    await queryRunner.query(`
      CREATE TABLE "device_tokens" (
        "id"         uuid              NOT NULL DEFAULT uuid_generate_v4(),
        "userId"     uuid              NOT NULL,
        "token"      character varying NOT NULL,
        "platform"   "public"."device_tokens_platform_enum" NOT NULL DEFAULT 'android',
        "createdAt"  TIMESTAMP         NOT NULL DEFAULT now(),
        "updatedAt"  TIMESTAMP         NOT NULL DEFAULT now(),
        CONSTRAINT "PK_device_tokens" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_device_tokens_token" ON "device_tokens" ("token")
    `);

    await queryRunner.query(`
      ALTER TABLE "device_tokens"
        ADD CONSTRAINT "FK_device_tokens_user"
        FOREIGN KEY ("userId") REFERENCES "users"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "device_tokens" DROP CONSTRAINT "FK_device_tokens_user"`);
    await queryRunner.query(`DROP INDEX "UQ_device_tokens_token"`);
    await queryRunner.query(`DROP TABLE "device_tokens"`);
    await queryRunner.query(`DROP TYPE "public"."device_tokens_platform_enum"`);
  }
}
