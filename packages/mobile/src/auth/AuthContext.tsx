import {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { UserProfile, TokenResponse } from '@my-collections/shared';
import * as ExpoCrypto from 'expo-crypto';
import { generateCodeVerifier, generateCodeChallenge } from './pkce';
import {
  getAccessToken,
  setAccessToken,
  clearAccessToken,
  getRefreshToken,
  setRefreshToken,
  clearAllTokens,
} from './tokenStorage';
import { registerAuthCallbacks } from '../api/client';

const CLIENT_ID = 'mobile-app';
const REDIRECT_URI = 'mycollections://auth/callback';
const SCOPES = ['collections:read', 'collections:write'];

export interface AuthContextValue {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshRef = useRef<() => Promise<void>>(null!);
  const logoutRef = useRef<() => Promise<void>>(null!);
  const isRestoringRef = useRef(false);

  const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

  const logout = useCallback(async () => {
    const refreshToken = await getRefreshToken();
    await clearAllTokens();
    setUser(null);
    if (refreshToken) {
      fetch(`${apiBase}/auth/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: refreshToken }),
      }).catch(() => undefined);
    }
  }, [apiBase]);

  const refreshTokens = useCallback(async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) throw new Error('No refresh token stored');

    const response = await fetch(`${apiBase}/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grantType: 'refresh_token',
        clientId: CLIENT_ID,
        refreshToken,
      }),
    });

    if (!response.ok) {
      await clearAllTokens();
      setUser(null);
      throw new Error('Token refresh failed');
    }

    const tokens: TokenResponse = await response.json();
    setAccessToken(tokens.accessToken);
    // Server rotates the refresh token on each refresh — store the new one
    if (tokens.refreshToken) {
      await setRefreshToken(tokens.refreshToken);
    }
  }, [apiBase]);

  const fetchUserProfile = useCallback(async (): Promise<UserProfile> => {
    const token = getAccessToken();
    const response = await fetch(`${apiBase}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch user profile');
    return response.json() as Promise<UserProfile>;
  }, [apiBase]);

  useEffect(() => {
    refreshRef.current = refreshTokens;
    logoutRef.current = logout;
    registerAuthCallbacks(
      () => refreshRef.current(),
      () => { void logoutRef.current(); },
    );
  }, [refreshTokens, logout]);

  // On mount: restore session from SecureStore
  useEffect(() => {
    async function restoreSession() {
      if (isRestoringRef.current) return;
      isRestoringRef.current = true;
      try {
        await refreshTokens();
        const profile = await fetchUserProfile();
        setUser(profile);
      } catch {
        await clearAllTokens();
      } finally {
        isRestoringRef.current = false;
        setIsLoading(false);
      }
    }
    void restoreSession();
  }, [refreshTokens, fetchUserProfile]);

  const login = useCallback(
    async (email: string, password: string) => {
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      const state = ExpoCrypto.randomUUID();

      // Step 1: Validate OAuth client + get session params
      const authorizeParams = new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        scope: SCOPES.join(' '),
        state,
      });
      const authorizeResponse = await fetch(`${apiBase}/auth/authorize?${authorizeParams}`);
      if (!authorizeResponse.ok) throw new Error('Authorization server error');
      const session = await authorizeResponse.json();

      // Step 2: Submit credentials → receive redirect URL with auth code
      const loginResponse = await fetch(`${apiBase}/auth/login`, {
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

      // Step 3: Extract auth code from redirect URL + verify state
      const url = new URL(redirectUrl);
      const code = url.searchParams.get('code');
      const returnedState = url.searchParams.get('state');

      if (!code) throw new Error('No authorization code in redirect URL');
      if (returnedState !== state) throw new Error('OAuth state mismatch — possible CSRF attack');

      // Step 4: Exchange code for tokens — refresh token returned in body (mobile-app client)
      const tokenResponse = await fetch(`${apiBase}/auth/token`, {
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

      if (!tokenResponse.ok) throw new Error('Token exchange failed');

      const tokens: TokenResponse = await tokenResponse.json();
      setAccessToken(tokens.accessToken);
      if (tokens.refreshToken) {
        await setRefreshToken(tokens.refreshToken);
      }

      // Step 5: Load user profile into context
      const profile = await fetchUserProfile();
      setUser(profile);
    },
    [apiBase, fetchUserProfile],
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
