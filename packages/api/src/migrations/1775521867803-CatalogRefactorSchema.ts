import { MigrationInterface, QueryRunner } from "typeorm";

export class CatalogRefactorSchema1775521867803 implements MigrationInterface {
    name = 'CatalogRefactorSchema1775521867803'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        // Drop old FK constraints
        await queryRunner.query(`ALTER TABLE "star_wars_figures" DROP CONSTRAINT "FK_d8aa3e7c35cb0cb852a5df41265"`);
        await queryRunner.query(`ALTER TABLE "g1_transformers" DROP CONSTRAINT "FK_d93826bb3491465a1c0bce7e2fb"`);
        await queryRunner.query(`ALTER TABLE "masters_figures" DROP CONSTRAINT "FK_25f8aae6fd0545a6532f818c30a"`);

        // Drop old tables
        await queryRunner.query(`DROP TABLE "star_wars_figures"`);
        await queryRunner.query(`DROP TABLE "g1_transformers"`);
        await queryRunner.query(`DROP TABLE "masters_figures"`);

        // Drop old enums — star_wars_figures
        await queryRunner.query(`DROP TYPE "public"."star_wars_figures_cardbackstyle_enum"`);
        await queryRunner.query(`DROP TYPE "public"."star_wars_figures_figuresize_enum"`);
        await queryRunner.query(`DROP TYPE "public"."star_wars_figures_line_enum"`);
        await queryRunner.query(`DROP TYPE "public"."star_wars_figures_acquisitionsource_enum"`);
        await queryRunner.query(`DROP TYPE "public"."star_wars_figures_packagingcondition_enum"`);
        await queryRunner.query(`DROP TYPE "public"."star_wars_figures_condition_enum"`);
        await queryRunner.query(`DROP TYPE "public"."star_wars_figures_collectiontype_enum"`);

        // Drop old enums — g1_transformers
        await queryRunner.query(`DROP TYPE "public"."g1_transformers_size_enum"`);
        await queryRunner.query(`DROP TYPE "public"."g1_transformers_line_enum"`);
        await queryRunner.query(`DROP TYPE "public"."g1_transformers_faction_enum"`);
        await queryRunner.query(`DROP TYPE "public"."g1_transformers_acquisitionsource_enum"`);
        await queryRunner.query(`DROP TYPE "public"."g1_transformers_packagingcondition_enum"`);
        await queryRunner.query(`DROP TYPE "public"."g1_transformers_condition_enum"`);
        await queryRunner.query(`DROP TYPE "public"."g1_transformers_collectiontype_enum"`);

        // Drop old enums — masters_figures
        await queryRunner.query(`DROP TYPE "public"."masters_figures_charactertype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."masters_figures_line_enum"`);
        await queryRunner.query(`DROP TYPE "public"."masters_figures_acquisitionsource_enum"`);
        await queryRunner.query(`DROP TYPE "public"."masters_figures_packagingcondition_enum"`);
        await queryRunner.query(`DROP TYPE "public"."masters_figures_condition_enum"`);
        await queryRunner.query(`DROP TYPE "public"."masters_figures_collectiontype_enum"`);

        // ----------------------------------------------------------------
        // Catalog enums — star_wars_catalog
        // ----------------------------------------------------------------
        await queryRunner.query(`CREATE TYPE "public"."star_wars_catalog_category_enum" AS ENUM('BASIC_FIGURE', 'VEHICLE', 'PLAYSET', 'CREATURE', 'MINI_RIG', 'ACCESSORY', 'TWELVE_INCH', 'COLLECTOR_CASE', 'ROLEPLAY', 'DIE_CAST')`);
        await queryRunner.query(`CREATE TYPE "public"."star_wars_catalog_line_enum" AS ENUM('STAR_WARS', 'EMPIRE_STRIKES_BACK', 'RETURN_OF_THE_JEDI', 'POWER_OF_THE_FORCE')`);
        await queryRunner.query(`CREATE TYPE "public"."star_wars_catalog_figuresize_enum" AS ENUM('3.75', '12', 'MINI')`);
        await queryRunner.query(`CREATE TYPE "public"."star_wars_catalog_cardbackstyle_enum" AS ENUM('12_BACK', '20_BACK', '31_BACK', '45_BACK', '48_BACK', '65_BACK', '77_BACK', 'ESB', 'ROTJ', 'POTF')`);

