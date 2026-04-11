import { MigrationInterface, QueryRunner } from "typeorm";

export class UserIsApprovedDefaultFalse1775948205418 implements MigrationInterface {
    name = 'UserIsApprovedDefaultFalse1775948205418'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_star_wars_items" DROP CONSTRAINT "FK_user_star_wars_items_catalog"`);
        await queryRunner.query(`ALTER TABLE "user_star_wars_items" DROP CONSTRAINT "FK_user_star_wars_items_user"`);
        await queryRunner.query(`ALTER TABLE "user_masters_items" DROP CONSTRAINT "FK_user_masters_items_catalog"`);
        await queryRunner.query(`ALTER TABLE "user_masters_items" DROP CONSTRAINT "FK_user_masters_items_user"`);
        await queryRunner.query(`ALTER TABLE "user_g1_transformers_items" DROP CONSTRAINT "FK_user_g1_transformers_items_catalog"`);
        await queryRunner.query(`ALTER TABLE "user_g1_transformers_items" DROP CONSTRAINT "FK_user_g1_transformers_items_user"`);
        await queryRunner.query(`ALTER TABLE "user_star_wars_items" DROP CONSTRAINT "UQ_user_star_wars_items_catalog_user"`);
        await queryRunner.query(`ALTER TABLE "user_masters_items" DROP CONSTRAINT "UQ_user_masters_items_catalog_user"`);
        await queryRunner.query(`ALTER TABLE "user_g1_transformers_items" DROP CONSTRAINT "UQ_user_g1_transformers_items_catalog_user"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "isApproved" SET DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "user_star_wars_items" ADD CONSTRAINT "FK_77953505ffbeb877058d569451c" FOREIGN KEY ("catalogId") REFERENCES "star_wars_catalog"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_star_wars_items" ADD CONSTRAINT "FK_1ec3e59c57ddf3f9d06ce0e0c6b" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_masters_items" ADD CONSTRAINT "FK_a23a3d74fddd0f52e5fa412defe" FOREIGN KEY ("catalogId") REFERENCES "masters_catalog"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_masters_items" ADD CONSTRAINT "FK_03705539fb639b86d4e0c4bfaa4" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_g1_transformers_items" ADD CONSTRAINT "FK_95dda8a61819f7f5daa74dd3a34" FOREIGN KEY ("catalogId") REFERENCES "g1_transformers_catalog"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_g1_transformers_items" ADD CONSTRAINT "FK_d1adf35891c27acf85b9e62f924" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_g1_transformers_items" DROP CONSTRAINT "FK_d1adf35891c27acf85b9e62f924"`);
        await queryRunner.query(`ALTER TABLE "user_g1_transformers_items" DROP CONSTRAINT "FK_95dda8a61819f7f5daa74dd3a34"`);
        await queryRunner.query(`ALTER TABLE "user_masters_items" DROP CONSTRAINT "FK_03705539fb639b86d4e0c4bfaa4"`);
        await queryRunner.query(`ALTER TABLE "user_masters_items" DROP CONSTRAINT "FK_a23a3d74fddd0f52e5fa412defe"`);
        await queryRunner.query(`ALTER TABLE "user_star_wars_items" DROP CONSTRAINT "FK_1ec3e59c57ddf3f9d06ce0e0c6b"`);
        await queryRunner.query(`ALTER TABLE "user_star_wars_items" DROP CONSTRAINT "FK_77953505ffbeb877058d569451c"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "isApproved" SET DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "user_g1_transformers_items" ADD CONSTRAINT "UQ_user_g1_transformers_items_catalog_user" UNIQUE ("catalogId", "userId")`);
        await queryRunner.query(`ALTER TABLE "user_masters_items" ADD CONSTRAINT "UQ_user_masters_items_catalog_user" UNIQUE ("catalogId", "userId")`);
        await queryRunner.query(`ALTER TABLE "user_star_wars_items" ADD CONSTRAINT "UQ_user_star_wars_items_catalog_user" UNIQUE ("catalogId", "userId")`);
        await queryRunner.query(`ALTER TABLE "user_g1_transformers_items" ADD CONSTRAINT "FK_user_g1_transformers_items_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_g1_transformers_items" ADD CONSTRAINT "FK_user_g1_transformers_items_catalog" FOREIGN KEY ("catalogId") REFERENCES "g1_transformers_catalog"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_masters_items" ADD CONSTRAINT "FK_user_masters_items_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_masters_items" ADD CONSTRAINT "FK_user_masters_items_catalog" FOREIGN KEY ("catalogId") REFERENCES "masters_catalog"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_star_wars_items" ADD CONSTRAINT "FK_user_star_wars_items_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_star_wars_items" ADD CONSTRAINT "FK_user_star_wars_items_catalog" FOREIGN KEY ("catalogId") REFERENCES "star_wars_catalog"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
