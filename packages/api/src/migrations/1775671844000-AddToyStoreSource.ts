import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddToyStoreSource1775671844000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL does not support removing enum values (no DROP VALUE).
    // The down() method is intentionally a no-op.
    await queryRunner.query(
      `ALTER TYPE "public"."user_star_wars_items_acquisitionsource_enum" ADD VALUE IF NOT EXISTS 'TOY_STORE'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."user_g1_transformers_items_acquisitionsource_enum" ADD VALUE IF NOT EXISTS 'TOY_STORE'`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."user_masters_items_acquisitionsource_enum" ADD VALUE IF NOT EXISTS 'TOY_STORE'`,
    );
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL does not support removing enum values once added (no DROP VALUE).
    // This migration cannot be fully reversed.
  }
}
