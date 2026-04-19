import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCascadeDeleteToOAuthFKs1776100000000 implements MigrationInterface {
    name = 'AddCascadeDeleteToOAuthFKs1776100000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop existing NO ACTION FKs from refresh_tokens → oauth_clients
        await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_be4035f8871b3caf83876976f49"`);
        // Drop existing NO ACTION FKs from authorization_codes → oauth_clients
        await queryRunner.query(`ALTER TABLE "authorization_codes" DROP CONSTRAINT "FK_1705bf5f03833d4ccbab19ef50d"`);

        // Recreate with ON DELETE CASCADE so deleting an oauth_client cleans up its tokens/codes
        await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_be4035f8871b3caf83876976f49" FOREIGN KEY ("clientId") REFERENCES "oauth_clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "authorization_codes" ADD CONSTRAINT "FK_1705bf5f03833d4ccbab19ef50d" FOREIGN KEY ("clientId") REFERENCES "oauth_clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "authorization_codes" DROP CONSTRAINT "FK_1705bf5f03833d4ccbab19ef50d"`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_be4035f8871b3caf83876976f49"`);

        await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_be4035f8871b3caf83876976f49" FOREIGN KEY ("clientId") REFERENCES "oauth_clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "authorization_codes" ADD CONSTRAINT "FK_1705bf5f03833d4ccbab19ef50d" FOREIGN KEY ("clientId") REFERENCES "oauth_clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
