import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v3';
import { apiGet } from '../api-client';

const COLLECTION_TYPES = ['star-wars', 'transformers', 'he-man'] as const;

interface CatalogRef {
  name: string;
}

interface WishlistItem {
  id: string;
  catalog?: CatalogRef;
  name?: string; // search endpoint flattens this
  wishlistPriority?: string;
  estimatedValue?: number;
  notes?: string;
}

interface Meta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface PaginatedResponse {
  data: WishlistItem[];
  meta: Meta;
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
        limit: limit ?? 50,
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
        `**${collectionType} wishlist** — ${result.meta.total} item(s):`,
        '',
        ...sorted.map((item) => {
          const name = item.catalog?.name ?? item.name ?? '(unknown)';
          const priority = item.wishlistPriority ?? 'NONE';
          const value = item.estimatedValue ? ` ~$${item.estimatedValue}` : '';
          return `- **${name}** (${priority})${value} — id: ${item.id}`;
        }),
      ];
      return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
    },
  );
}
