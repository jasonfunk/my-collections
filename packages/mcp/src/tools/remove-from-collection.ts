import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v3';
import { apiDelete } from '../api-client';

const COLLECTION_TYPES = ['star-wars', 'transformers', 'he-man'] as const;

export function register(server: McpServer): void {
  server.registerTool(
    'remove_from_collection',
    {
      description: 'Permanently remove an item from a collection. Use with caution — this cannot be undone.',
      inputSchema: {
        collectionType: z.enum(COLLECTION_TYPES).describe('Which collection the item belongs to'),
        id: z.string().describe('User item UUID to remove'),
      },
    },
    async ({ collectionType, id }) => {
      await apiDelete(`/collections/${collectionType}/items/${id}`);
      return { content: [{ type: 'text' as const, text: `Item ${id} removed from ${collectionType} collection.` }] };
    },
  );
}
