/**
 * Seeds the oauth_clients table with the web and mobile app clients.
 *
 * Both are public clients (clientSecretHash = null) — web SPAs and mobile
 * apps run on the user's device and can't safely store a client secret.
 * PKCE replaces the client secret for these client types.
 *
 * Run once after migration:
 *   npx ts-node src/database/seeds/oauth-clients.seed.ts
 */
import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { OAuthClient } from '../../modules/auth/entities/oauth-client.entity';

dotenv.config();

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [OAuthClient],
  synchronize: false,
});

const clients = [
  {
    clientId: 'web-app',
    clientSecretHash: null,
    name: 'My Collections Web App',
    redirectUris: [
      'http://localhost:5173/auth/callback',
      'https://mycollections.example.com/auth/callback',
    ],
    allowedScopes: ['collections:read', 'collections:write', 'profile'],
  },
  {
    clientId: 'mobile-app',
    clientSecretHash: null,
    name: 'My Collections Mobile App',
    redirectUris: [
      'mycollections://auth/callback',
      'exp://localhost:8081/--/auth/callback',
    ],
    allowedScopes: ['collections:read', 'collections:write', 'profile'],
  },
];

async function seed() {
  await dataSource.initialize();
  const repo = dataSource.getRepository(OAuthClient);

  for (const data of clients) {
    const existing = await repo.findOne({ where: { clientId: data.clientId } });
    if (existing) {
      console.log(`Client '${data.clientId}' already exists — skipping`);
      continue;
    }
    const client = repo.create(data);
    await repo.save(client);
    console.log(`Created client: ${data.clientId}`);
  }

  await dataSource.destroy();
  console.log('Seed complete.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
