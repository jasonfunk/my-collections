import * as fs from 'fs';
import * as path from 'path';

const ENV_PATH = path.resolve(__dirname, '../.env');

interface TokenState {
  accessToken: string;
  expiresAt: number; // ms since epoch
  refreshToken: string;
}

let state: TokenState | null = null;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;

const API_BASE_URL = () => process.env.API_BASE_URL ?? 'http://localhost:3000';
const CLIENT_ID = () => process.env.MCP_OAUTH_CLIENT_ID ?? 'mcp-server';

async function fetchNewTokens(refreshToken: string): Promise<TokenState> {
  const res = await fetch(`${API_BASE_URL()}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grantType: 'refresh_token',
      clientId: CLIENT_ID(),
      refreshToken,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Token refresh failed (${res.status}): ${body}`);
  }

  const data = await res.json() as { accessToken: string; expiresIn: number; refreshToken?: string };

  // Persist the rotated refresh token back to .env so restarts use the latest token
  const nextRefreshToken = data.refreshToken ?? refreshToken;
  if (data.refreshToken) {
    persistRefreshToken(data.refreshToken);
  }

  return {
    accessToken: data.accessToken,
    expiresAt: Date.now() + data.expiresIn * 1000,
    refreshToken: nextRefreshToken,
  };
}

function persistRefreshToken(token: string): void {
  try {
    let contents = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf8') : '';
    const regex = /^MCP_REFRESH_TOKEN=.*$/m;
    const line = `MCP_REFRESH_TOKEN=${token}`;
    contents = regex.test(contents) ? contents.replace(regex, line) : contents + (contents.endsWith('\n') ? '' : '\n') + line + '\n';
    fs.writeFileSync(ENV_PATH, contents);
  } catch {
    console.warn('[token-manager] Failed to persist rotated refresh token to .env');
  }
}

function scheduleRefresh(msUntilExpiry: number): void {
  if (refreshTimer) clearTimeout(refreshTimer);
  // Refresh 2 minutes before expiry (or immediately if already close)
  const delay = Math.max(0, msUntilExpiry - 2 * 60 * 1000);
  refreshTimer = setTimeout(() => {
    if (state) {
      fetchNewTokens(state.refreshToken)
        .then((next) => {
          state = next;
          scheduleRefresh(next.expiresAt - Date.now());
        })
        .catch((err) => console.error('[token-manager] Background refresh failed:', err));
    }
  }, delay);
}

export async function initTokenManager(): Promise<void> {
  const refreshToken = process.env.MCP_REFRESH_TOKEN;
  if (!refreshToken) {
    throw new Error('MCP_REFRESH_TOKEN is not set — run "npm run bootstrap" first');
  }
  state = await fetchNewTokens(refreshToken);
  scheduleRefresh(state.expiresAt - Date.now());
  console.log('[token-manager] Access token acquired, expires in', Math.round((state.expiresAt - Date.now()) / 1000), 's');
}

export async function getAccessToken(): Promise<string> {
  if (!state) throw new Error('Token manager not initialised');

  // If within 30 seconds of expiry, refresh immediately
  if (Date.now() >= state.expiresAt - 30_000) {
    state = await fetchNewTokens(state.refreshToken);
    scheduleRefresh(state.expiresAt - Date.now());
  }

  return state.accessToken;
}
