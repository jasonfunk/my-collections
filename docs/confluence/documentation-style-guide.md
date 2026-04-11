---
confluence_page_id: "3637249"
confluence_url: "https://houseoffunk-net.atlassian.net/wiki/spaces/SD/pages/3637249"
title: "My Collections — Documentation Style Guide"
last_updated: "2026-04-05"
---

## Purpose

This guide defines the formatting conventions used across all My Collections documentation pages. Follow these conventions when creating or updating any page in this space to ensure consistency.

## Headings

- **H2** — Major sections within a page (e.g., Overview, Endpoints, Fields)
- **H3** — Subsections within a major section (e.g., individual endpoint groups)
- **H4** — Sub-subsections (e.g., individual endpoints within a group)

## Code Blocks

Always use a `codeBlock` node with a language hint. Use the following language values:

- `json` — Request/response bodies, configuration examples
- `typescript` — TypeScript/JavaScript code snippets
- `bash` — Shell commands
- `http` — HTTP method + path (e.g., `GET /auth/authorize`)

## Panels

- **Info panel** — Tips, helpful context, and supplementary notes
- **Warning panel** — Caveats, gotchas, known issues, and things that can go wrong
- **Note panel** — Prerequisites, requirements, and important context before a section

## Tables

Use tables for:

- Request/response field definitions (Field | Type | Required | Description)
- Enum value listings with descriptions
- Comparison grids (e.g., tech stack layer vs. technology)

## API Endpoint Format

Lead each endpoint with its METHOD and path in a `codeBlock` using language `http`. For field tables:

- **Required fields** — bold in the Required column
- _Optional fields_ — italic in the Required column

## Enum Values

List enum values as a bulleted list of inline `code` values under the field description. Include a short description for each value where the name is not self-explanatory.

## Page Naming Convention

Top-level pages: `My Collections — [Topic]`

Child pages under a category parent: `My Collections — [Category]: [Topic]` (e.g., `My Collections — API Reference: Authentication`)
