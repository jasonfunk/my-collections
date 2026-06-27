import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v3';
import { apiGet } from '../api-client';

interface SearchResult {
  id: string;
  name: string;
  collectionType: string;
  isOwned: boolean;
  isComplete?: boolean;
  condition?: string;
  estimatedValue?: number;
  wishlistPriority?: string;
}

interface PaginatedResponse {
  data: SearchResult[];
  total: number;
  page: number;
  pageSize: number;
}

const COLLECTION_TYPES = ['star-wars', 'transformers', 'he-man'] as const;
const CONDITIONS = ['MINT', 'NEAR_MINT', 'EXCELLENT', 'VERY_GOOD', 'GOOD', 'FAIR', 'POOR'] as const;

export function register(server: McpServer): void {
  server.registerTool(
    'search_collection',
    {
      description: 'Search across all collections with optional filters for ownership status, completeness, and condition.',
      inputSchema: {
        q: z.string().optional().describe('Free-text search query (name)'),
        collectionType: z.enum(COLLECTION_TYPES).optional().describe('Filter to a specific collection'),
        isOwned: z.boolean().optional().describe('true = owned items only, false = wishlist only'),
        isComplete: z.boolean().optional().describe('Filter by completeness (accessories)'),
        condition: z.enum(CONDITIONS).optional().describe('Filter by condition grade'),
        page: z.number().min(1).optional().describe('Page number (default 1)'),
        limit: z.number().min(1).max(100).optional().describe('Results per page (default 20)'),
      },
    },
    async ({ q, collectionType, isOwned, isComplete, condition, page, limit }) => {
      const result = await apiGet<PaginatedResponse>('/collections/search', {
        q,
        collectionType,
        isOwned,
        isComplete,
        condition,
        page: page ?? 1,
        pageSize: limit ?? 20,
      });

      if (!result.data.length) {
        return { content: [{ type: 'text' as const, text: 'No results found.' }] };
      }

      const lines = [
        `Found ${result.total} result(s) (page ${result.page}):`,
        '',
        ...result.data.map((item) => {
          const status = item.isOwned ? '✅ owned' : '🔲 wishlist';
          const cond = item.condition ? ` [${item.condition}]` : '';
          const value = item.estimatedValue ? ` ~$${item.estimatedValue}` : '';
          const priority = item.wishlistPriority ? ` (${item.wishlistPriority})` : '';
          return `- **${item.name}** (${item.collectionType}) — ${status}${cond}${value}${priority} — id: ${item.id}`;
        }),
      ];
      return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
    },
  );
}
