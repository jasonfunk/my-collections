import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type {
  PaginatedResponse,
  UserStarWarsItem,
  UserG1TransformersItem,
  UserMastersItem,
} from '@my-collections/shared';
import { WishlistPriority } from '@my-collections/shared';
import { apiClient } from '../api/client.js';
import { Button } from '../components/ui/button.js';
import { Skeleton } from '../components/ui/skeleton.js';
import { MarkAcquiredDialog } from '../components/collections/MarkAcquiredDialog.js';
import {
  COLLECTION_CONFIG,
  WISHLIST_PAGE_SIZE,
  WISHLIST_PRIORITY_LABELS,
  STAR_WARS_CATEGORY_LABELS,
} from '../lib/collectionConfig.js';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

// ── Priority badge ────────────────────────────────────────────────────────────

const PRIORITY_STYLES: Record<WishlistPriority, string> = {
  [WishlistPriority.HIGH]: 'bg-red-100 text-red-700 border border-red-200',
  [WishlistPriority.MEDIUM]: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  [WishlistPriority.LOW]: 'bg-gray-100 text-gray-600 border border-gray-200',
};

function PriorityBadge({ priority }: { priority: WishlistPriority | null | undefined }) {
  if (!priority) return null;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${PRIORITY_STYLES[priority]}`}>
      {WISHLIST_PRIORITY_LABELS[priority]}
    </span>
  );
}

// ── Dialog state ──────────────────────────────────────────────────────────────

interface AcquiringState {
  itemId: string;
  itemName: string;
  collectionPath: string;
  queryKeys: unknown[][];
}

// ── Section skeletons ─────────────────────────────────────────────────────────

function SectionSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between rounded-lg border bg-background px-4 py-3">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-8 w-28" />
        </div>
      ))}
    </div>
  );
}

// ── Pagination controls ───────────────────────────────────────────────────────

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  isPlaceholderData: boolean;
  onPrev: () => void;
  onNext: () => void;
}

function PaginationControls({ page, totalPages, isPlaceholderData, onPrev, onNext }: PaginationControlsProps) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-3 pt-2">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={onPrev}>
        <ChevronLeftIcon className="h-4 w-4" /> Prev
      </Button>
      <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
      <Button variant="outline" size="sm" disabled={isPlaceholderData || page >= totalPages} onClick={onNext}>
        Next <ChevronRightIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function WishlistPage() {
  const navigate = useNavigate();
  const [acquiring, setAcquiring] = useState<AcquiringState | null>(null);

  const [swPage, setSwPage] = useState(1);
  const [tfPage, setTfPage] = useState(1);
  const [hemanPage, setHemanPage] = useState(1);

  const swQuery = useQuery({
    queryKey: ['sw-wishlist', swPage],
    queryFn: () =>
      apiClient.get<PaginatedResponse<UserStarWarsItem>>(
        `/collections/star-wars/wishlist?limit=${WISHLIST_PAGE_SIZE}&page=${swPage}`,
      ),
    placeholderData: keepPreviousData,
  });

  const tfQuery = useQuery({
    queryKey: ['tf-wishlist', tfPage],
    queryFn: () =>
      apiClient.get<PaginatedResponse<UserG1TransformersItem>>(
        `/collections/transformers/wishlist?limit=${WISHLIST_PAGE_SIZE}&page=${tfPage}`,
      ),
    placeholderData: keepPreviousData,
  });

  const hemanQuery = useQuery({
    queryKey: ['heman-wishlist', hemanPage],
    queryFn: () =>
      apiClient.get<PaginatedResponse<UserMastersItem>>(
        `/collections/he-man/wishlist?limit=${WISHLIST_PAGE_SIZE}&page=${hemanPage}`,
      ),
    placeholderData: keepPreviousData,
  });

  const totalWishlist =
    (swQuery.data?.meta.total ?? 0) +
    (tfQuery.data?.meta.total ?? 0) +
    (hemanQuery.data?.meta.total ?? 0);

  const swConfig = COLLECTION_CONFIG['star-wars'];
  const tfConfig = COLLECTION_CONFIG['transformers'];
  const hemanConfig = COLLECTION_CONFIG['he-man'];

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Header */}
      <header className="border-b bg-background px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              ← Dashboard
            </Button>
            <h1 className="text-xl font-semibold tracking-tight">Wishlist</h1>
            {totalWishlist > 0 && (
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-sm font-medium text-muted-foreground">
                {totalWishlist}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-5xl px-6 py-8 space-y-8">

        {/* Star Wars section */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            {swConfig.emoji} {swConfig.label}
            {swQuery.data && swQuery.data.meta.total > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                ({swQuery.data.meta.total})
              </span>
            )}
          </h2>
          {swQuery.isPending ? (
            <SectionSkeleton />
          ) : swQuery.isError ? (
            <p className="text-sm text-destructive">Failed to load Star Wars wishlist.</p>
          ) : swQuery.data.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">No Star Wars wishlist items.</p>
          ) : (
            <div className="space-y-2">
              {swQuery.data.data.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border bg-background px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <button
                      className="text-left text-sm font-medium hover:underline truncate block"
                      onClick={() => navigate(`/collections/star-wars/${item.catalogId}`)}
                    >
                      {item.catalog?.name ?? 'Unknown item'}
                    </button>
                    <div className="mt-1 flex items-center gap-2 flex-wrap">
                      {item.catalog?.category && (
                        <span className="text-xs text-muted-foreground">
                          {STAR_WARS_CATEGORY_LABELS[item.catalog.category] ?? item.catalog.category}
                        </span>
                      )}
                      <PriorityBadge priority={item.wishlistPriority} />
                      {item.estimatedValue != null && (
                        <span className="text-xs text-muted-foreground">
                          est. ${item.estimatedValue.toFixed(0)}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-4 shrink-0"
                    onClick={() =>
                      setAcquiring({
                        itemId: item.id,
                        itemName: item.catalog?.name ?? 'Item',
                        collectionPath: '/collections/star-wars',
                        queryKeys: [['sw-wishlist', swPage], ['sw-user-items'], ['collection-stats']],
                      })
                    }
                  >
                    Mark as Acquired
                  </Button>
                </div>
              ))}
            </div>
          )}
          <PaginationControls
            page={swPage}
            totalPages={swQuery.data?.meta.totalPages ?? 1}
            isPlaceholderData={swQuery.isPlaceholderData}
            onPrev={() => setSwPage((p) => p - 1)}
            onNext={() => setSwPage((p) => p + 1)}
          />
        </section>

        {/* Transformers section */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            {tfConfig.emoji} {tfConfig.label}
            {tfQuery.data && tfQuery.data.meta.total > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                ({tfQuery.data.meta.total})
              </span>
            )}
          </h2>
          {tfQuery.isPending ? (
            <SectionSkeleton />
          ) : tfQuery.isError ? (
            <p className="text-sm text-destructive">Failed to load Transformers wishlist.</p>
          ) : tfQuery.data.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">No Transformers wishlist items.</p>
          ) : (
            <div className="space-y-2">
              {tfQuery.data.data.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border bg-background px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <button
                      className="text-left text-sm font-medium hover:underline truncate block"
                      onClick={() => navigate(`/collections/transformers/${item.catalogId}`)}
                    >
                      {item.catalog?.name ?? 'Unknown item'}
                    </button>
                    <PriorityBadge priority={item.wishlistPriority} />
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-4 shrink-0"
                    onClick={() =>
                      setAcquiring({
                        itemId: item.id,
                        itemName: item.catalog?.name ?? 'Item',
                        collectionPath: '/collections/transformers',
                        queryKeys: [['tf-wishlist', tfPage], ['collection-stats']],
                      })
                    }
                  >
                    Mark as Acquired
                  </Button>
                </div>
              ))}
            </div>
          )}
          <PaginationControls
            page={tfPage}
            totalPages={tfQuery.data?.meta.totalPages ?? 1}
            isPlaceholderData={tfQuery.isPlaceholderData}
            onPrev={() => setTfPage((p) => p - 1)}
            onNext={() => setTfPage((p) => p + 1)}
          />
        </section>

        {/* He-Man section */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            {hemanConfig.emoji} {hemanConfig.label}
            {hemanQuery.data && hemanQuery.data.meta.total > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                ({hemanQuery.data.meta.total})
              </span>
            )}
          </h2>
          {hemanQuery.isPending ? (
            <SectionSkeleton />
          ) : hemanQuery.isError ? (
            <p className="text-sm text-destructive">Failed to load He-Man wishlist.</p>
          ) : hemanQuery.data.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">No He-Man wishlist items.</p>
          ) : (
            <div className="space-y-2">
              {hemanQuery.data.data.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border bg-background px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <button
                      className="text-left text-sm font-medium hover:underline truncate block"
                      onClick={() => navigate(`/collections/he-man/${item.catalogId}`)}
                    >
                      {item.catalog?.name ?? 'Unknown item'}
                    </button>
                    <PriorityBadge priority={item.wishlistPriority} />
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-4 shrink-0"
                    onClick={() =>
                      setAcquiring({
                        itemId: item.id,
                        itemName: item.catalog?.name ?? 'Item',
                        collectionPath: '/collections/he-man',
                        queryKeys: [['heman-wishlist', hemanPage], ['collection-stats']],
                      })
                    }
                  >
                    Mark as Acquired
                  </Button>
                </div>
              ))}
            </div>
          )}
          <PaginationControls
            page={hemanPage}
            totalPages={hemanQuery.data?.meta.totalPages ?? 1}
            isPlaceholderData={hemanQuery.isPlaceholderData}
            onPrev={() => setHemanPage((p) => p - 1)}
            onNext={() => setHemanPage((p) => p + 1)}
          />
        </section>
      </main>

      {/* Single shared dialog instance */}
      {acquiring && (
        <MarkAcquiredDialog
          itemId={acquiring.itemId}
          itemName={acquiring.itemName}
          collectionPath={acquiring.collectionPath}
          queryKeysToInvalidate={acquiring.queryKeys}
          open={true}
          onOpenChange={(open) => { if (!open) setAcquiring(null); }}
          onSuccess={() => setAcquiring(null)}
        />
      )}
    </div>
  );
}
