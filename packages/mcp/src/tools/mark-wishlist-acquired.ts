import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v3';
import { apiPatch } from '../api-client';

const COLLECTION_TYPES = ['star-wars', 'transformers', 'he-man'] as const;
const CONDITIONS = ['MINT', 'NEAR_MINT', 'EXCELLENT', 'VERY_GOOD', 'GOOD', 'FAIR', 'POOR'] as const;
const ACQUISITION_SOURCES = ['STORE', 'ONLINE', 'TOY_SHOW', 'FLEA_MARKET', 'TRADE', 'GIFT', 'OTHER'] as const;

export function register(server: McpServer): void {
  server.registerTool(
    'mark_wishlist_acquired',
    {
      description: 'Convert a wishlist item to owned in one step. Records condition, source, and price at the time of acquisition.',
      inputSchema: {
        collectionType: z.enum(COLLECTION_TYPES).describe('Which collection this item belongs to'),
        id: z.string().describe('User item UUID (must currently be isOwned: false)'),
        condition: z.enum(CONDITIONS).describe('Condition of the acquired item'),
        acquisitionSource: z.enum(ACQUISITION_SOURCES).optional(),
        acquisitionDate: z.string().optional().describe('ISO 8601 date (defaults to today)'),
        acquisitionPrice: z.number().min(0).optional().describe('Amount paid'),
        estimatedValue: z.number().min(0).optional(),
        notes: z.string().optional(),
      },
    },
    async (args) => {
      const { collectionType, id, ...body } = args;
      const item = await apiPatch<{ id: string; name: string }>(`/collections/${collectionType}/items/${id}/acquired`, body);
      return { content: [{ type: 'text' as const, text: `Marked **${item.name}** as acquired! Moved from wishlist to owned. ID: ${item.id}` }] };
    },
  );
}
