/**
 * Derives and populates the `subgroup` field for all G1 Transformers catalog records.
 * Source: `sourceUrl` slug (same prefix logic as sizeFromUrl in enrich-transformers-tfw.ts).
 *
 * Run: npm run patch:transformers-subgroup
 * Re-run safe: all records are overwritten each time (derived field, always consistent).
 */
import * as fs from 'fs';
import * as path from 'path';

const DATA_PATH = path.resolve(
  __dirname,
  '../packages/api/src/database/seeds/data/g1-transformers-catalog.json',
);

interface CatalogEntry {
  name: string;
  subgroup?: string | null;
  sourceUrl: string | null;
  [key: string]: unknown;
}

function subgroupFromUrl(sourceUrl: string | null): string | null {
  if (!sourceUrl) return null;
  const m = sourceUrl.match(/\/transformers-g1-([^/]+)\/\d/);
  if (!m) return null;
  const slug = m[1];

  if (slug.startsWith('decoys-'))                          return 'Decoy';
  if (slug.startsWith('mini-cassettes-'))                  return 'Cassette';
  if (slug.startsWith('mini-spies-'))                      return 'Mini-Spy';
  if (slug.startsWith('legends-'))                         return 'Legends';
  if (slug.startsWith('micromasters-'))                    return 'Micromaster';
  if (slug.startsWith('mini-vehicles-'))                   return 'Minicar';
  if (slug.startsWith('jumpstarters-'))                    return 'Jumpstarter';
  if (slug.startsWith('throttlebots-'))                    return 'Throttlebot';
  if (slug.startsWith('sparkabots-and-firecons-'))         return 'Sparkabot / Firecon';
  if (slug.startsWith('triggerbots-and-triggercons-'))     return 'Triggerbot / Triggercon';
  if (slug.startsWith('battlechargers-'))                  return 'Battlecharger';
  if (slug.startsWith('clones-'))                          return 'Clone';
  if (slug.startsWith('duocons-'))                         return 'Duocon';
  if (slug.startsWith('powerdashers-'))                    return 'Powerdashers';
  if (slug.startsWith('autobot-cars-'))                    return 'Autobot Car';
  if (slug.startsWith('insecticons-'))                     return 'Insecticon';
  if (slug.startsWith('omnibots-'))                        return 'Omnibot';
  if (slug.startsWith('decepticon-jets-'))                 return 'Seeker';
  if (slug.startsWith('dinobots-'))                        return 'Dinobot';
  if (slug.startsWith('headmasters-'))                     return 'Headmaster';
  if (slug.startsWith('targetmasters-'))                   return 'Targetmaster';
  if (slug.startsWith('powermasters-'))                    return 'Powermaster';
  if (slug.startsWith('pretenders-'))                      return 'Pretender';
  if (slug.startsWith('triple-changers-'))                 return 'Triple Changer';
  if (slug.startsWith('six-changers-'))                    return 'Six Changer';
  if (slug.startsWith('communicators-'))                   return 'Communicator';
  if (slug.startsWith('monsterbots-'))                     return 'Monsterbot';
  if (slug.startsWith('deluxe-vehicles-'))                 return 'Deluxe Vehicle';
  if (slug.startsWith('bases-'))                           return 'Base';
  if (slug.startsWith('action-masters-'))                  return 'Action Master';
  if (slug.startsWith('leaders-'))                         return 'Leader';

  if (slug.startsWith('combiners-pretender-monsters-'))    return 'Pretender Monster';
  if (slug.startsWith('combiners-aerialbots-'))            return 'Aerialbot';
  if (slug.startsWith('combiners-stunticons-'))            return 'Stunticon';
  if (slug.startsWith('combiners-combaticons-'))           return 'Combaticon';
  if (slug.startsWith('combiners-protectobots-'))          return 'Protectobot';
  if (slug.startsWith('combiners-technobots-'))            return 'Technobot';
  if (slug.startsWith('combiners-terrorcons-'))            return 'Terrorcon';
  if (slug.startsWith('combiners-predacons-'))             return 'Predacon';
  if (slug.startsWith('combiners-seacons-'))               return 'Seacon';
  if (slug.startsWith('combiners-constructicons-'))        return 'Constructicon';

  return null;
}

function main(): void {
  const records: CatalogEntry[] = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));

  let set = 0;
  let unmatched = 0;

  for (const record of records) {
    const sg = subgroupFromUrl(record.sourceUrl);
    record.subgroup = sg;
    if (sg !== null) set++;
    else unmatched++;
  }

  fs.writeFileSync(DATA_PATH, JSON.stringify(records, null, 2), 'utf8');
  console.log(`Done: ${set} subgroups set, ${unmatched} unmatched (null).`);
}

main();
