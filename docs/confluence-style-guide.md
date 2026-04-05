# Confluence Style Guide — My Collections

Formatting conventions for all pages under the **My Collections — Technical Documentation** space in Confluence. Follow these rules when creating or updating pages via the Atlassian MCP tools.

---

## Headings

| Level | ADF Type | Use For |
|---|---|---|
| H2 | `heading` attrs.level 2 | Major sections within a page |
| H3 | `heading` attrs.level 3 | Subsections |
| H4 | `heading` attrs.level 4 | Sub-subsections (e.g. individual endpoints within a module) |

Do not use H1 — the page title serves as H1.

---

## Code Blocks

Use ADF `codeBlock` nodes with a `language` attribute for syntax highlighting:

| Content | Language hint |
|---|---|
| HTTP endpoints / request examples | `http` |
| JSON request/response bodies | `json` |
| TypeScript interfaces / types | `typescript` |
| Shell commands | `bash` |
| SQL | `sql` |
| Plain text / no highlighting | `text` |

Example ADF node:
```json
{
  "type": "codeBlock",
  "attrs": { "language": "json" },
  "content": [{ "type": "text", "text": "{ \"key\": \"value\" }" }]
}
```

---

## Panels

Use ADF `panel` nodes to call out important information:

| Panel type | ADF `panelType` | Use for |
|---|---|---|
| Info (blue) | `info` | Tips, clarifications, helpful context |
| Warning (yellow) | `warning` | Caveats, footguns, things that can go wrong |
| Note (purple) | `note` | Prerequisites, dependencies, required setup |
| Error (red) | `error` | Known bugs, breaking changes, blockers |

---

## Tables

Use ADF `table` nodes for:
- Request/response field references
- Enum value lists with descriptions
- Comparison grids (tech stack, workflows, routes)

**Column conventions for field tables:**

| Column | Notes |
|---|---|
| Field | Field name — **bold** if required, *italic* if optional |
| Type | TypeScript type or enum name |
| Required | `yes` / `no` |
| Description | One-line explanation |

---

## API Endpoint Format

Format each endpoint as a `codeBlock` with language `http`:

```
GET /collections/star-wars
POST /auth/token
PATCH /collections/transformers/:id
```

Follow with:
1. A brief description paragraph
2. Request parameters/body as a table (required fields bolded)
3. Response shape as a `json` codeBlock
4. Error status codes as a bulleted list

---

## Required vs Optional Fields

- **Bold** the field name in tables if it is required
- *Italicize* the field name if it is optional
- In prose, use "required" / "optional" explicitly rather than relying on formatting alone

---

## Enum Values

List enum values in a `bulletList` using inline `code` marks:

- `AUTOBOT`
- `DECEPTICON`

For longer enums (>6 values), use a two-column table with value and description columns.

---

## Page Hierarchy & Naming

All technical documentation lives under the **My Collections — Technical Documentation** root page in the `SD` space.

**Naming pattern:** `My Collections — [Category]: [Topic]`

Examples:
- `My Collections — Authentication API`
- `My Collections — Collections API`
- `My Collections — Web Application Architecture`

Child pages must be created with the correct `parentId` to appear nested under the right parent.

---

## Content Format

All page content passed to `createConfluencePage` or `updateConfluencePage` must be a valid **ADF document object**:

```json
{
  "version": 1,
  "type": "doc",
  "content": [ ...nodes ]
}
```

Do not pass Markdown strings. Confluence will render them as plain text, not formatted content.
