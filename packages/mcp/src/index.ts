import 'dotenv/config';
import { startServer } from './server';

startServer().catch((err) => {
  console.error('[mcp-server] Fatal startup error:', err);
  process.exit(1);
});