        // Catalog enums — g1_transformers_catalog
        await queryRunner.query(`CREATE TYPE "public"."g1_transformers_catalog_faction_enum" AS ENUM('AUTOBOT', 'DECEPTICON')`);
        await queryRunner.query(`CREATE TYPE "public"."g1_transformers_catalog_line_enum" AS ENUM('G1_S1', 'G1_S2', 'G1_S3', 'G1_S4', 'G1_S5', 'G1_S6')`);
        await queryRunner.query(`CREATE TYPE "public"."g1_transformers_catalog_size_enum" AS ENUM('MINI', 'SMALL', 'MEDIUM', 'LARGE', 'JUMBO')`);

        // Catalog enums — masters_catalog
        await queryRunner.query(`CREATE TYPE "public"."masters_catalog_line_enum" AS ENUM('ORIGINAL', 'POP', 'GOLDEN_BOOKS', 'MINI')`);
        await queryRunner.query(`CREATE TYPE "public"."masters_catalog_charactertype_enum" AS ENUM('HEROIC', 'EVIL', 'HEROIC_ALLY', 'EVIL_ALLY', 'NEUTRAL')`);

        // ----------------------------------------------------------------
        // User items enums — user_star_wars_items
        // ----------------------------------------------------------------
        await queryRunner.query(`CREATE TYPE "public"."user_star_wars_items_wishlistpriority_enum" AS ENUM('HIGH', 'MEDIUM', 'LOW')`);
        await queryRunner.query(`CREATE TYPE "public"."user_star_wars_items_condition_enum" AS ENUM('C10', 'C9', 'C8', 'C7', 'C6', 'C5', 'C4', 'INC')`);
        await queryRunner.query(`CREATE TYPE "public"."user_star_wars_items_packagingcondition_enum" AS ENUM('SEALED', 'C9', 'GOOD', 'FAIR', 'POOR', 'NONE')`);
        await queryRunner.query(`CREATE TYPE "public"."user_star_wars_items_acquisitionsource_enum" AS ENUM('ORIGINAL', 'EBAY', 'ETSY', 'FLEA_MARKET', 'ANTIQUE_STORE', 'CONVENTION', 'PRIVATE_SALE', 'TRADE', 'GIFT', 'OTHER')`);

        // User items enums — user_g1_transformers_items
        await queryRunner.query(`CREATE TYPE "public"."user_g1_transformers_items_wishlistpriority_enum" AS ENUM('HIGH', 'MEDIUM', 'LOW')`);
        await queryRunner.query(`CREATE TYPE "public"."user_g1_transformers_items_condition_enum" AS ENUM('C10', 'C9', 'C8', 'C7', 'C6', 'C5', 'C4', 'INC')`);
        await queryRunner.query(`CREATE TYPE "public"."user_g1_transformers_items_packagingcondition_enum" AS ENUM('SEALED', 'C9', 'GOOD', 'FAIR', 'POOR', 'NONE')`);
        await queryRunner.query(`CREATE TYPE "public"."user_g1_transformers_items_acquisitionsource_enum" AS ENUM('ORIGINAL', 'EBAY', 'ETSY', 'FLEA_MARKET', 'ANTIQUE_STORE', 'CONVENTION', 'PRIVATE_SALE', 'TRADE', 'GIFT', 'OTHER')`);

