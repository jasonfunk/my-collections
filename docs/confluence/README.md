# Confluence Documentation Mirror

Local markdown copies of all My Collections Confluence pages. Edit here first, then push to Confluence via MCP.

## Page Registry

| File | Confluence Page ID | URL | Last Updated |
|---|---|---|---|
| [technical-documentation.md](technical-documentation.md) | `3604481` | [/spaces/SD/pages/3604481](https://houseoffunk-net.atlassian.net/wiki/spaces/SD/pages/3604481) | 2026-04-05 |
| [documentation-style-guide.md](documentation-style-guide.md) | `3637249` | [/spaces/SD/pages/3637249](https://houseoffunk-net.atlassian.net/wiki/spaces/SD/pages/3637249) | 2026-04-05 |
| [project-architecture.md](project-architecture.md) | `3670018` | [/spaces/SD/pages/3670018](https://houseoffunk-net.atlassian.net/wiki/spaces/SD/pages/3670018) | 2026-04-19 |
| [api-reference.md](api-reference.md) | `3702785` | [/spaces/SD/pages/3702785](https://houseoffunk-net.atlassian.net/wiki/spaces/SD/pages/3702785) | 2026-04-05 |
| [authentication-api.md](authentication-api.md) | `3571714` | [/spaces/SD/pages/3571714](https://houseoffunk-net.atlassian.net/wiki/spaces/SD/pages/3571714) | 2026-04-05 |
| [users-api.md](users-api.md) | `3866625` | [/spaces/SD/pages/3866625](https://houseoffunk-net.atlassian.net/wiki/spaces/SD/pages/3866625) | 2026-04-05 |
| [collections-api.md](collections-api.md) | `3833858` | [/spaces/SD/pages/3833858](https://houseoffunk-net.atlassian.net/wiki/spaces/SD/pages/3833858) | 2026-04-10 |
| [star-wars-figures.md](star-wars-figures.md) | `3637269` | [/spaces/SD/pages/3637269](https://houseoffunk-net.atlassian.net/wiki/spaces/SD/pages/3637269) | 2026-04-10 |
| [g1-transformers.md](g1-transformers.md) | `4325377` | [/spaces/SD/pages/4325377](https://houseoffunk-net.atlassian.net/wiki/spaces/SD/pages/4325377) | 2026-04-10 |
| [masters-of-the-universe.md](masters-of-the-universe.md) | `4358146` | [/spaces/SD/pages/4358146](https://houseoffunk-net.atlassian.net/wiki/spaces/SD/pages/4358146) | 2026-04-10 |
| [web-application-architecture.md](web-application-architecture.md) | `3899393` | [/spaces/SD/pages/3899393](https://houseoffunk-net.atlassian.net/wiki/spaces/SD/pages/3899393) | 2026-04-10 |
| [mobile-architecture.md](mobile-architecture.md) | `9535489` | [/spaces/SD/pages/9535489](https://houseoffunk-net.atlassian.net/wiki/spaces/SD/pages/9535489) | 2026-04-19 |
| [infrastructure-overview.md](infrastructure-overview.md) | `6324226` | [/spaces/SD/pages/6324226](https://houseoffunk-net.atlassian.net/wiki/spaces/SD/pages/6324226) | 2026-04-11 |
| [server-setup-runbook.md](server-setup-runbook.md) | `6356993` | [/spaces/SD/pages/6356993](https://houseoffunk-net.atlassian.net/wiki/spaces/SD/pages/6356993) | 2026-04-11 |

## Workflow

1. **Edit the markdown file** in this directory to reflect code changes
2. **Update Confluence** via Claude Code + Atlassian MCP:
   ```
   Use mcp__atlassian__updateConfluencePage with:
     cloudId: c27d03df-ec97-431d-b4ba-76bf0e31ca34
     pageId: <from registry above>
     contentFormat: markdown
     body: <content of the .md file (excluding this frontmatter section)>
   ```
3. **Update the Last Updated date** in the registry above

## Staleness Guide

| Code change | Files to update |
|---|---|
| New API endpoint | `api-reference.md` + relevant module page |
| Auth flow change | `authentication-api.md` |
| New collection type | `collections-api.md` + new child page |
| New/changed fields on a collection | Relevant collection page |
| New enum values in `@my-collections/shared` | Relevant collection page |
| New React routes or pages | `web-application-architecture.md` |
| Vite config changes | `web-application-architecture.md` |
| New mobile screens or nav changes | `mobile-architecture.md` |
| Mobile auth flow changes | `mobile-architecture.md` + `authentication-api.md` |
| New package added to monorepo | `project-architecture.md` |
| CI/CD workflow changes | `project-architecture.md` |
| DB schema changes (new tables/columns) | `project-architecture.md` |
| Infrastructure changes | `infrastructure-overview.md` + `server-setup-runbook.md` |
| Style guide changes | `documentation-style-guide.md` |
