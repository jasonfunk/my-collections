import { MigrationInterface, QueryRunner } from "typeorm";

export class AuthSchema1775177096491 implements MigrationInterface {
    name = 'AuthSchema1775177096491'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "passwordHash" character varying NOT NULL, "isApproved" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "oauth_clients" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "clientId" character varying NOT NULL, "clientSecretHash" character varying, "name" character varying NOT NULL, "redirectUris" text array NOT NULL, "allowedScopes" text array NOT NULL, CONSTRAINT "UQ_b0c094fe1ef0a6c4af8f2b10be7" UNIQUE ("clientId"), CONSTRAINT "PK_c4759172d3431bae6f04e678e0d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "refresh_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tokenHash" character varying NOT NULL, "scopes" text array NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "revokedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, "clientId" uuid, CONSTRAINT "UQ_c25bc63d248ca90e8dcc1d92d06" UNIQUE ("tokenHash"), CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "authorization_codes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "codeHash" character varying NOT NULL, "redirectUri" character varying NOT NULL, "scopes" text array NOT NULL, "codeChallenge" character varying NOT NULL, "codeChallengeMethod" character varying NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "usedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, "clientId" uuid, CONSTRAINT "UQ_91ee55e807be62ffece17663a98" UNIQUE ("codeHash"), CONSTRAINT "PK_f05b2eb99ad2db12d87544656c4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_610102b60fea1455310ccd299de" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_be4035f8871b3caf83876976f49" FOREIGN KEY ("clientId") REFERENCES "oauth_clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "authorization_codes" ADD CONSTRAINT "FK_29ae73055f8b65cb0ad7b7ea908" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "authorization_codes" ADD CONSTRAINT "FK_1705bf5f03833d4ccbab19ef50d" FOREIGN KEY ("clientId") REFERENCES "oauth_clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "authorization_codes" DROP CONSTRAINT "FK_1705bf5f03833d4ccbab19ef50d"`);
        await queryRunner.query(`ALTER TABLE "authorization_codes" DROP CONSTRAINT "FK_29ae73055f8b65cb0ad7b7ea908"`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_be4035f8871b3caf83876976f49"`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_610102b60fea1455310ccd299de"`);
        await queryRunner.query(`DROP TABLE "authorization_codes"`);
        await queryRunner.query(`DROP TABLE "refresh_tokens"`);
        await queryRunner.query(`DROP TABLE "oauth_clients"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }

}
