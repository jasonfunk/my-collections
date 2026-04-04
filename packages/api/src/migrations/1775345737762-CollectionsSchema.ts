import { MigrationInterface, QueryRunner } from "typeorm";

export class CollectionsSchema1775345737762 implements MigrationInterface {
    name = 'CollectionsSchema1775345737762'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE TYPE "public"."star_wars_figures_collectiontype_enum" AS ENUM('STAR_WARS', 'TRANSFORMERS', 'HE_MAN')`);
        await queryRunner.query(`CREATE TYPE "public"."star_wars_figures_condition_enum" AS ENUM('C10', 'C9', 'C8', 'C7', 'C6', 'C5', 'C4', 'INC')`);
        await queryRunner.query(`CREATE TYPE "public"."star_wars_figures_packagingcondition_enum" AS ENUM('SEALED', 'C9', 'GOOD', 'FAIR', 'POOR', 'NONE')`);
        await queryRunner.query(`CREATE TYPE "public"."star_wars_figures_acquisitionsource_enum" AS ENUM('ORIGINAL', 'EBAY', 'ETSY', 'FLEA_MARKET', 'ANTIQUE_STORE', 'CONVENTION', 'PRIVATE_SALE', 'TRADE', 'GIFT', 'OTHER')`);
        await queryRunner.query(`CREATE TYPE "public"."star_wars_figures_line_enum" AS ENUM('STAR_WARS', 'EMPIRE_STRIKES_BACK', 'RETURN_OF_THE_JEDI', 'POWER_OF_THE_FORCE')`);
        await queryRunner.query(`CREATE TYPE "public"."star_wars_figures_figuresize_enum" AS ENUM('3.75', '12', 'MINI')`);
        await queryRunner.query(`CREATE TYPE "public"."star_wars_figures_cardbackstyle_enum" AS ENUM('12_BACK', '20_BACK', '31_BACK', '45_BACK', '48_BACK', '65_BACK', '77_BACK', 'ESB', 'ROTJ', 'POTF')`);
        await queryRunner.query(`CREATE TABLE "star_wars_figures" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "collectionType" "public"."star_wars_figures_collectiontype_enum" NOT NULL, "condition" "public"."star_wars_figures_condition_enum" NOT NULL, "packagingCondition" "public"."star_wars_figures_packagingcondition_enum" NOT NULL, "isOwned" boolean NOT NULL DEFAULT true, "isComplete" boolean NOT NULL DEFAULT false, "acquisitionSource" "public"."star_wars_figures_acquisitionsource_enum", "acquisitionDate" date, "acquisitionPrice" numeric(10,2), "estimatedValue" numeric(10,2), "notes" text, "photoUrls" text array NOT NULL DEFAULT '{}', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "line" "public"."star_wars_figures_line_enum" NOT NULL, "figureSize" "public"."star_wars_figures_figuresize_enum" NOT NULL, "isVariant" boolean NOT NULL DEFAULT false, "variantDescription" text, "cardbackStyle" "public"."star_wars_figures_cardbackstyle_enum", "isCarded" boolean NOT NULL DEFAULT false, "accessories" text array NOT NULL DEFAULT '{}', "ownedAccessories" text array NOT NULL DEFAULT '{}', "coinIncluded" boolean, "kennerItemNumber" character varying, "userId" uuid NOT NULL, CONSTRAINT "PK_2a91050ab9f2d4fef2e8f4827e6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."g1_transformers_collectiontype_enum" AS ENUM('STAR_WARS', 'TRANSFORMERS', 'HE_MAN')`);
        await queryRunner.query(`CREATE TYPE "public"."g1_transformers_condition_enum" AS ENUM('C10', 'C9', 'C8', 'C7', 'C6', 'C5', 'C4', 'INC')`);
        await queryRunner.query(`CREATE TYPE "public"."g1_transformers_packagingcondition_enum" AS ENUM('SEALED', 'C9', 'GOOD', 'FAIR', 'POOR', 'NONE')`);
        await queryRunner.query(`CREATE TYPE "public"."g1_transformers_acquisitionsource_enum" AS ENUM('ORIGINAL', 'EBAY', 'ETSY', 'FLEA_MARKET', 'ANTIQUE_STORE', 'CONVENTION', 'PRIVATE_SALE', 'TRADE', 'GIFT', 'OTHER')`);
        await queryRunner.query(`CREATE TYPE "public"."g1_transformers_faction_enum" AS ENUM('AUTOBOT', 'DECEPTICON')`);
        await queryRunner.query(`CREATE TYPE "public"."g1_transformers_line_enum" AS ENUM('G1_S1', 'G1_S2', 'G1_S3', 'G1_S4', 'G1_S5', 'G1_S6')`);
        await queryRunner.query(`CREATE TYPE "public"."g1_transformers_size_enum" AS ENUM('MINI', 'SMALL', 'MEDIUM', 'LARGE', 'JUMBO')`);
        await queryRunner.query(`CREATE TABLE "g1_transformers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "collectionType" "public"."g1_transformers_collectiontype_enum" NOT NULL, "condition" "public"."g1_transformers_condition_enum" NOT NULL, "packagingCondition" "public"."g1_transformers_packagingcondition_enum" NOT NULL, "isOwned" boolean NOT NULL DEFAULT true, "isComplete" boolean NOT NULL DEFAULT false, "acquisitionSource" "public"."g1_transformers_acquisitionsource_enum", "acquisitionDate" date, "acquisitionPrice" numeric(10,2), "estimatedValue" numeric(10,2), "notes" text, "photoUrls" text array NOT NULL DEFAULT '{}', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "faction" "public"."g1_transformers_faction_enum" NOT NULL, "line" "public"."g1_transformers_line_enum" NOT NULL, "size" "public"."g1_transformers_size_enum" NOT NULL, "altMode" character varying NOT NULL, "accessories" text array NOT NULL DEFAULT '{}', "ownedAccessories" text array NOT NULL DEFAULT '{}', "isBoxed" boolean NOT NULL DEFAULT false, "hasInstructions" boolean NOT NULL DEFAULT false, "hasTechSpec" boolean NOT NULL DEFAULT false, "isCombiner" boolean NOT NULL DEFAULT false, "combinerTeam" character varying, "isGiftSet" boolean, "isMailaway" boolean, "japaneseRelease" boolean, "rubSign" boolean, "userId" uuid NOT NULL, CONSTRAINT "PK_041c463c7a3e36596ee508d8de8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."masters_figures_collectiontype_enum" AS ENUM('STAR_WARS', 'TRANSFORMERS', 'HE_MAN')`);
        await queryRunner.query(`CREATE TYPE "public"."masters_figures_condition_enum" AS ENUM('C10', 'C9', 'C8', 'C7', 'C6', 'C5', 'C4', 'INC')`);
        await queryRunner.query(`CREATE TYPE "public"."masters_figures_packagingcondition_enum" AS ENUM('SEALED', 'C9', 'GOOD', 'FAIR', 'POOR', 'NONE')`);
        await queryRunner.query(`CREATE TYPE "public"."masters_figures_acquisitionsource_enum" AS ENUM('ORIGINAL', 'EBAY', 'ETSY', 'FLEA_MARKET', 'ANTIQUE_STORE', 'CONVENTION', 'PRIVATE_SALE', 'TRADE', 'GIFT', 'OTHER')`);
        await queryRunner.query(`CREATE TYPE "public"."masters_figures_line_enum" AS ENUM('ORIGINAL', 'POP', 'GOLDEN_BOOKS', 'MINI')`);
        await queryRunner.query(`CREATE TYPE "public"."masters_figures_charactertype_enum" AS ENUM('HEROIC', 'EVIL', 'HEROIC_ALLY', 'EVIL_ALLY', 'NEUTRAL')`);
        await queryRunner.query(`CREATE TABLE "masters_figures" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "collectionType" "public"."masters_figures_collectiontype_enum" NOT NULL, "condition" "public"."masters_figures_condition_enum" NOT NULL, "packagingCondition" "public"."masters_figures_packagingcondition_enum" NOT NULL, "isOwned" boolean NOT NULL DEFAULT true, "isComplete" boolean NOT NULL DEFAULT false, "acquisitionSource" "public"."masters_figures_acquisitionsource_enum", "acquisitionDate" date, "acquisitionPrice" numeric(10,2), "estimatedValue" numeric(10,2), "notes" text, "photoUrls" text array NOT NULL DEFAULT '{}', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "line" "public"."masters_figures_line_enum" NOT NULL, "characterType" "public"."masters_figures_charactertype_enum" NOT NULL, "releaseYear" integer, "isVariant" boolean NOT NULL DEFAULT false, "variantDescription" text, "accessories" text array NOT NULL DEFAULT '{}', "ownedAccessories" text array NOT NULL DEFAULT '{}', "isCarded" boolean NOT NULL DEFAULT false, "hasBackCard" boolean NOT NULL DEFAULT false, "miniComic" character varying, "hasArmorOrFeature" boolean NOT NULL DEFAULT false, "featureDescription" text, "userId" uuid NOT NULL, CONSTRAINT "PK_6fe7a29085d54dbac50cf97de9e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "star_wars_figures" ADD CONSTRAINT "FK_d8aa3e7c35cb0cb852a5df41265" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "g1_transformers" ADD CONSTRAINT "FK_d93826bb3491465a1c0bce7e2fb" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "masters_figures" ADD CONSTRAINT "FK_25f8aae6fd0545a6532f818c30a" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "masters_figures" DROP CONSTRAINT "FK_25f8aae6fd0545a6532f818c30a"`);
        await queryRunner.query(`ALTER TABLE "g1_transformers" DROP CONSTRAINT "FK_d93826bb3491465a1c0bce7e2fb"`);
        await queryRunner.query(`ALTER TABLE "star_wars_figures" DROP CONSTRAINT "FK_d8aa3e7c35cb0cb852a5df41265"`);
        await queryRunner.query(`DROP TABLE "masters_figures"`);
        await queryRunner.query(`DROP TYPE "public"."masters_figures_charactertype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."masters_figures_line_enum"`);
        await queryRunner.query(`DROP TYPE "public"."masters_figures_acquisitionsource_enum"`);
        await queryRunner.query(`DROP TYPE "public"."masters_figures_packagingcondition_enum"`);
        await queryRunner.query(`DROP TYPE "public"."masters_figures_condition_enum"`);
        await queryRunner.query(`DROP TYPE "public"."masters_figures_collectiontype_enum"`);
        await queryRunner.query(`DROP TABLE "g1_transformers"`);
        await queryRunner.query(`DROP TYPE "public"."g1_transformers_size_enum"`);
        await queryRunner.query(`DROP TYPE "public"."g1_transformers_line_enum"`);
        await queryRunner.query(`DROP TYPE "public"."g1_transformers_faction_enum"`);
        await queryRunner.query(`DROP TYPE "public"."g1_transformers_acquisitionsource_enum"`);
        await queryRunner.query(`DROP TYPE "public"."g1_transformers_packagingcondition_enum"`);
        await queryRunner.query(`DROP TYPE "public"."g1_transformers_condition_enum"`);
        await queryRunner.query(`DROP TYPE "public"."g1_transformers_collectiontype_enum"`);
        await queryRunner.query(`DROP TABLE "star_wars_figures"`);
        await queryRunner.query(`DROP TYPE "public"."star_wars_figures_cardbackstyle_enum"`);
        await queryRunner.query(`DROP TYPE "public"."star_wars_figures_figuresize_enum"`);
        await queryRunner.query(`DROP TYPE "public"."star_wars_figures_line_enum"`);
        await queryRunner.query(`DROP TYPE "public"."star_wars_figures_acquisitionsource_enum"`);
        await queryRunner.query(`DROP TYPE "public"."star_wars_figures_packagingcondition_enum"`);
        await queryRunner.query(`DROP TYPE "public"."star_wars_figures_condition_enum"`);
        await queryRunner.query(`DROP TYPE "public"."star_wars_figures_collectiontype_enum"`);
    }

}
