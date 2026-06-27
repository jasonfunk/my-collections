import express, { Request, Response, NextFunction } from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { initTokenManager } from './token-manager';
import { registerAllTools } from './tools/index';
import pkg from '../package.json';

const { version } = pkg;

function getBearerToken(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);
  const qToken = req.query['token'];
  if (typeof qToken === 'string') return qToken;
  return undefined;
}

function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.path === '/health') { next(); return; }
  const token = getBearerToken(req);
  if (!token || token !== process.env.MCP_BEARER_TOKEN) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

export async function startServer(): Promise<void> {
  await initTokenManager();

  const mcpServer = new McpServer({ name: 'my-collections', version });
  registerAllTools(mcpServer);

  // Stateless transport — no session tracking needed for Claude.ai tool calls
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  await mcpServer.connect(transport);

  const app = express();
  app.use(express.json());
  app.use(authMiddleware);

  app.get('/health', (_req: Request, res: Response): void => {
    res.json({ status: 'ok', version });
  });

  app.all('/mcp', async (req: Request, res: Response): Promise<void> => {
    await transport.handleRequest(req, res, req.body);
  });

  const port = parseInt(process.env.PORT ?? '3001', 10);
  app.listen(port, () => {
    console.log(`[mcp-server] Listening on port ${port}`);
    console.log(`[mcp-server] Health: http://localhost:${port}/health`);
    console.log(`[mcp-server] MCP endpoint: http://localhost:${port}/mcp`);
  });
}
