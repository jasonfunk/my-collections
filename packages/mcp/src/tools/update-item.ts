import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v3';
import { apiPatch } from '../api-client';

const COLLECTION_TYPES = ['star-wars', 'transformers', 'he-man'] as const;
const CONDITIONS = ['MINT', 'NEAR_MINT', 'EXCELLENT', 'VERY_GOOD', 'GOOD', 'FAIR', 'POOR'] as const;
const PACKAGING_CONDITIONS = ['MINT', 'NEAR_MINT', 'EXCELLENT', 'VERY_GOOD', 'GOOD', 'FAIR', 'POOR'] as const;
const WISHLIST_PRIORITIES = ['CRITICAL', 'ULTRA_RARE', 'HIGH', 'MEDIUM', 'LOW'] as const;
const ACQUISITION_SOURCES = ['STORE', 'ONLINE', 'TOY_SHOW', 'FLEA_MARKET', 'TRADE', 'GIFT', 'OTHER'] as const;

export function register(server: McpServer): void {
  server.registerTool(
    'update_item',
    {
      description: 'Update fields on an existing collection item (condition, accessories, notes, value, photos, etc.).',
      inputSchema: {
        collectionType: z.enum(COLLECTION_TYPES).describe('Which collection the item belongs to'),
        id: z.string().describe('User item UUID'),
        condition: z.enum(CONDITIONS).optional(),
        packagingCondition: z.enum(PACKAGING_CONDITIONS).optional(),
        isComplete: z.boolean().optional(),
        ownedAccessories: z.array(z.string()).optional().describe('Full list of accessories the user has (replaces existing)'),
        wishlistPriority: z.enum(WISHLIST_PRIORITIES).optional(),
        acquisitionSource: z.enum(ACQUISITION_SOURCES).optional(),
        acquisitionDate: z.string().optional().describe('ISO 8601 date'),
        acquisitionPrice: z.number().min(0).optional(),
        estimatedValue: z.number().min(0).optional(),
        notes: z.string().optional(),
        photoUrls: z.array(z.string()).optional().describe('Full list of photo URLs (replaces existing)'),
        isCarded: z.boolean().optional(),
        isBoxed: z.boolean().optional(),
        hasInstructions: z.boolean().optional(),
        hasTechSpec: z.boolean().optional(),
        rubSign: z.boolean().optional(),
        hasBackCard: z.boolean().optional(),
      },
    },
    async (args) => {
      const { collectionType, id, ...body } = args;
      const item = await apiPatch<{ id: string; name: string }>(`/collections/${collectionType}/items/${id}`, body);
      return { content: [{ type: 'text' as const, text: `Updated **${item.name}** (id: ${item.id}).` }] };
    },
  );
}
