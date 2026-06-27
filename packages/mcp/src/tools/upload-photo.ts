import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v3';
import { apiPostForm } from '../api-client';

const MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;

const EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export async function uploadPhotoToApi(base64Data: string, mimeType: string): Promise<string> {
  const buf = Buffer.from(base64Data, 'base64');
  const ext = EXTENSION_MAP[mimeType] ?? 'jpg';
  const blob = new Blob([buf], { type: mimeType });
  const formData = new FormData();
  formData.append('file', blob, `photo.${ext}`);
  const result = await apiPostForm<{ url: string }>('/collections/photos/upload', formData);
  return result.url;
}

export function register(server: McpServer): void {
  server.registerTool(
    'upload_photo',
    {
      description: 'Upload a photo from base64-encoded image data. Returns a hosted URL. Use attach_photo_to_item to also link it to an item in one step.',
      inputSchema: {
        base64Data: z.string().describe('Base64-encoded image data (no data: URI prefix)'),
        mimeType: z.enum(MIME_TYPES).describe('Image MIME type'),
      },
    },
    async ({ base64Data, mimeType }) => {
      const url = await uploadPhotoToApi(base64Data, mimeType);
      return { content: [{ type: 'text' as const, text: `Photo uploaded successfully. URL: ${url}` }] };
    },
  );
}