        // User items enums — user_masters_items
        await queryRunner.query(`CREATE TYPE "public"."user_masters_items_wishlistpriority_enum" AS ENUM('HIGH', 'MEDIUM', 'LOW')`);
        await queryRunner.query(`CREATE TYPE "public"."user_masters_items_condition_enum" AS ENUM('C10', 'C9', 'C8', 'C7', 'C6', 'C5', 'C4', 'INC')`);
        await queryRunner.query(`CREATE TYPE "public"."user_masters_items_packagingcondition_enum" AS ENUM('SEALED', 'C9', 'GOOD', 'FAIR', 'POOR', 'NONE')`);
        await queryRunner.query(`CREATE TYPE "public"."user_masters_items_acquisitionsource_enum" AS ENUM('ORIGINAL', 'EBAY', 'ETSY', 'FLEA_MARKET', 'ANTIQUE_STORE', 'CONVENTION', 'PRIVATE_SALE', 'TRADE', 'GIFT', 'OTHER')`);

        // ----------------------------------------------------------------
        // Catalog tables
        // ----------------------------------------------------------------
        await queryRunner.query(`CREATE TABLE "star_wars_catalog" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "name" character varying NOT NULL,
            "category" "public"."star_wars_catalog_category_enum" NOT NULL,
            "line" "public"."star_wars_catalog_line_enum",
            "accessories" text array NOT NULL DEFAULT '{}',
            "catalogImageUrl" character varying,
            "sourceUrl" character varying,
            "externalId" character varying,
            "isVariant" boolean NOT NULL DEFAULT false,
            "variantDescription" text,
            "figureSize" "public"."star_wars_catalog_figuresize_enum",
            "cardbackStyle" "public"."star_wars_catalog_cardbackstyle_enum",
            "kennerItemNumber" character varying,
            "coinIncluded" boolean,
            "features" text array NOT NULL DEFAULT '{}',
            "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
            "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_star_wars_catalog" PRIMARY KEY ("id")
        )`);

        await queryRunner.query(`CREATE TABLE "g1_transformers_catalog" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "name" character varying NOT NULL,
            "faction" "public"."g1_transformers_catalog_faction_enum",
            "line" "public"."g1_transformers_catalog_line_enum",
            "size" "public"."g1_transformers_catalog_size_enum",
            "altMode" character varying,
            "accessories" text array NOT NULL DEFAULT '{}',
            "catalogImageUrl" character varying,
            "sourceUrl" character varying,
            "externalId" character varying,
            "isVariant" boolean NOT NULL DEFAULT false,
            "variantDescription" text,
            "isCombiner" boolean NOT NULL DEFAULT false,
            "combinerTeam" character varying,
            "isGiftSet" boolean NOT NULL DEFAULT false,
            "isMailaway" boolean NOT NULL DEFAULT false,
            "japaneseRelease" boolean NOT NULL DEFAULT false,
            "features" text array NOT NULL DEFAULT '{}',
            "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
            "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_g1_transformers_catalog" PRIMARY KEY ("id")
        )`);

        await queryRunner.query(`CREATE TABLE "masters_catalog" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "name" character varying NOT NULL,
            "line" "public"."masters_catalog_line_enum",
            "characterType" "public"."masters_catalog_charactertype_enum",
            "releaseYear" integer,
            "accessories" text array NOT NULL DEFAULT '{}',
            "catalogImageUrl" character varying,
            "sourceUrl" character varying,
            "externalId" character varying,
            "isVariant" boolean NOT NULL DEFAULT false,
            "variantDescription" text,
            "miniComic" character varying,
            "hasArmorOrFeature" boolean NOT NULL DEFAULT false,
            "featureDescription" text,
            "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
            "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_masters_catalog" PRIMARY KEY ("id")
        )`);

