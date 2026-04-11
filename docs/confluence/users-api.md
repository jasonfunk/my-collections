---
confluence_page_id: "3866625"
confluence_url: "https://houseoffunk-net.atlassian.net/wiki/spaces/SD/pages/3866625"
title: "My Collections — Users API"
last_updated: "2026-04-05"
---

## GET /users/me

```http
GET /users/me
```

Returns the profile of the currently authenticated user. Requires a valid Bearer token.

### Request Headers

| **Header** | **Required** | **Value** |
| --- | --- | --- |
| `Authorization` | **yes** | `Bearer <access_token>` |

### Response 200

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "collector@example.com",
  "isApproved": true,
  "createdAt": "2026-03-23T12:00:00.000Z"
}
```

### Response Fields

| **Field** | **Type** | **Description** |
| --- | --- | --- |
| `id` | string (UUID) | Unique user identifier |
| `email` | string | User's email address |
| `isApproved` | boolean | Whether the account is approved to log in |
| `createdAt` | string (ISO 8601) | Account creation timestamp |

### Error Responses

| **Status** | **Reason** |
| --- | --- |
| 401 Unauthorized | Missing, expired, or invalid Bearer token |
