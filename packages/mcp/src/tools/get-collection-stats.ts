import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { apiGet } from '../api-client';

interface CollectionStatEntry {
  owned: number;
  wishlist: number;
  estimatedValue: number;
}

interface StatsResponse {
  starWars: CollectionStatEntry;
  transformers: CollectionStatEntry;
  heman: CollectionStatEntry;
  totals: CollectionStatEntry;
}

export function register(server: McpServer): void {
  server.registerTool(
    'get_collection_stats',
    {
      description: 'Get owned/wishlist counts and total estimated value across all three collections (Star Wars, Transformers, He-Man).',
      inputSchema: {},
    },
    async () => {
      const stats = await apiGet<StatsResponse>('/collections/stats');
      const lines = [
        '## Collection Stats',
        '',
        `**Star Wars** — Owned: ${stats.starWars.owned} | Wishlist: ${stats.starWars.wishlist} | Est. Value: $${stats.starWars.estimatedValue.toFixed(2)}`,
        `**Transformers** — Owned: ${stats.transformers.owned} | Wishlist: ${stats.transformers.wishlist} | Est. Value: $${stats.transformers.estimatedValue.toFixed(2)}`,
        `**He-Man** — Owned: ${stats.heman.owned} | Wishlist: ${stats.heman.wishlist} | Est. Value: $${stats.heman.estimatedValue.toFixed(2)}`,
        '',
        `**Totals** — Owned: ${stats.totals.owned} | Wishlist: ${stats.totals.wishlist} | Est. Value: $${stats.totals.estimatedValue.toFixed(2)}`,
      ];
      return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
    },
  );
}
