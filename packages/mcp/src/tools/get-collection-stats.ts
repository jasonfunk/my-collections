import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { apiGet } from '../api-client';

interface CollectionStatEntry {
  owned: number;
  wishlist: number;
  estimatedTotalValue: number | null;
}

interface StatsResponse {
  starWars: CollectionStatEntry;
  transformers: CollectionStatEntry;
  heman: CollectionStatEntry;
  totals: CollectionStatEntry;
}

function fmt(value: number | null): string {
  return value != null ? `$${value.toFixed(2)}` : 'N/A';
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
        `**Star Wars** — Owned: ${stats.starWars.owned} | Wishlist: ${stats.starWars.wishlist} | Est. Value: ${fmt(stats.starWars.estimatedTotalValue)}`,
        `**Transformers** — Owned: ${stats.transformers.owned} | Wishlist: ${stats.transformers.wishlist} | Est. Value: ${fmt(stats.transformers.estimatedTotalValue)}`,
        `**He-Man** — Owned: ${stats.heman.owned} | Wishlist: ${stats.heman.wishlist} | Est. Value: ${fmt(stats.heman.estimatedTotalValue)}`,
        '',
        `**Totals** — Owned: ${stats.totals.owned} | Wishlist: ${stats.totals.wishlist} | Est. Value: ${fmt(stats.totals.estimatedTotalValue)}`,
      ];
      return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
    },
  );
}
