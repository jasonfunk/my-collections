import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v3';
import { apiGet, apiPatch } from '../api-client';
import { uploadPhotoToApi } from './upload-photo';

const COLLECTION_TYPES = ['star-wars', 'transformers', 'he-man'] as const;
const MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;

interface ItemRecord {
  id: string;
  name: string;
  photoUrls?: string[];
}

export function register(server: McpServer): void {
  server.registerTool(
    'attach_photo_to_item',
    {
      description: 'Upload a photo and attach it to a collection item in one step. This is the primary tool to use when a user shares a photo and says "add this to my [item]".',
      inputSchema: {
        collectionType: z.enum(COLLECTION_TYPES).describe('Which collection the item belongs to'),
        itemId: z.string().describe('User item UUID'),
        base64Data: z.string().describe('Base64-encoded image data (no data: URI prefix)'),
        mimeType: z.enum(MIME_TYPES).describe('Image MIME type'),
      },
    },
    async ({ collectionType, itemId, base64Data, mimeType }) => {
      // 1. Upload the photo
      const url = await uploadPhotoToApi(base64Data, mimeType);

      // 2. Get current item to read existing photoUrls
      const item = await apiGet<ItemRecord>(`/collections/${collectionType}/items/${itemId}`);
      const existingUrls = item.photoUrls ?? [];

      // 3. Update item with new photo appended
      const updated = await apiPatch<ItemRecord>(
        `/collections/${collectionType}/items/${itemId}`,
        { photoUrls: [...existingUrls, url] },
      );

      return {
        content: [{
          type: 'text' as const,
          text: `Photo attached to **${updated.name}**. It now has ${updated.photoUrls?.length ?? 1} photo(s). New URL: ${url}`,
        }],
      };
    },
  );
}
