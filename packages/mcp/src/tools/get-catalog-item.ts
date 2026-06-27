import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v3';
import { apiGet } from '../api-client';

const COLLECTION_TYPES = ['star-wars', 'transformers', 'he-man'] as const;

interface CatalogDetail {
  id: string;
  name: string;
  line?: string;
  releaseYear?: number;
  estimatedValue?: number;
  accessories?: string[];
  imageUrl?: string;
  notes?: string;
  [key: string]: unknown;
}

export function register(server: McpServer): void {
  server.registerTool(
    'get_catalog_item',
    {
      description: 'Get full catalog entry for a specific item: accessories list, release year, variant info, and image URL.',
      inputSchema: {
        collectionType: z.enum(COLLECTION_TYPES).describe('Which collection this item belongs to'),
        id: z.string().describe('Catalog item UUID'),
      },
    },
    async ({ collectionType, id }) => {
      const item = await apiGet<CatalogDetail>(`/collections/${collectionType}/catalog/${id}`);

      const lines = [
        `## ${item.name}`,
        `**Collection:** ${collectionType}`,
        item.line ? `**Line:** ${item.line}` : null,
        item.releaseYear ? `**Release Year:** ${item.releaseYear}` : null,
        item.estimatedValue ? `**Est. Value:** $${item.estimatedValue}` : null,
        item.imageUrl ? `**Image:** ${item.imageUrl}` : null,
        '',
        item.accessories?.length
          ? `**Accessories (${item.accessories.length}):**\n${item.accessories.map((a) => `  - ${a}`).join('\n')}`
          : '**Accessories:** None listed',
        item.notes ? `\n**Notes:** ${item.notes}` : null,
        `\n**ID:** ${item.id}`,
      ].filter(Boolean);

      return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
    },
  );
}
