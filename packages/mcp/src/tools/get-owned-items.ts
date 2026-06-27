import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v3';
import { apiGet } from '../api-client';

const COLLECTION_TYPES = ['star-wars', 'transformers', 'he-man'] as const;

interface OwnedItem {
  id: string;
  name: string;
  condition?: string;
  isComplete?: boolean;
  estimatedValue?: number;
  acquisitionDate?: string;
}

interface PaginatedResponse {
  data: OwnedItem[];
  total: number;
  page: number;
  pageSize: number;
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
        pageSize: limit ?? 20,
      });

      if (!result.data.length) {
        return { content: [{ type: 'text' as const, text: 'No owned items found.' }] };
      }

      const lines = [
        `**${collectionType} owned items** — ${result.total} total (page ${result.page}):`,
        '',
        ...result.data.map((item) => {
          const cond = item.condition ? ` [${item.condition}]` : '';
          const complete = item.isComplete === false ? ' ⚠️ incomplete' : '';
          const value = item.estimatedValue ? ` ~$${item.estimatedValue}` : '';
          return `- **${item.name}**${cond}${complete}${value} — id: ${item.id}`;
        }),
      ];
      return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
    },
  );
}
