import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v3';
import { apiGet } from '../api-client';

const COLLECTION_TYPES = ['star-wars', 'transformers', 'he-man'] as const;

interface WishlistItem {
  id: string;
  name: string;
  wishlistPriority?: string;
  estimatedValue?: number;
  notes?: string;
}

interface PaginatedResponse {
  data: WishlistItem[];
  total: number;
  page: number;
  pageSize: number;
}

const PRIORITY_ORDER = ['CRITICAL', 'ULTRA_RARE', 'HIGH', 'MEDIUM', 'LOW'];

export function register(server: McpServer): void {
  server.registerTool(
    'get_wishlist',
    {
      description: 'Get wishlist items for a collection, sorted by priority (CRITICAL → LOW).',
      inputSchema: {
        collectionType: z.enum(COLLECTION_TYPES).describe('Which collection wishlist to retrieve'),
        page: z.number().min(1).optional().describe('Page number (default 1)'),
        limit: z.number().min(1).max(100).optional().describe('Results per page (default 50)'),
      },
    },
    async ({ collectionType, page, limit }) => {
      const result = await apiGet<PaginatedResponse>(`/collections/${collectionType}/wishlist`, {
        page: page ?? 1,
        pageSize: limit ?? 50,
      });

      if (!result.data.length) {
        return { content: [{ type: 'text' as const, text: `No items on ${collectionType} wishlist.` }] };
      }

      const sorted = [...result.data].sort((a, b) => {
        const ai = PRIORITY_ORDER.indexOf(a.wishlistPriority ?? 'LOW');
        const bi = PRIORITY_ORDER.indexOf(b.wishlistPriority ?? 'LOW');
        return ai - bi;
      });

      const lines = [
        `**${collectionType} wishlist** — ${result.total} item(s):`,
        '',
        ...sorted.map((item) => {
          const priority = item.wishlistPriority ?? 'NONE';
          const value = item.estimatedValue ? ` ~$${item.estimatedValue}` : '';
          return `- **${item.name}** (${priority})${value} — id: ${item.id}`;
        }),
      ];
      return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
    },
  );
}
