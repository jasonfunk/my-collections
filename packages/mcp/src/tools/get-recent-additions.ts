import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v3';
import { apiGet } from '../api-client';

interface RecentItem {
  id: string;
  name: string;
  collectionType: string;
  isOwned: boolean;
  condition?: string;
  createdAt: string;
}

export function register(server: McpServer): void {
  server.registerTool(
    'get_recent_additions',
    {
      description: 'Get items added recently across all collections, sorted newest first.',
      inputSchema: {
        limit: z.number().min(1).max(20).optional().describe('Number of items to return (1–20, default 10)'),
      },
    },
    async ({ limit }) => {
      const items = await apiGet<RecentItem[]>('/collections/recent', { limit: limit ?? 10 });
      if (!items.length) {
        return { content: [{ type: 'text' as const, text: 'No recent additions found.' }] };
      }
      const lines = items.map((item) => {
        const status = item.isOwned ? 'owned' : 'wishlist';
        const date = new Date(item.createdAt).toLocaleDateString();
        const cond = item.condition ? ` [${item.condition}]` : '';
        return `- **${item.name}** (${item.collectionType})${cond} — ${status} — added ${date}`;
      });
      return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
    },
  );
}
