---
confluence_page_id: "3702785"
confluence_url: "https://houseoffunk-net.atlassian.net/wiki/spaces/SD/pages/3702785"
title: "My Collections — API Reference"
last_updated: "2026-04-18"
---

Child pages document each API module. Use the page tree to navigate to a specific module.

- Base URL: `http://localhost:3000`
- Swagger UI: `http://localhost:3000/api/docs`
- All protected endpoints require `Authorization: Bearer <access_token>` in the request header.

## Health Endpoints

Health check endpoints require **no authentication**. They are exempt from rate limiting so load balancer probes do not consume the per-IP quota.

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Liveness check — returns 200 if the API process is running |
| GET | `/health/ready` | Readiness check — returns 200 if the API is running **and** the database connection is initialised; returns 503 otherwise |

**Use `GET /health/ready` as the readiness probe** for load balancers, reverse proxies, and deployment scripts. Use `GET /health` as the liveness probe (process alive, no DB check).

### Response examples

**GET /health — 200 OK**
```json
{ "status": "ok", "timestamp": "2026-04-18T19:59:21.623Z" }
```

**GET /health/ready — 200 OK**
```json
{ "status": "ready", "db": "ok" }
```

**GET /health/ready — 503 Service Unavailable**
```json
{ "statusCode": 503, "message": "Database not ready", "error": "Service Unavailable" }
```
