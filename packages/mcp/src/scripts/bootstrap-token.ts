/**
 * One-time bootstrap script to obtain a refresh token for the MCP server.
 *
 * Uses PKCE authorization code flow against the Collections API, prompting
 * for credentials via stdin. Writes MCP_REFRESH_TOKEN to packages/mcp/.env.
 *
 * Run from the packages/mcp directory:
 *   npm run bootstrap
 */
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import * as dotenv from 'dotenv';

const ENV_PATH = path.resolve(__dirname, '../../.env');

dotenv.config({ path: ENV_PATH });

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3000';
const CLIENT_ID = process.env.MCP_OAUTH_CLIENT_ID ?? 'mcp-server';
const REDIRECT_URI = 'http://localhost:9999/callback';

function base64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function generatePkce(): { verifier: string; challenge: string } {
  const verifier = base64url(crypto.randomBytes(48));
  const challenge = base64url(crypto.createHash('sha256').update(verifier).digest());
  return { verifier, challenge };
}

function prompt(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

function upsertEnvVar(filePath: string, key: string, value: string): void {
  let contents = '';
  if (fs.existsSync(filePath)) {
    contents = fs.readFileSync(filePath, 'utf8');
  }
  const regex = new RegExp(`^${key}=.*$`, 'm');
  const line = `${key}=${value}`;
  if (regex.test(contents)) {
    contents = contents.replace(regex, line);
  } else {
    contents = contents.endsWith('\n') ? contents + line + '\n' : contents + '\n' + line + '\n';
  }
  fs.writeFileSync(filePath, contents);
}

async function main() {
  console.log('My Collections MCP Server — Bootstrap\n');
  console.log(`API: ${API_BASE_URL}`);
  console.log(`Client: ${CLIENT_ID}\n`);

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const email = await prompt(rl, 'Email: ');
  const password = await prompt(rl, 'Password: ');
  rl.close();

  const { verifier, challenge } = generatePkce();
  const state = base64url(crypto.randomBytes(16));

  // Step 1 — validate client and get session parameters
  const authorizeUrl = new URL(`${API_BASE_URL}/auth/authorize`);
  authorizeUrl.searchParams.set('client_id', CLIENT_ID);
  authorizeUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authorizeUrl.searchParams.set('code_challenge', challenge);
  authorizeUrl.searchParams.set('code_challenge_method', 'S256');
  authorizeUrl.searchParams.set('scope', 'collections:read collections:write profile');
  authorizeUrl.searchParams.set('state', state);

  const authorizeRes = await fetch(authorizeUrl.toString());
  if (!authorizeRes.ok) {
    const body = await authorizeRes.text();
    throw new Error(`GET /auth/authorize failed (${authorizeRes.status}): ${body}`);
  }
  const session = await authorizeRes.json() as {
    clientId: string;
    redirectUri: string;
    codeChallenge: string;
    codeChallengeMethod: string;
    scopes: string[];
    state: string;
  };

  // Step 2 — submit credentials and receive redirect URL containing the code
  const loginRes = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      clientId: session.clientId,
      redirectUri: session.redirectUri,
      codeChallenge: session.codeChallenge,
      codeChallengeMethod: session.codeChallengeMethod,
      scopes: session.scopes,
      state: session.state,
    }),
  });
  if (!loginRes.ok) {
    const body = await loginRes.text();
    throw new Error(`POST /auth/login failed (${loginRes.status}): ${body}`);
  }
  const { redirectUrl } = await loginRes.json() as { redirectUrl: string };

  // Extract authorization code from the redirect URL query string
  const redirectParsed = new URL(redirectUrl);
  const returnedState = redirectParsed.searchParams.get('state');
  if (returnedState !== state) {
    throw new Error(`State mismatch — expected ${state}, got ${returnedState}`);
  }
  const code = redirectParsed.searchParams.get('code');
  if (!code) {
    throw new Error('No authorization code in redirect URL');
  }

  // Step 3 — exchange code for tokens
  const tokenRes = await fetch(`${API_BASE_URL}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grantType: 'authorization_code',
      clientId: CLIENT_ID,
      code,
      codeVerifier: verifier,
      redirectUri: REDIRECT_URI,
    }),
  });
  if (!tokenRes.ok) {
    const body = await tokenRes.text();
    throw new Error(`POST /auth/token failed (${tokenRes.status}): ${body}`);
  }
  const tokens = await tokenRes.json() as { accessToken: string; expiresIn: number; refreshToken: string };

  if (!tokens.refreshToken) {
    throw new Error('No refresh token in response — ensure mcp-server client is seeded');
  }

  upsertEnvVar(ENV_PATH, 'MCP_REFRESH_TOKEN', tokens.refreshToken);
  console.log(`\nSuccess! MCP_REFRESH_TOKEN written to ${ENV_PATH}`);
  console.log('Run "npm run dev" to start the MCP server.');
}

main().catch((err) => {
  console.error('\nBootstrap failed:', err.message);
  process.exit(1);
});
