/**
 * Finds catalogImageUrl for the 9 missing Star Wars twelve-inch figures using
 * the Wookieepedia (Fandom) MediaWiki API — no scraping, no Cloudflare issues.
 *
 * Strategy: for each figure, try known Wookieepedia page titles then fall back
 * to a search, and retrieve the page thumbnail image URL.
 *
 * Run: npm run enrich:star-wars-12inch-images
 * Output: prints a confirmed name→imageUrl map to paste into patch-star-wars-12inch-images.ts
 */
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../packages/api/.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const WIKI_API = 'https://starwars.fandom.com/api.php';
const RATE_MS = 600;
const UA = 'Mozilla/5.0 (compatible; my-collections-catalog-enrichment/1.0)';

// Figure name → candidate Wookieepedia page title(s) to try in order.
// Individual twelve-inch figure pages don't exist on Wookieepedia; use main
// character articles which have individual images.
const FIGURES: Array<{ name: string; candidates: string[] }> = [
  {
    name: 'Artoo-Detoo (R2-D2)',
    candidates: ['R2-D2'],
  },
  {
    name: 'Chewbacca',
    candidates: ['Chewbacca'],
  },
  {
    name: 'Luke Skywalker',
    candidates: ['Luke Skywalker'],
  },
  {
    name: 'Princess Leia Organa',
    candidates: ['Leia Organa', 'Princess Leia Organa'],
  },
  {
    name: 'Ben (Obi-Wan) Kenobi',
    candidates: ['Obi-Wan Kenobi', 'Ben Kenobi'],
  },
  {
    name: 'Han Solo',
    candidates: ['Han Solo'],
  },
  {
    name: 'Jawa',
    candidates: ['Jawa'],
  },
  {
    name: 'Stormtrooper',
    candidates: ['Stormtrooper'],
  },
  {
    name: 'Boba Fett (Empire Strikes Back)',
    candidates: ['Boba Fett'],
  },
];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface PageImagesResponse {
  query?: {
    pages?: Record<string, {
      missing?: string;
      thumbnail?: { source: string };
    }>;
  };
}

interface SearchResponse {
  query?: {
    search?: Array<{ title: string }>;
  };
}

async function getPageThumbnail(title: string): Promise<string | null> {
  const params = new URLSearchParams({
    action: 'query',
    prop: 'pageimages',
    titles: title,
    pithumbsize: '400',
    format: 'json',
  });
  const res = await fetch(`${WIKI_API}?${params}`, { headers: { 'User-Agent': UA } });
  if (!res.ok) return null;
  const data = (await res.json()) as PageImagesResponse;
  const pages = data?.query?.pages;
  if (!pages) return null;
  for (const page of Object.values(pages)) {
    if ('missing' in page) return null;
    if (page.thumbnail?.source) return page.thumbnail.source;
  }
  return null;
}

async function searchWookieepedia(query: string): Promise<string[]> {
  const params = new URLSearchParams({
    action: 'query',
    list: 'search',
    srsearch: query,
    srlimit: '5',
    srnamespace: '0',
    format: 'json',
  });
  const res = await fetch(`${WIKI_API}?${params}`, { headers: { 'User-Agent': UA } });
  if (!res.ok) return [];
  const data = (await res.json()) as SearchResponse;
  return data?.query?.search?.map((r) => r.title) ?? [];
}

async function resolveImageUrl(
  figure: (typeof FIGURES)[0],
): Promise<{ imageUrl: string; via: string } | null> {
  for (const candidate of figure.candidates) {
    const url = await getPageThumbnail(candidate);
    if (url) return { imageUrl: url, via: candidate };
    await sleep(RATE_MS);
  }

  const searchQuery = `${figure.name} kenner twelve inch figure star wars`;
  const titles = await searchWookieepedia(searchQuery);
  await sleep(RATE_MS);

  for (const title of titles) {
    const url = await getPageThumbnail(title);
    if (url) return { imageUrl: url, via: `search→${title}` };
    await sleep(RATE_MS);
  }

  return null;
}

async function main() {
  console.log('Looking up twelve-inch figure images on Wookieepedia...\n');

  const results: Array<{ name: string; imageUrl: string; via: string }> = [];

  for (const figure of FIGURES) {
    process.stdout.write(`  ${figure.name}... `);
    const result = await resolveImageUrl(figure);
    if (result) {
      results.push({ name: figure.name, imageUrl: result.imageUrl, via: result.via });
      console.log(`✓ (via: ${result.via})`);
    } else {
      console.log('NOT FOUND');
    }
  }

  console.log('\n─────────────────────────────────────────────────────────────');
  console.log(`\nFound ${results.length} / ${FIGURES.length}. Paste into patch-star-wars-12inch-images.ts:\n`);
  console.log('const IMAGES: Record<string, string> = {');
  for (const r of results) {
    console.log(`  '${r.name}': '${r.imageUrl}',`);
  }
  console.log('};');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