        // ----------------------------------------------------------------
        // User items tables
        // ----------------------------------------------------------------
        await queryRunner.query(`CREATE TABLE "user_star_wars_items" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "catalogId" uuid NOT NULL,
            "userId" uuid NOT NULL,
            "isOwned" boolean NOT NULL DEFAULT false,
            "wishlistPriority" "public"."user_star_wars_items_wishlistpriority_enum",
            "condition" "public"."user_star_wars_items_condition_enum",
            "packagingCondition" "public"."user_star_wars_items_packagingcondition_enum",
            "isComplete" boolean NOT NULL DEFAULT false,
            "ownedAccessories" text array NOT NULL DEFAULT '{}',
            "isCarded" boolean NOT NULL DEFAULT false,
            "isBoxed" boolean NOT NULL DEFAULT false,
            "acquisitionSource" "public"."user_star_wars_items_acquisitionsource_enum",
            "acquisitionDate" date,
            "acquisitionPrice" numeric(10,2),
            "estimatedValue" numeric(10,2),
            "notes" text,
            "photoUrls" text array NOT NULL DEFAULT '{}',
            "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
            "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_user_star_wars_items" PRIMARY KEY ("id"),
            CONSTRAINT "UQ_user_star_wars_items_catalog_user" UNIQUE ("catalogId", "userId")
        )`);

        await queryRunner.query(`CREATE TABLE "user_g1_transformers_items" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "catalogId" uuid NOT NULL,
            "userId" uuid NOT NULL,
            "isOwned" boolean NOT NULL DEFAULT false,
            "wishlistPriority" "public"."user_g1_transformers_items_wishlistpriority_enum",
            "condition" "public"."user_g1_transformers_items_condition_enum",
            "packagingCondition" "public"."user_g1_transformers_items_packagingcondition_enum",
            "isComplete" boolean NOT NULL DEFAULT false,
            "ownedAccessories" text array NOT NULL DEFAULT '{}',
            "isBoxed" boolean NOT NULL DEFAULT false,
            "hasInstructions" boolean NOT NULL DEFAULT false,
            "hasTechSpec" boolean NOT NULL DEFAULT false,
            "rubSign" boolean,
            "acquisitionSource" "public"."user_g1_transformers_items_acquisitionsource_enum",
            "acquisitionDate" date,
            "acquisitionPrice" numeric(10,2),
            "estimatedValue" numeric(10,2),
            "notes" text,
            "photoUrls" text array NOT NULL DEFAULT '{}',
            "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
            "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_user_g1_transformers_items" PRIMARY KEY ("id"),
            CONSTRAINT "UQ_user_g1_transformers_items_catalog_user" UNIQUE ("catalogId", "userId")
        )`);

        await queryRunner.query(`CREATE TABLE "user_masters_items" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "catalogId" uuid NOT NULL,
            "userId" uuid NOT NULL,
            "isOwned" boolean NOT NULL DEFAULT false,
            "wishlistPriority" "public"."user_masters_items_wishlistpriority_enum",
            "condition" "public"."user_masters_items_condition_enum",
            "packagingCondition" "public"."user_masters_items_packagingcondition_enum",
            "isComplete" boolean NOT NULL DEFAULT false,
            "ownedAccessories" text array NOT NULL DEFAULT '{}',
            "isCarded" boolean NOT NULL DEFAULT false,
            "hasBackCard" boolean NOT NULL DEFAULT false,
            "acquisitionSource" "public"."user_masters_items_acquisitionsource_enum",
            "acquisitionDate" date,
            "acquisitionPrice" numeric(10,2),
            "estimatedValue" numeric(10,2),
            "notes" text,
            "photoUrls" text array NOT NULL DEFAULT '{}',
            "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
            "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_user_masters_items" PRIMARY KEY ("id"),
            CONSTRAINT "UQ_user_masters_items_catalog_user" UNIQUE ("catalogId", "userId")
        )`);

