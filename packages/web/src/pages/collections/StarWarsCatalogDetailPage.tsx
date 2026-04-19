import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { StarWarsCatalogItem, UserStarWarsItem, PaginatedResponse } from '@my-collections/shared';
import { apiClient } from '@/api/client.js';
import {
  MAX_USER_ITEMS_FETCH,
  STAR_WARS_CATEGORY_LABELS,
  STAR_WARS_LINE_LABELS,
  FIGURE_SIZE_LABELS,
  CARDBACK_LABELS,
  WISHLIST_PRIORITY_LABELS,
  ACQUISITION_SOURCE_LABELS,
} from '@/lib/collectionConfig.js';
import { StarWarsClaimDialog } from '@/components/collections/StarWarsClaimDialog.js';
import { AccessoriesList } from '@/components/collections/AccessoriesList.js';
import { ConditionBadge } from '@/components/collections/ConditionBadge.js';
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

export function StarWarsCatalogDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: catalogItem, isPending: catalogPending, isError: catalogError } = useQuery({
    queryKey: ['sw-catalog-item', id],
    queryFn: () => apiClient.get<StarWarsCatalogItem>(`/collections/star-wars/catalog/${id}`),
    enabled: !!id,
  });

  // Fetch user items and find the one for this catalog entry
  const { data: userItemsPage, isPending: userItemsPending } = useQuery({
    queryKey: ['sw-user-items'],
    queryFn: () => apiClient.get<PaginatedResponse<UserStarWarsItem>>(`/collections/star-wars/items?limit=${MAX_USER_ITEMS_FETCH}`),
  });
  const userItem = userItemsPage?.data.find((i) => i.catalogId === id);

  const deleteMutation = useMutation({
    mutationFn: () => apiClient.delete(`/collections/star-wars/items/${userItem!.id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['sw-user-items'] });
      setConfirmDelete(false);
    },
  });

  if (catalogPending) {
    return (
      <div className="min-h-screen bg-muted/40">
        <header className="border-b bg-background px-6 py-4">
          <div className="mx-auto max-w-3xl">
            <Skeleton className="h-8 w-32" />
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-6 py-8 space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-px w-full" />
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-4 w-full max-w-sm" />)}
        </main>
      </div>
    );
  }

  if (catalogError || !catalogItem) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Item not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b bg-background px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/collections/star-wars')}>
            <ArrowLeftIcon className="mr-1 h-4 w-4" />
            Star Wars
          </Button>
          <div className="flex gap-2">
            {userItem && (
              <Button variant="outline" size="sm" onClick={() => setClaimDialogOpen(true)}>
                Edit
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8 space-y-6">
        {/* Title */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">{catalogItem.name}</h1>
            {catalogItem.isVariant && (
              <Badge variant="secondary">Variant</Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {STAR_WARS_CATEGORY_LABELS[catalogItem.category] ?? catalogItem.category}
            {catalogItem.line && ` · ${STAR_WARS_LINE_LABELS[catalogItem.line] ?? catalogItem.line}`}
          </p>
        </div>

        {/* Catalog image */}
        {catalogItem.catalogImageUrl && (
          <img
            src={catalogItem.catalogImageUrl}
            alt={catalogItem.name}
            className="max-h-64 rounded-lg object-contain"
          />
        )}

        <Separator />

        {/* Catalog details */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Catalog Info
          </h2>
          <div className="space-y-2">
            {catalogItem.figureSize && (
              <DetailRow label="Figure size" value={FIGURE_SIZE_LABELS[catalogItem.figureSize] ?? catalogItem.figureSize} />
            )}
            {catalogItem.cardbackStyle && (
              <DetailRow label="Cardback" value={CARDBACK_LABELS[catalogItem.cardbackStyle] ?? catalogItem.cardbackStyle} />
            )}
            {catalogItem.kennerItemNumber && (
              <DetailRow label="Kenner #" value={catalogItem.kennerItemNumber} />
            )}
            <BoolRow label="Coin included" value={catalogItem.coinIncluded} />
            {catalogItem.isVariant && catalogItem.variantDescription && (
              <DetailRow label="Variant" value={catalogItem.variantDescription} />
            )}
            {catalogItem.features && catalogItem.features.length > 0 && (
              <DetailRow label="Features" value={catalogItem.features.join(', ')} />
            )}
          </div>
        </section>

        {/* Expected accessories */}
        {catalogItem.accessories.length > 0 && (
          <>
            <Separator />
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Expected Accessories
              </h2>
              <AccessoriesList
                accessories={catalogItem.accessories}
                ownedAccessories={userItem?.ownedAccessories ?? []}
              />
            </section>
          </>
        )}

        <Separator />

        {/* User record */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Your Record
          </h2>

          {userItemsPending ? (
            <div className="space-y-2">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-36" />
            </div>
          ) : userItem ? (
            <div className="space-y-4">
              {/* Ownership status */}
              <div className="flex flex-wrap items-center gap-2">
                {userItem.isOwned ? (
                  <Badge className="bg-green-600 hover:bg-green-600">Owned</Badge>
                ) : (
                  <>
                    <Badge variant="outline" className="border-yellow-500 text-yellow-700">Wishlist</Badge>
                    {userItem.wishlistPriority && (
                      <Badge variant="outline">
                        {WISHLIST_PRIORITY_LABELS[userItem.wishlistPriority]} priority
                      </Badge>
                    )}
                  </>
                )}
              </div>

              {userItem.isOwned && (
                <div className="space-y-2">
                  {userItem.condition && <ConditionBadge grade={userItem.condition} />}
                  <DetailRow label="Complete" value={userItem.isComplete ? '✓ Yes' : '✗ No'} />
                  <BoolRow label="Carded" value={userItem.isCarded} />
                  <BoolRow label="Boxed" value={userItem.isBoxed} />
                  {userItem.estimatedValue != null && (
                    <DetailRow label="Est. value" value={formatCurrency(userItem.estimatedValue)} />
                  )}
                  {userItem.acquisitionSource && (
                    <DetailRow label="Source" value={ACQUISITION_SOURCE_LABELS[userItem.acquisitionSource] ?? userItem.acquisitionSource} />
                  )}
                  {userItem.acquisitionDate && (
                    <DetailRow label="Acquired" value={formatDate(userItem.acquisitionDate)} />
                  )}
                  {userItem.acquisitionPrice != null && (
                    <DetailRow label="Price paid" value={formatCurrency(userItem.acquisitionPrice)} />
                  )}
                </div>
              )}

              {userItem.notes && (
                <p className="text-sm">{userItem.notes}</p>
              )}

              {/* Delete */}
              {confirmDelete ? (
                <div className="flex items-center gap-3">
                  <p className="text-sm text-destructive">Remove this from your collection?</p>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={deleteMutation.isPending}
                    onClick={() => deleteMutation.mutate()}
                  >
                    {deleteMutation.isPending ? 'Removing…' : 'Yes, remove'}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setConfirmDelete(true)}
                >
                  Remove from collection
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                You have not claimed this item yet.
              </p>
              <div className="flex gap-3">
                <Button onClick={() => setClaimDialogOpen(true)}>
                  Mark as Owned
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setClaimDialogOpen(true)}
                >
                  Add to Wishlist
                </Button>
              </div>
            </div>
          )}
        </section>
      </main>

      <StarWarsClaimDialog
        key={`${catalogItem.id}-${userItem?.id ?? 'new'}`}
        catalogItem={catalogItem}
        existing={userItem}
        open={claimDialogOpen}
        onOpenChange={setClaimDialogOpen}
        onSuccess={() => {}}
      />
    </div>
  );
}
