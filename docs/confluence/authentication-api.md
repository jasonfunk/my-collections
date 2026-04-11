---
confluence_page_id: "3571714"
confluence_url: "https://houseoffunk-net.atlassian.net/wiki/spaces/SD/pages/3571714"
title: "My Collections — Authentication API"
last_updated: "2026-04-05"
---

## Overview

The authentication system implements OAuth2 Authorization Code Flow with PKCE (Proof Key for Code Exchange). It is designed for public clients — SPA and mobile apps — that cannot securely store a client secret. PKCE prevents authorization code interception attacks by binding the authorization request to the eventual token exchange.

## PKCE Mechanics

1. Client generates a random `code_verifier` (43–128 characters, URL-safe alphabet)
2. Client computes `code_challenge = BASE64URL(SHA256(code_verifier))`
3. `code_challenge_method` must be `S256`
4. On token exchange, the server verifies: `SHA256(submitted_code_verifier) === stored_code_challenge`

## Complete Flow

1. `GET /auth/authorize` — Validate client and return session data
2. `POST /auth/login` — Submit credentials; receive redirect URL containing `?code=`
3. `POST /auth/token` (authorization_code grant) — Exchange code + verifier for access and refresh tokens
4. Use `accessToken` in `Authorization: Bearer` header for all protected endpoints
5. `POST /auth/token` (refresh_token grant) — Rotate an expired access token
6. `POST /auth/revoke` — Logout / invalidate refresh token

## Registered OAuth Clients

| **Client ID** | **Type** | **Redirect URIs** |
| --- | --- | --- |
| `web-app` | Public SPA | `http://localhost:5173/auth/callback`, `https://mycollections.example.com/auth/callback` |
| `mobile-app` | Public mobile | `mycollections://auth/callback`, `exp://localhost:8081/` |

Allowed scopes for all clients: `collections:read`, `collections:write`, `profile`

## Endpoints

### GET /auth/authorize

```http
GET /auth/authorize
```

Query parameters:

| **Parameter** | **Type** | **Required** | **Description** |
| --- | --- | --- | --- |
| `client_id` | string | **yes** | OAuth2 client identifier |
| `redirect_uri` | string | **yes** | Must match a registered URI exactly |
| `code_challenge` | string | **yes** | BASE64URL(SHA256(code_verifier)) |
| `code_challenge_method` | string | **yes** | Must be `S256` |
| `state` | string | **yes** | Random value for CSRF protection |
| `scope` | string | _no_ | Space-separated: `collections:read collections:write profile` |

Response 200:

```json
{
  "clientId": "web-app",
  "redirectUri": "http://localhost:5173/auth/callback",
  "codeChallenge": "abc123...",
  "codeChallengeMethod": "S256",
  "scopes": ["collections:read", "collections:write"],
  "state": "randomstate123"
}
```

### POST /auth/login

```http
POST /auth/login
```

Request body:

```json
{
  "email": "collector@example.com",
  "password": "hunter2hunter2",
  "clientId": "web-app",
  "redirectUri": "http://localhost:5173/auth/callback",
  "codeChallenge": "abc123...",
  "codeChallengeMethod": "S256",
  "scopes": ["collections:read"],
  "state": "randomstate123"
}
```

Response 200:

```json
{ "redirectUrl": "http://localhost:5173/auth/callback?code=ABC123&state=randomstate123" }
```

Errors: 401 (invalid credentials), 403 (account pending approval), 400 (invalid client)

### POST /auth/register

```http
POST /auth/register
```

Request body:

```json
{ "email": "newuser@example.com", "password": "hunter2hunter2" }
```

Response 201:

```json
{ "id": "uuid", "email": "newuser@example.com", "isApproved": true }
```

Errors: 400 (email already taken), 403 (registration disabled via `REGISTRATION_ENABLED` env var)

### POST /auth/token — authorization_code grant

```http
POST /auth/token
```

Request body:

```json
{
  "grantType": "authorization_code",
  "clientId": "web-app",
  "code": "ABC123",
  "codeVerifier": "original_random_string",
  "redirectUri": "http://localhost:5173/auth/callback"
}
```

Response 200:

```json
{
  "accessToken": "eyJ...",
  "refreshToken": "opaque_token_string",
  "expiresIn": 900
}
```

Authorization codes are single-use and expire in 10 minutes. Reuse detection treats the original session as compromised and revokes all associated tokens.

### POST /auth/token — refresh_token grant

```http
POST /auth/token
```

Request body:

```json
{
  "grantType": "refresh_token",
  "clientId": "web-app",
  "refreshToken": "opaque_token_string"
}
```

Response 200: Same shape as above — returns a new access token + refresh token pair. The old refresh token is immediately invalidated.

### POST /auth/revoke

```http
POST /auth/revoke
```

Request body:

```json
{ "token": "opaque_token_string" }
```

Response: 204 No Content

## JWT Access Token

Decoded payload structure:

```json
{ "sub": "user-uuid", "email": "collector@example.com", "iat": 1234567890, "exp": 1234568790 }
```

- Default TTL: 15 minutes (override with `JWT_ACCESS_EXPIRES_IN` env var)
- Verified with `JWT_ACCESS_SECRET` env var

## Refresh Token

- Opaque string stored as SHA-256 hash in the database
- Default TTL: 30 days (override with `JWT_REFRESH_EXPIRES_IN` env var)
- Rotation on use: each successful refresh returns a new token pair
- Reuse detection: if a previously revoked token is submitted, all tokens for that session are immediately invalidated