        // ----------------------------------------------------------------
        // Foreign keys
        // ----------------------------------------------------------------
        await queryRunner.query(`ALTER TABLE "user_star_wars_items" ADD CONSTRAINT "FK_user_star_wars_items_catalog" FOREIGN KEY ("catalogId") REFERENCES "star_wars_catalog"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_star_wars_items" ADD CONSTRAINT "FK_user_star_wars_items_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_g1_transformers_items" ADD CONSTRAINT "FK_user_g1_transformers_items_catalog" FOREIGN KEY ("catalogId") REFERENCES "g1_transformers_catalog"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_g1_transformers_items" ADD CONSTRAINT "FK_user_g1_transformers_items_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_masters_items" ADD CONSTRAINT "FK_user_masters_items_catalog" FOREIGN KEY ("catalogId") REFERENCES "masters_catalog"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_masters_items" ADD CONSTRAINT "FK_user_masters_items_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign keys
        await queryRunner.query(`ALTER TABLE "user_masters_items" DROP CONSTRAINT "FK_user_masters_items_user"`);
        await queryRunner.query(`ALTER TABLE "user_masters_items" DROP CONSTRAINT "FK_user_masters_items_catalog"`);
        await queryRunner.query(`ALTER TABLE "user_g1_transformers_items" DROP CONSTRAINT "FK_user_g1_transformers_items_user"`);
        await queryRunner.query(`ALTER TABLE "user_g1_transformers_items" DROP CONSTRAINT "FK_user_g1_transformers_items_catalog"`);
        await queryRunner.query(`ALTER TABLE "user_star_wars_items" DROP CONSTRAINT "FK_user_star_wars_items_user"`);
        await queryRunner.query(`ALTER TABLE "user_star_wars_items" DROP CONSTRAINT "FK_user_star_wars_items_catalog"`);

        // Drop user items tables
        await queryRunner.query(`DROP TABLE "user_masters_items"`);
        await queryRunner.query(`DROP TABLE "user_g1_transformers_items"`);
        await queryRunner.query(`DROP TABLE "user_star_wars_items"`);

        // Drop user items enums
        await queryRunner.query(`DROP TYPE "public"."user_masters_items_acquisitionsource_enum"`);
        await queryRunner.query(`DROP TYPE "public"."user_masters_items_packagingcondition_enum"`);
        await queryRunner.query(`DROP TYPE "public"."user_masters_items_condition_enum"`);
        await queryRunner.query(`DROP TYPE "public"."user_masters_items_wishlistpriority_enum"`);
        await queryRunner.query(`DROP TYPE "public"."user_g1_transformers_items_acquisitionsource_enum"`);
        await queryRunner.query(`DROP TYPE "public"."user_g1_transformers_items_packagingcondition_enum"`);
        await queryRunner.query(`DROP TYPE "public"."user_g1_transformers_items_condition_enum"`);
        await queryRunner.query(`DROP TYPE "public"."user_g1_transformers_items_wishlistpriority_enum"`);
        await queryRunner.query(`DROP TYPE "public"."user_star_wars_items_acquisitionsource_enum"`);
        await queryRunner.query(`DROP TYPE "public"."user_star_wars_items_packagingcondition_enum"`);
        await queryRunner.query(`DROP TYPE "public"."user_star_wars_items_condition_enum"`);
        await queryRunner.query(`DROP TYPE "public"."user_star_wars_items_wishlistpriority_enum"`);

        // Drop catalog tables
        await queryRunner.query(`DROP TABLE "masters_catalog"`);
        await queryRunner.query(`DROP TABLE "g1_transformers_catalog"`);
        await queryRunner.query(`DROP TABLE "star_wars_catalog"`);

        // Drop catalog enums
        await queryRunner.query(`DROP TYPE "public"."masters_catalog_charactertype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."masters_catalog_line_enum"`);
        await queryRunner.query(`DROP TYPE "public"."g1_transformers_catalog_size_enum"`);
        await queryRunner.query(`DROP TYPE "public"."g1_transformers_catalog_line_enum"`);
        await queryRunner.query(`DROP TYPE "public"."g1_transformers_catalog_faction_enum"`);
        await queryRunner.query(`DROP TYPE "public"."star_wars_catalog_cardbackstyle_enum"`);
        await queryRunner.query(`DROP TYPE "public"."star_wars_catalog_figuresize_enum"`);
        await queryRunner.query(`DROP TYPE "public"."star_wars_catalog_line_enum"`);
        await queryRunner.query(`DROP TYPE "public"."star_wars_catalog_category_enum"`);
    }

}
