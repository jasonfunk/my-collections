# Suggested Commands

## Development
```bash
npm run dev --workspace=packages/api   # API dev server (port 3000)
npm run dev --workspace=packages/web   # Web dev server (port 5173)
npm run dev                            # all packages
```

## Test / Lint / Build
```bash
npm run test    # all tests
npm run lint    # all lint
npm run build   # build all packages
```

## Database
```bash
docker compose up -d   # start PostgreSQL 16
# TypeORM migrations via packages/api
```

## Kill API server
```bash
lsof -ti :3000 | xargs kill -9
```

## GitHub CLI
```bash
/opt/homebrew/bin/gh pr create ...   # gh is NOT on default PATH
```
