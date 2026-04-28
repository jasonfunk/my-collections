import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSubgroupToG1TransformersCatalog1777343576882 implements MigrationInterface {
    name = 'AddSubgroupToG1TransformersCatalog1777343576882'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "g1_transformers_catalog" ADD "subgroup" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "g1_transformers_catalog" DROP COLUMN "subgroup"`);
    }

}
