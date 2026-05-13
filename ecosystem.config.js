// pm2 process definitions for the Mac Mini server.
// Absolute paths are Mac Mini-specific: /Users/jfunk/Sites/...
// Production process uses __dirname so it stays correct if the repo moves.
// Staging process points to ~/Sites/my-collections-stage (separate clone on develop).
//
// Usage:
//   pm2 start ecosystem.config.js --only my-collections-api          # production only
//   pm2 start ecosystem.config.js --only my-collections-api-stage    # staging only
//   pm2 start ecosystem.config.js                                     # both
//
// cwd is set to packages/api/ (not repo root) so NestJS ConfigModule.forRoot()
// finds the .env file at startup. Setting cwd to repo root causes the API to
// crash immediately — NODE_ENV and DATABASE_URL are never injected.

module.exports = {
  apps: [
    {
      name: 'my-collections-api',
      script: `${__dirname}/packages/api/dist/main.js`,
      cwd: `${__dirname}/packages/api`,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
    },
    {
      name: 'my-collections-api-stage',
      script: '/Users/jfunk/Sites/my-collections-stage/packages/api/dist/main.js',
      cwd: '/Users/jfunk/Sites/my-collections-stage/packages/api',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
    },
  ],
};
