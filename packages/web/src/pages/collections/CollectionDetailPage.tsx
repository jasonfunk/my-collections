import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type {
  StarWarsFigure,
  G1Transformer,
  MastersOfTheUniverseFigure,
  CollectionItem,
} from '@my-collections/shared';
import { apiClient } from '@/api/client.js';
import { getConfig } from '@/lib/collectionConfig.js';
import {
  STAR_WARS_LINE_LABELS,
  FIGURE_SIZE_LABELS,
  CARDBACK_LABELS,
  FACTION_LABELS,
  TF_LINE_LABELS,
  TF_SIZE_LABELS,
  MASTERS_LINE_LABELS,
  MASTERS_CHARACTER_LABELS,
} from '@/lib/collectionConfig.js';
import { ConditionBadge } from '@/components/collections/ConditionBadge.js';
import { AccessoriesList } from '@/components/collections/AccessoriesList.js';
import { Button } from '@/components/ui/button.js';
import { Badge } from '@/components/ui/badge.js';
import { Separator } from '@/components/ui/separator.js';
import { Skeleton } from '@/components/ui/skeleton.js';
import { ArrowLeftIcon } from 'lucide-react';

function formatCurrency(value: number | undefined | null): string {
  if (value == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === '' || value === '—') return null;
  return (
    <div className="flex gap-2 text-sm">
      <span className="w-36 shrink-0 text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function BoolRow({ label, value }: { label: string; value: boolean | undefined }) {
  if (value === undefined) return null;
  return <DetailRow label={label} value={value ? '✓ Yes' : '✗ No'} />;
}

function StarWarsDetails({ item }: { item: StarWarsFigure }) {
  return (
    <div className="space-y-2">
      <DetailRow label="Line" value={STAR_WARS_LINE_LABELS[item.line] ?? item.line} />
      <DetailRow label="Figure size" value={FIGURE_SIZE_LABELS[item.figureSize] ?? item.figureSize} />
      <BoolRow label="Carded" value={item.isCarded} />
      {item.isCarded && item.cardbackStyle && (
        <DetailRow label="Cardback" value={CARDBACK_LABELS[item.cardbackStyle] ?? item.cardbackStyle} />
      )}
      <BoolRow label="Coin included" value={item.coinIncluded} />
      <DetailRow label="Kenner #" value={item.kennerItemNumber} />
      {item.isVariant && <DetailRow label="Variant" value={item.variantDescription ?? 'Yes'} />}
    </div>
  );
}

function TransformersDetails({ item }: { item: G1Transformer }) {
  return (
    <div className="space-y-2">
      <DetailRow label="Faction" value={
        <Badge variant={item.faction === 'AUTOBOT' ? 'secondary' : 'destructive'}>
          {FACTION_LABELS[item.faction] ?? item.faction}
        </Badge>
      } />
      <DetailRow label="Series" value={TF_LINE_LABELS[item.line] ?? item.line} />
      <DetailRow label="Size class" value={TF_SIZE_LABELS[item.size] ?? item.size} />
      <DetailRow label="Alt mode" value={item.altMode} />
      <BoolRow label="Boxed" value={item.isBoxed} />
      <BoolRow label="Instructions" value={item.hasInstructions} />
      <BoolRow label="Tech spec" value={item.hasTechSpec} />
      <BoolRow label="Rub sign" value={item.rubSign} />
      {item.isCombiner && <DetailRow label="Combiner team" value={item.combinerTeam ?? 'Yes'} />}
      <BoolRow label="Gift set" value={item.isGiftSet} />
      <BoolRow label="Mail-away" value={item.isMailaway} />
      <BoolRow label="Japanese release" value={item.japaneseRelease} />
    </div>
  );
}

function MastersDetails({ item }: { item: MastersOfTheUniverseFigure }) {
  return (
    <div className="space-y-2">
      <DetailRow label="Line" value={MASTERS_LINE_LABELS[item.line] ?? item.line} />
      <DetailRow label="Character type" value={MASTERS_CHARACTER_LABELS[item.characterType] ?? item.characterType} />
      <DetailRow label="Release year" value={item.releaseYear} />
      <BoolRow label="Carded" value={item.isCarded} />
      <BoolRow label="Back card intact" value={item.hasBackCard} />
      <DetailRow label="Mini-comic" value={item.miniComic} />
      {item.hasArmorOrFeature && <DetailRow label="Feature" value={item.featureDescription ?? 'Yes'} />}
      {item.isVariant && <DetailRow label="Variant" value={item.variantDescription ?? 'Yes'} />}
    </div>
  );
}

export function CollectionDetailPage() {
  const { collection, id } = useParams<{ collection: string; id: string }>();
  const navigate = useNavigate();

  const config = collection ? getConfig(collection) : null;

  const { data: item, isPending, isError } = useQuery({
    queryKey: ['collection-item', collection, id],
    queryFn: () => apiClient.get<CollectionItem>(`${config!.apiPath}/${id}`),
    enabled: !!config && !!id,
  });

  if (!config) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Collection not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Top nav */}
      <header className="border-b bg-background px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeftIcon className="mr-1 h-4 w-4" />
            {config.label}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/collections/${collection}/${id}/edit`)}
          >
            Edit
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        {isPending ? (
          <DetailSkeleton />
        ) : isError || !item ? (
          <p className="text-sm text-destructive">Failed to load item. Please go back and try again.</p>
        ) : (
          <DetailContent item={item} collection={collection!} />
        )}
      </main>
    </div>
  );
}

function DetailContent({ item, collection }: { item: CollectionItem; collection: string }) {
  const i = item as CollectionItem & Record<string, unknown>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">{item.name}</h1>
          {!item.isOwned && <Badge variant="outline">Wishlist</Badge>}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {item.condition && <ConditionBadge grade={item.condition} />}
          {item.estimatedValue != null && (
            <span>est. {formatCurrency(item.estimatedValue)}</span>
          )}
          {item.acquisitionPrice != null && (
            <span>· paid {formatCurrency(item.acquisitionPrice)}</span>
          )}
          <span>· {item.isComplete ? 'Complete' : 'Incomplete'}</span>
        </div>
      </div>

      <Separator />

      {/* Collection-specific fields */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Details</h2>
        {collection === 'star-wars' && <StarWarsDetails item={item as StarWarsFigure} />}
        {collection === 'transformers' && <TransformersDetails item={item as G1Transformer} />}
        {collection === 'he-man' && <MastersDetails item={item as MastersOfTheUniverseFigure} />}
      </section>

      {/* Accessories */}
      {(i.accessories as string[] | undefined)?.length ? (
        <>
          <Separator />
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Accessories</h2>
            <AccessoriesList
              accessories={i.accessories as string[]}
              ownedAccessories={i.ownedAccessories as string[] ?? []}
            />
          </section>
        </>
      ) : null}

      {/* Acquisition */}
      {(item.acquisitionSource || item.acquisitionDate) && (
        <>
          <Separator />
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Acquisition</h2>
            <div className="space-y-2">
              <DetailRow label="Source" value={item.acquisitionSource?.replace(/_/g, ' ')} />
              <DetailRow label="Date" value={formatDate(item.acquisitionDate)} />
              <DetailRow label="Price paid" value={formatCurrency(item.acquisitionPrice)} />
            </div>
          </section>
        </>
      )}

      {/* Notes */}
      {item.notes && (
        <>
          <Separator />
          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Notes</h2>
            <p className="text-sm">{item.notes}</p>
          </section>
        </>
      )}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-5 w-48" />
      </div>
      <Skeleton className="h-px w-full" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full max-w-sm" />
        ))}
      </div>
    </div>
  );
}
