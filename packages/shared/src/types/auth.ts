/**
 * Auth-related types shared across the API, web, and mobile packages.
 * The API produces these shapes; the web and mobile apps consume them.
 */

/** The payload encoded inside a JWT access token. */
export interface AccessTokenPayload {
  sub: string;   // user UUID
  email: string;
  iat?: number;  // issued at (Unix timestamp)
  exp?: number;  // expires at (Unix timestamp)
}

/** Response shape from POST /auth/token.
 * Web: refresh token is set as an httpOnly cookie; refreshToken is absent from the body.
 * Mobile: refresh token is included in the body (no cookie support); store in SecureStore. */
export interface TokenResponse {
  accessToken: string;
  expiresIn: number; // seconds until access token expires
  refreshToken?: string; // only present for mobile-app client (no cookie)
}

/** Response shape from GET /users/me */
export interface UserProfile {
  id: string;
  email: string;
  isApproved: boolean;
  createdAt: string; // ISO 8601
}
