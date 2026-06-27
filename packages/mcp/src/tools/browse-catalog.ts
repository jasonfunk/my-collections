import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v3';
import { apiGet } from '../api-client';

const COLLECTION_TYPES = ['star-wars', 'transformers', 'he-man'] as const;

interface CatalogItem {
  id: string;
  name: string;
  line?: string;
  releaseYear?: number;
  estimatedValue?: number;
  accessories?: string[];
}

interface Meta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface PaginatedResponse {
  data: CatalogItem[];
  meta: Meta;
}

export function register(server: McpServer): void {
  server.registerTool(
    'browse_catalog',
    {
      description: 'Search the master catalog (not just owned items) for any collection. Returns reference data including accessories lists and release years.',
      inputSchema: {
        collectionType: z.enum(COLLECTION_TYPES).describe('Which collection to browse'),
        search: z.string().optional().describe('Filter by name'),
        page: z.number().min(1).optional().describe('Page number (default 1)'),
        limit: z.number().min(1).max(100).optional().describe('Results per page (default 20)'),
        // Star Wars filters
        category: z.string().optional().describe('Star Wars: figure category (e.g. FIGURE, VEHICLE)'),
        line: z.string().optional().describe('Product line (e.g. VINTAGE, POWER_OF_THE_FORCE)'),
        // Transformers filters
        faction: z.string().optional().describe('Transformers: faction (e.g. AUTOBOT, DECEPTICON)'),
        // He-Man filters
        characterType: z.string().optional().describe('He-Man: character type (e.g. HEROIC_WARRIOR, EVIL_WARRIOR)'),
      },
    },
    async ({ collectionType, search, page, limit, category, line, faction, characterType }) => {
      const params: Record<string, string | number | boolean | undefined> = {
        search,
        page: page ?? 1,
        limit: limit ?? 20,
        category,
        line,
        faction,
        characterType,
      };
      const result = await apiGet<PaginatedResponse>(`/collections/${collectionType}/catalog`, params);

      if (!result.data.length) {
        return { content: [{ type: 'text' as const, text: 'No catalog entries found.' }] };
      }

      const lines = [
        `**${collectionType} catalog** — ${result.meta.total} total (page ${result.meta.page}):`,
        '',
        ...result.data.map((item) => {
          const year = item.releaseYear ? ` (${item.releaseYear})` : '';
          const value = item.estimatedValue ? ` ~$${item.estimatedValue}` : '';
          return `- **${item.name}**${year}${value} — id: ${item.id}`;
        }),
      ];
      return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
    },
  );
}
