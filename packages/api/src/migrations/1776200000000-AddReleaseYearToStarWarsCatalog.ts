import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReleaseYearToStarWarsCatalog1776200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "star_wars_catalog" ADD COLUMN IF NOT EXISTS "releaseYear" integer`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "star_wars_catalog" DROP COLUMN IF EXISTS "releaseYear"`,
    );
  }
}
