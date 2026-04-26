import { MigrationInterface, QueryRunner } from "typeorm";

export class AddReleaseYearToG1TransformersCatalog1777169107658 implements MigrationInterface {
    name = 'AddReleaseYearToG1TransformersCatalog1777169107658'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "g1_transformers_catalog" ADD "releaseYear" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "g1_transformers_catalog" DROP COLUMN "releaseYear"`);
    }

}
