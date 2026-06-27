import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v3';
import { apiGet } from '../api-client';

const COLLECTION_TYPES = ['star-wars', 'transformers', 'he-man'] as const;

interface ItemDetail {
  id: string;
  name: string;
  isOwned: boolean;
  isComplete?: boolean;
  condition?: string;
  packagingCondition?: string;
  ownedAccessories?: string[];
  acquisitionSource?: string;
  acquisitionDate?: string;
  acquisitionPrice?: number;
  estimatedValue?: number;
  notes?: string;
  photoUrls?: string[];
  wishlistPriority?: string;
  catalogItem?: { accessories?: string[] };
}

export function register(server: McpServer): void {
  server.registerTool(
    'get_item_details',
    {
      description: 'Get full record for a user collection item: condition, owned accessories, acquisition info, notes, and photos.',
      inputSchema: {
        collectionType: z.enum(COLLECTION_TYPES).describe('Which collection this item belongs to'),
        id: z.string().describe('User item UUID'),
      },
    },
    async ({ collectionType, id }) => {
      const item = await apiGet<ItemDetail>(`/collections/${collectionType}/items/${id}`);

      const missingAccessories = item.catalogItem?.accessories?.filter(
        (a) => !(item.ownedAccessories ?? []).includes(a),
      ) ?? [];

      const lines = [
        `## ${item.name}`,
        `**Status:** ${item.isOwned ? 'Owned' : 'Wishlist'}`,
        item.wishlistPriority ? `**Wishlist Priority:** ${item.wishlistPriority}` : null,
        item.condition ? `**Condition:** ${item.condition}` : null,
        item.packagingCondition ? `**Packaging:** ${item.packagingCondition}` : null,
        `**Complete:** ${item.isComplete ? 'Yes' : 'No'}`,
        '',
        item.ownedAccessories?.length
          ? `**Owned Accessories:** ${item.ownedAccessories.join(', ')}`
          : '**Owned Accessories:** None',
        missingAccessories.length
          ? `**Missing Accessories:** ${missingAccessories.join(', ')}`
          : null,
        '',
        item.acquisitionSource ? `**Source:** ${item.acquisitionSource}` : null,
        item.acquisitionDate ? `**Acquired:** ${item.acquisitionDate}` : null,
        item.acquisitionPrice != null ? `**Paid:** $${item.acquisitionPrice}` : null,
        item.estimatedValue != null ? `**Est. Value:** $${item.estimatedValue}` : null,
        item.notes ? `\n**Notes:** ${item.notes}` : null,
        item.photoUrls?.length ? `\n**Photos:** ${item.photoUrls.join(', ')}` : null,
        `\n**ID:** ${item.id}`,
      ].filter(Boolean);

      return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
    },
  );
}
