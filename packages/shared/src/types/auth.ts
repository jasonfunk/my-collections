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

/** Response shape from POST /auth/token */
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds until access token expires
}

/** Response shape from GET /users/me */
export interface UserProfile {
  id: string;
  email: string;
  isApproved: boolean;
  createdAt: string; // ISO 8601
}
