import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v3';
import { apiGet } from '../api-client';

const COLLECTION_TYPES = ['star-wars', 'transformers', 'he-man'] as const;

interface CatalogRef {
  name: string;
  faction?: string;
}

interface OwnedItem {
  id: string;
  catalog?: CatalogRef;
  name?: string; // search endpoint flattens this
  condition?: string;
  isComplete?: boolean;
  estimatedValue?: number;
  acquisitionDate?: string;
}

interface Meta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface PaginatedResponse {
  data: OwnedItem[];
  meta: Meta;
}

export function register(server: McpServer): void {
  server.registerTool(
    'get_owned_items',
    {
      description: 'Get paginated list of owned items in a collection with optional name search.',
      inputSchema: {
        collectionType: z.enum(COLLECTION_TYPES).describe('Which collection to list'),
        search: z.string().optional().describe('Filter by name'),
        page: z.number().min(1).optional().describe('Page number (default 1)'),
        limit: z.number().min(1).max(100).optional().describe('Results per page (default 20)'),
      },
    },
    async ({ collectionType, search, page, limit }) => {
      const result = await apiGet<PaginatedResponse>(`/collections/${collectionType}/items`, {
        search,
        page: page ?? 1,
        limit: limit ?? 20,
      });

      if (!result.data.length) {
        return { content: [{ type: 'text' as const, text: 'No owned items found.' }] };
      }

      const { total, page: currentPage } = result.meta;
      const lines = [
        `**${collectionType} owned items** — ${total} total (page ${currentPage}):`,
        '',
        ...result.data.map((item) => {
          const name = item.catalog?.name ?? item.name ?? '(unknown)';
          const cond = item.condition ? ` [${item.condition}]` : '';
          const complete = item.isComplete === false ? ' ⚠️ incomplete' : '';
          const value = item.estimatedValue ? ` ~$${item.estimatedValue}` : '';
          return `- **${name}**${cond}${complete}${value} — id: ${item.id}`;
        }),
      ];
      return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
    },
  );
}
