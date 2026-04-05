import {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { UserProfile, TokenResponse } from '@my-collections/shared';
import {
  generateCodeVerifier,
  generateCodeChallenge,
  clearCodeVerifier,
} from './pkce.js';
import {
  getRefreshToken,
  setTokens,
  clearTokens,
} from './tokenStorage.js';
import { registerAuthCallbacks } from '../api/client.js';

const CLIENT_ID = 'web-app';
const REDIRECT_URI = `${window.location.origin}/auth/callback`;
const SCOPES = ['collections:read', 'collections:write'];

export interface AuthContextValue {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshTokens: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Stable reference so registerAuthCallbacks never stales
  const refreshRef = useRef<() => Promise<void>>(null!);
  const logoutRef = useRef<() => void>(null!);

  const logout = useCallback(() => {
    const rt = getRefreshToken();
    clearTokens();
    setUser(null);
    if (rt) {
      // Fire-and-forget: revoke on server, ignore errors
      fetch('/api/auth/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: rt }),
      }).catch(() => undefined);
    }
  }, []);

  const refreshTokens = useCallback(async () => {
    const rt = getRefreshToken();
    if (!rt) throw new Error('No refresh token');

    const response = await fetch('/api/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grantType: 'refresh_token',
        clientId: CLIENT_ID,
        refreshToken: rt,
      }),
    });

    if (!response.ok) {
      clearTokens();
      setUser(null);
      throw new Error('Token refresh failed');
    }

    const tokens: TokenResponse = await response.json();
    setTokens(tokens.accessToken, tokens.refreshToken);
  }, []);

  const fetchUserProfile = useCallback(async (): Promise<UserProfile> => {
    const { getAccessToken } = await import('./tokenStorage.js');
    const token = getAccessToken();
    const response = await fetch('/api/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch user profile');
    return response.json();
  }, []);

  // Register stable callbacks on the API client to break circular dependency
  useEffect(() => {
    refreshRef.current = refreshTokens;
    logoutRef.current = logout;
    registerAuthCallbacks(
      () => refreshRef.current(),
      () => logoutRef.current(),
    );
  }, [refreshTokens, logout]);

  // On mount: silently restore session from stored refresh token
  useEffect(() => {
    async function restoreSession() {
      const rt = getRefreshToken();
      if (!rt) {
        setIsLoading(false);
        return;
      }
      try {
        await refreshTokens();
        const profile = await fetchUserProfile();
        setUser(profile);
      } catch {
        clearTokens();
      } finally {
        setIsLoading(false);
      }
    }
    restoreSession();
  }, [refreshTokens, fetchUserProfile]);

  const login = useCallback(
    async (email: string, password: string) => {
      // Step 1: Generate PKCE pair
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      const state = crypto.randomUUID();

      // Step 2: Validate OAuth client + get session params
      const authorizeParams = new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        scope: SCOPES.join(' '),
        state,
      });
      const authorizeResponse = await fetch(`/api/auth/authorize?${authorizeParams}`);
      if (!authorizeResponse.ok) {
        throw new Error('Authorization server error');
      }
      const session = await authorizeResponse.json();

      // Step 3: Submit credentials → receive redirect URL containing auth code
      const loginResponse = await fetch('/api/auth/login', {
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

      if (!loginResponse.ok) {
        const err = await loginResponse.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message ?? 'Invalid credentials');
      }

      const { redirectUrl }: { redirectUrl: string } = await loginResponse.json();

      // Step 4: Extract auth code from the redirect URL (in-memory, no real navigation)
      const url = new URL(redirectUrl);
      const code = url.searchParams.get('code');
      if (!code) throw new Error('No authorization code in redirect URL');

      // Step 5: Exchange code + verifier for token pair
      const tokenResponse = await fetch('/api/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grantType: 'authorization_code',
          clientId: CLIENT_ID,
          code,
          codeVerifier,
          redirectUri: REDIRECT_URI,
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Token exchange failed');
      }

      const tokens: TokenResponse = await tokenResponse.json();
      setTokens(tokens.accessToken, tokens.refreshToken);
      clearCodeVerifier();

      // Step 6: Load user profile into context
      const profile = await fetchUserProfile();
      setUser(profile);
    },
    [fetchUserProfile],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
        login,
        logout,
        refreshTokens,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
