import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { G1TransformersCatalogItem, UserG1TransformersItem, PaginatedResponse } from '@my-collections/shared';
import { apiClient } from '@/api/client.js';
import {
  MAX_USER_ITEMS_FETCH,
  FACTION_LABELS,
  TF_LINE_LABELS,
  TF_SIZE_LABELS,
  WISHLIST_PRIORITY_LABELS,
  ACQUISITION_SOURCE_LABELS,
} from '@/lib/collectionConfig.js';
import { TransformersClaimDialog } from '@/components/collections/TransformersClaimDialog.js';
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

function BoolRow({ label, value }: { label: string; value: boolean | undefined | null }) {
  if (value === undefined || value === null) return null;
  return <DetailRow label={label} value={value ? '✓ Yes' : '✗ No'} />;
}

export function TransformersCatalogDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: catalogItem, isPending: catalogPending, isError: catalogError } = useQuery({
    queryKey: ['tf-catalog-item', id],
    queryFn: () => apiClient.get<G1TransformersCatalogItem>(`/collections/transformers/catalog/${id}`),
    enabled: !!id,
  });

  const { data: userItemsPage, isPending: userItemsPending } = useQuery({
    queryKey: ['tf-user-items'],
    queryFn: () => apiClient.get<PaginatedResponse<UserG1TransformersItem>>(`/collections/transformers/items?limit=${MAX_USER_ITEMS_FETCH}`),
  });
  const userItem = userItemsPage?.data.find((i) => i.catalogId === id);

  const deleteMutation = useMutation({
    mutationFn: () => apiClient.delete(`/collections/transformers/items/${userItem!.id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tf-user-items'] });
      setConfirmDelete(false);
    },
  });

  if (catalogPending) {
    return (
      <div className="min-h-screen bg-muted/40">
        <header className="border-b bg-background px-6 py-4">
          <div className="mx-auto max-w-5xl">
            <Skeleton className="h-8 w-32" />
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-[2fr_3fr]">
            <div className="space-y-4">
              <Skeleton className="h-64 w-full rounded-lg" />
              <Skeleton className="h-40 w-full rounded-lg" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-px w-full" />
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-4 w-full max-w-sm" />)}
            </div>
          </div>
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
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/collections/transformers')}>
            <ArrowLeftIcon className="mr-1 h-4 w-4" />
            Transformers
          </Button>
          {userItem && (
            <Button variant="outline" size="sm" onClick={() => setClaimDialogOpen(true)}>
              Edit
            </Button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8 space-y-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[2fr_3fr]">

          {/* LEFT — image + your record */}
          <div className="space-y-4">
            {catalogItem.catalogImageUrl && (
              <div className="overflow-hidden rounded-lg border bg-muted/20">
                <img
                  src={catalogItem.catalogImageUrl}
                  alt={catalogItem.name}
                  className="w-full object-cover object-top"
                  style={{ maxHeight: 320 }}
                  loading="lazy"
                />
              </div>
            )}

            <div className="rounded-lg border p-4 space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your Record</h2>

              {userItemsPending ? (
                <div className="space-y-2">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-36" />
                </div>
              ) : userItem ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {userItem.isOwned ? (
                      <Badge className="bg-red-600 hover:bg-red-600">Owned</Badge>
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
                      <BoolRow label="Boxed" value={userItem.isBoxed} />
                      <BoolRow label="Instructions" value={userItem.hasInstructions} />
                      <BoolRow label="Tech spec" value={userItem.hasTechSpec} />
                      <BoolRow label="Rub sign" value={userItem.rubSign} />
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
                    <p className="text-sm text-muted-foreground">{userItem.notes}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    You have not claimed this item yet.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => setClaimDialogOpen(true)}>
                      Mark as Owned
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setClaimDialogOpen(true)}>
                      Add to Wishlist
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT — title + catalog info + accessories */}
          <div className="space-y-5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold">{catalogItem.name}</h1>
                {catalogItem.isVariant && <Badge variant="secondary">Variant</Badge>}
                {catalogItem.isCombiner && <Badge variant="secondary">Combiner</Badge>}
                {catalogItem.isGiftSet && <Badge variant="secondary">Gift Set</Badge>}
                {catalogItem.isMailaway && <Badge variant="secondary">Mail-Away</Badge>}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {catalogItem.faction ? (FACTION_LABELS[catalogItem.faction] ?? catalogItem.faction) : 'Unknown'}
                {catalogItem.line && ` · ${TF_LINE_LABELS[catalogItem.line] ?? catalogItem.line}`}
                {catalogItem.size && ` · ${TF_SIZE_LABELS[catalogItem.size] ?? catalogItem.size}`}
              </p>
            </div>

            <Separator />

            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Catalog Info
              </h2>
              <div className="space-y-2">
                {catalogItem.releaseYear && (
                  <DetailRow label="Year" value={catalogItem.releaseYear} />
                )}
                {catalogItem.altMode && (
                  <DetailRow label="Alt mode" value={catalogItem.altMode} />
                )}
                {catalogItem.combinerTeam && (
                  <DetailRow label="Combiner team" value={catalogItem.combinerTeam} />
                )}
                {catalogItem.isVariant && catalogItem.variantDescription && (
                  <DetailRow label="Variant" value={catalogItem.variantDescription} />
                )}
                {catalogItem.japaneseRelease && (
                  <DetailRow label="Japanese release" value="✓ Yes" />
                )}
              </div>
            </section>

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
          </div>
        </div>

        {userItem && (
          <div className="flex justify-end border-t pt-4">
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
        )}
      </main>

      <TransformersClaimDialog
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
