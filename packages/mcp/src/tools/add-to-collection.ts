import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v3';
import { apiPost } from '../api-client';

const COLLECTION_TYPES = ['star-wars', 'transformers', 'he-man'] as const;
const CONDITIONS = ['MINT', 'NEAR_MINT', 'EXCELLENT', 'VERY_GOOD', 'GOOD', 'FAIR', 'POOR'] as const;
const PACKAGING_CONDITIONS = ['MINT', 'NEAR_MINT', 'EXCELLENT', 'VERY_GOOD', 'GOOD', 'FAIR', 'POOR'] as const;
const WISHLIST_PRIORITIES = ['CRITICAL', 'ULTRA_RARE', 'HIGH', 'MEDIUM', 'LOW'] as const;
const ACQUISITION_SOURCES = ['STORE', 'ONLINE', 'TOY_SHOW', 'FLEA_MARKET', 'TRADE', 'GIFT', 'OTHER'] as const;

export function register(server: McpServer): void {
  server.registerTool(
    'add_to_collection',
    {
      description: 'Add an item to a collection (owned or wishlist). Requires a catalog ID — use browse_catalog or search_collection first to find it.',
      inputSchema: {
        collectionType: z.enum(COLLECTION_TYPES).describe('Which collection to add to'),
        catalogId: z.string().describe('UUID of the catalog entry to claim'),
        isOwned: z.boolean().describe('true = owned, false = add to wishlist'),
        condition: z.enum(CONDITIONS).optional().describe('Physical condition (required for owned items)'),
        packagingCondition: z.enum(PACKAGING_CONDITIONS).optional(),
        isComplete: z.boolean().optional().describe('Whether all accessories are present'),
        ownedAccessories: z.array(z.string()).optional().describe('List of accessories the user has'),
        wishlistPriority: z.enum(WISHLIST_PRIORITIES).optional().describe('Priority (for wishlist items)'),
        acquisitionSource: z.enum(ACQUISITION_SOURCES).optional(),
        acquisitionDate: z.string().optional().describe('ISO 8601 date (e.g. 2024-06-15)'),
        acquisitionPrice: z.number().min(0).optional().describe('Amount paid'),
        estimatedValue: z.number().min(0).optional().describe('Current market value estimate'),
        notes: z.string().optional(),
        // Star Wars specific
        isCarded: z.boolean().optional().describe('Star Wars / He-Man: item is still on card'),
        isBoxed: z.boolean().optional().describe('Transformers / Star Wars: item is in box'),
        // Transformers specific
        hasInstructions: z.boolean().optional().describe('Transformers: has instruction booklet'),
        hasTechSpec: z.boolean().optional().describe('Transformers: has tech spec card'),
        rubSign: z.boolean().optional().describe('Transformers: rub sign present'),
        // He-Man specific
        hasBackCard: z.boolean().optional().describe('He-Man: has back card'),
      },
    },
    async (args) => {
      const { collectionType, ...body } = args;
      const item = await apiPost<{ id: string; name: string }>(`/collections/${collectionType}/items`, body);
      const status = args.isOwned ? 'owned' : 'wishlist';
      return { content: [{ type: 'text' as const, text: `Added **${item.name}** to ${collectionType} ${status}. ID: ${item.id}` }] };
    },
  );
}
