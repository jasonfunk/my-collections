import { useNavigate } from 'react-router-dom';
import type { CollectionItem } from '@my-collections/shared';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AuthenticatedImage } from '@/components/AuthenticatedImage.js';
import { ConditionBadge } from './ConditionBadge.js';
import type { CollectionKey } from '@/lib/collectionConfig';
import {
  STAR_WARS_LINE_LABELS,
  TF_LINE_LABELS,
  MASTERS_LINE_LABELS,
  FACTION_LABELS,
} from '@/lib/collectionConfig';

const COLLECTION_COLORS: Record<CollectionKey, string> = {
  'star-wars': 'bg-yellow-100 text-yellow-700',
  'transformers': 'bg-blue-100 text-blue-700',
  'he-man': 'bg-purple-100 text-purple-700',
};

function getLineLabel(item: CollectionItem & Record<string, unknown>, collectionKey: CollectionKey): string {
  if (collectionKey === 'star-wars' && item.line) {
    return STAR_WARS_LINE_LABELS[item.line as string] ?? String(item.line);
  }
  if (collectionKey === 'transformers') {
    const parts: string[] = [];
    if (item.faction) parts.push(FACTION_LABELS[item.faction as string] ?? String(item.faction));
    if (item.line) parts.push(TF_LINE_LABELS[item.line as string] ?? String(item.line));
    return parts.join(' · ');
  }
  if (collectionKey === 'he-man' && item.line) {
    return MASTERS_LINE_LABELS[item.line as string] ?? String(item.line);
  }
  return '';
}

function formatCurrency(value: number | undefined | null): string {
  if (value == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

interface ItemCardProps {
  item: CollectionItem;
  collectionKey: CollectionKey;
}

export function ItemCard({ item, collectionKey }: ItemCardProps) {
  const navigate = useNavigate();
  const initials = item.name.slice(0, 2).toUpperCase();
  const colorClass = COLLECTION_COLORS[collectionKey];
  const lineLabel = getLineLabel(item as CollectionItem & Record<string, unknown>, collectionKey);
  const hasPhoto = item.photoUrls.length > 0;

  return (
    <Card
      className={`cursor-pointer transition-shadow hover:shadow-md ${!item.isOwned ? 'border-dashed opacity-80' : ''}`}
      onClick={() => navigate(`/collections/${collectionKey}/${item.id}`)}
    >
      {/* Photo / placeholder */}
      <div className={`flex h-32 items-center justify-center rounded-t-lg ${colorClass}`}>
        {hasPhoto ? (
          <AuthenticatedImage
            src={item.photoUrls[0]}
            alt={item.name}
            className="h-full w-full rounded-t-lg object-cover"
            fallback={<span className="text-3xl font-bold opacity-40">{initials}</span>}
          />
        ) : (
          <span className="text-3xl font-bold opacity-40">{initials}</span>
        )}
      </div>

      <CardContent className="p-3">
        <p className="truncate font-medium leading-snug" title={item.name}>{item.name}</p>

        <div className="mt-1 flex flex-wrap items-center gap-1">
          {item.condition && <ConditionBadge grade={item.condition} />}
          {!item.isOwned && (
            <Badge variant="outline" className="text-xs">Wishlist</Badge>
          )}
        </div>

        {lineLabel && (
          <p className="mt-1 truncate text-xs text-muted-foreground">{lineLabel}</p>
        )}

        <p className="mt-1 text-sm font-medium">
          {formatCurrency(item.estimatedValue)}
        </p>
      </CardContent>
    </Card>
  );
}

export function ItemCardSkeleton() {
  return (
    <Card>
      <Skeleton className="h-32 rounded-b-none rounded-t-lg" />
      <CardContent className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-4 w-12" />
      </CardContent>
    </Card>
  );
}
