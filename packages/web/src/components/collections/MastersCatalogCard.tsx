import { useNavigate } from 'react-router-dom';
import type { MastersCatalogItem, UserMastersItem } from '@my-collections/shared';
import { Card, CardContent } from '@/components/ui/card.js';
import { Badge } from '@/components/ui/badge.js';
import { Skeleton } from '@/components/ui/skeleton.js';
import { ConditionBadge } from './ConditionBadge.js';
import {
  MASTERS_CHARACTER_LABELS,
  WISHLIST_PRIORITY_LABELS,
} from '@/lib/collectionConfig.js';

function formatCurrency(value: number | undefined | null): string {
  if (value == null) return '';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

interface MastersCatalogCardProps {
  catalogItem: MastersCatalogItem;
  userItem?: UserMastersItem;
}

export function MastersCatalogCard({ catalogItem, userItem }: MastersCatalogCardProps) {
  const navigate = useNavigate();
  const initials = catalogItem.name.slice(0, 2).toUpperCase();

  const isOwned = userItem?.isOwned === true;
  const isWishlisted = userItem !== undefined && !userItem.isOwned;
  const isUnclaimed = userItem === undefined;

  const cardClass = isOwned
    ? 'cursor-pointer transition-shadow hover:shadow-md border-2 border-purple-500/70'
    : isWishlisted
      ? 'cursor-pointer transition-shadow hover:shadow-md border-dashed'
      : 'cursor-pointer transition-shadow hover:shadow-md opacity-60';

  return (
    <Card
      className={cardClass}
      onClick={() => navigate(`/collections/he-man/${catalogItem.id}`)}
    >
      {/* Photo / placeholder */}
      <div className="flex h-32 items-center justify-center rounded-t-lg bg-purple-500/10 text-purple-300 overflow-hidden">
        {catalogItem.catalogImageUrl ? (
          <img
            src={catalogItem.catalogImageUrl}
            alt={catalogItem.name}
            className="h-full w-full rounded-t-lg object-cover object-top"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="text-3xl font-bold opacity-40">{initials}</span>
        )}
      </div>

      <CardContent className="p-3">
        <p className="truncate font-medium leading-snug" title={catalogItem.name}>
          {catalogItem.name}
        </p>

        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {catalogItem.characterType
            ? (MASTERS_CHARACTER_LABELS[catalogItem.characterType] ?? catalogItem.characterType)
            : 'Item'}
        </p>

        <div className="mt-1 flex flex-wrap items-center gap-1">
          {isOwned && (
            <>
              <Badge variant="default" className="text-xs bg-purple-500/20 hover:bg-purple-500/20 text-purple-300 border border-purple-500/50">Owned</Badge>
              {userItem!.condition && <ConditionBadge grade={userItem!.condition} />}
            </>
          )}
          {isWishlisted && (
            <>
              <Badge variant="outline" className="text-xs border-amber-500/60 text-amber-400">Wishlist</Badge>
              {userItem!.wishlistPriority && (
                <Badge variant="outline" className="text-xs">
                  {WISHLIST_PRIORITY_LABELS[userItem!.wishlistPriority]}
                </Badge>
              )}
            </>
          )}
          {isUnclaimed && (
            <span className="text-xs text-muted-foreground">Unclaimed</span>
          )}
        </div>

        {isOwned && userItem!.estimatedValue != null && (
          <p className="mt-1 text-sm font-medium">{formatCurrency(userItem!.estimatedValue)}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function MastersCatalogCardSkeleton() {
  return (
    <Card>
      <Skeleton className="h-32 rounded-b-none rounded-t-lg" />
      <CardContent className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-5 w-16" />
      </CardContent>
    </Card>
  );
}
