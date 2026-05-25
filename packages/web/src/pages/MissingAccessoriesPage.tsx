import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { pdf } from '@react-pdf/renderer';
import type {
  PaginatedResponse,
  UserStarWarsItem,
  UserG1TransformersItem,
  UserMastersItem,
} from '@my-collections/shared';
import { apiClient } from '../api/client.js';
import { Button } from '../components/ui/button.js';
import { Skeleton } from '../components/ui/skeleton.js';
import { ConditionBadge } from '../components/collections/ConditionBadge.js';
import { MissingAccessoriesPdfDocument } from '../components/collections/MissingAccessoriesPdfDocument.js';
import guidanceText from '../assets/missing-accessories-guidance.md?raw';
import {
  COLLECTION_CONFIG,
  MAX_USER_ITEMS_FETCH,
  STAR_WARS_LINE_LABELS,
  STAR_WARS_CATEGORY_LABELS,
  FACTION_LABELS,
  TF_LINE_LABELS,
  MASTERS_LINE_LABELS,
  MASTERS_CHARACTER_LABELS,
} from '../lib/collectionConfig.js';
import { DownloadIcon } from 'lucide-react';

// ── Accessory diff ────────────────────────────────────────────────────────────

function getMissing(catalogAcc: string[], ownedAcc: string[]): string[] {
  return catalogAcc.filter(a => !ownedAcc.includes(a));
}

function hasMissingAccessories(
  item: { isOwned: boolean; catalog?: { accessories: string[] } | null; ownedAccessories: string[] },
): boolean {
  if (!item.isOwned) return false;
  const acc = item.catalog?.accessories ?? [];
  if (acc.length === 0) return false;
  return acc.some(a => !item.ownedAccessories.includes(a));
}

// ── Section skeleton ──────────────────────────────────────────────────────────

function SectionSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-lg border bg-background px-4 py-3 space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-72" />
          <Skeleton className="h-3 w-56" />
        </div>
      ))}
    </div>
  );
}

// ── Accessory chips ───────────────────────────────────────────────────────────

function AccessoryChips({ label, items, variant }: { label: string; items: string[]; variant: 'missing' | 'have' }) {
  if (items.length === 0) return null;
  const chipClass = variant === 'missing'
    ? 'bg-amber-100 text-amber-800 border border-amber-200'
    : 'bg-green-50 text-green-700 border border-green-200';
  const labelClass = variant === 'missing' ? 'text-amber-700' : 'text-green-700';

  return (
    <div className="flex flex-wrap items-baseline gap-1.5 mt-1">
      <span className={`text-xs font-semibold shrink-0 ${labelClass}`}>{label}:</span>
      {items.map((acc) => (
        <span key={acc} className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs ${chipClass}`}>
          {acc}
        </span>
      ))}
    </div>
  );
}

// ── Individual item row ───────────────────────────────────────────────────────

interface ItemRowProps {
  name: string;
  meta: string;
  catalogAccessories: string[];
  ownedAccessories: string[];
  condition?: string;
  notes?: string | null;
  href: string;
  onNavigate: (href: string) => void;
}

function ItemRow({ name, meta, catalogAccessories, ownedAccessories, condition, notes, href, onNavigate }: ItemRowProps) {
  const missing = getMissing(catalogAccessories, ownedAccessories);
  const have = ownedAccessories.filter(a => catalogAccessories.includes(a));

  return (
    <div className="rounded-lg border bg-background px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <button
            className="text-left text-sm font-medium hover:underline truncate block"
            onClick={() => onNavigate(href)}
          >
            {name}
          </button>
          {meta && <p className="text-xs text-muted-foreground mt-0.5">{meta}</p>}
          <AccessoryChips label="Missing" items={missing} variant="missing" />
          <AccessoryChips label="Have" items={have} variant="have" />
          {notes && (
            <p className="text-xs text-muted-foreground italic mt-1.5">{notes}</p>
          )}
        </div>
        {condition && <ConditionBadge grade={condition} className="shrink-0 mt-0.5" />}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function MissingAccessoriesPage() {
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [exportError, setExportError] = useState(false);

  const swQuery = useQuery({
    queryKey: ['sw-items-all'],
    queryFn: () =>
      apiClient.get<PaginatedResponse<UserStarWarsItem>>(
        `/collections/star-wars/items?limit=${MAX_USER_ITEMS_FETCH}&page=1`,
      ),
  });

  const tfQuery = useQuery({
    queryKey: ['tf-items-all'],
    queryFn: () =>
      apiClient.get<PaginatedResponse<UserG1TransformersItem>>(
        `/collections/transformers/items?limit=${MAX_USER_ITEMS_FETCH}&page=1`,
      ),
  });

  const hmQuery = useQuery({
    queryKey: ['heman-items-all'],
    queryFn: () =>
      apiClient.get<PaginatedResponse<UserMastersItem>>(
        `/collections/he-man/items?limit=${MAX_USER_ITEMS_FETCH}&page=1`,
      ),
  });

  const swMissing = (swQuery.data?.data ?? []).filter(hasMissingAccessories);
  const tfMissing = (tfQuery.data?.data ?? []).filter(hasMissingAccessories);
  const hmMissing = (hmQuery.data?.data ?? []).filter(hasMissingAccessories);
  const totalMissing = swMissing.length + tfMissing.length + hmMissing.length;

  const isLoading = swQuery.isPending || tfQuery.isPending || hmQuery.isPending;
  const isError   = swQuery.isError   || tfQuery.isError   || hmQuery.isError;

  async function handleDownloadPdf() {
    setIsGenerating(true);
    setExportError(false);
    try {
      const [swData, tfData, hmData] = await Promise.all([
        swQuery.data
          ? Promise.resolve(swQuery.data)
          : apiClient.get<PaginatedResponse<UserStarWarsItem>>(
              `/collections/star-wars/items?limit=${MAX_USER_ITEMS_FETCH}&page=1`,
            ),
        tfQuery.data
          ? Promise.resolve(tfQuery.data)
          : apiClient.get<PaginatedResponse<UserG1TransformersItem>>(
              `/collections/transformers/items?limit=${MAX_USER_ITEMS_FETCH}&page=1`,
            ),
        hmQuery.data
          ? Promise.resolve(hmQuery.data)
          : apiClient.get<PaginatedResponse<UserMastersItem>>(
              `/collections/he-man/items?limit=${MAX_USER_ITEMS_FETCH}&page=1`,
            ),
      ]);

      const generatedDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const filename = `missing-accessories-${dateStamp}.pdf`;

      const blob = await pdf(
        <MissingAccessoriesPdfDocument
          swItems={swData.data.filter(hasMissingAccessories)}
          tfItems={tfData.data.filter(hasMissingAccessories)}
          hemanItems={hmData.data.filter(hasMissingAccessories)}
          guidanceMarkdown={guidanceText}
          generatedDate={generatedDate}
        />,
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setExportError(true);
    } finally {
      setIsGenerating(false);
    }
  }

  const swConfig    = COLLECTION_CONFIG['star-wars'];
  const tfConfig    = COLLECTION_CONFIG['transformers'];
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
            <h1 className="text-xl font-semibold tracking-tight">Missing Accessories</h1>
            {!isLoading && totalMissing > 0 && (
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-sm font-medium text-muted-foreground">
                {totalMissing}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {exportError && (
              <span className="text-xs text-destructive">PDF generation failed</span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPdf}
              disabled={isGenerating || isLoading || totalMissing === 0}
            >
              <DownloadIcon className="mr-1.5 h-4 w-4" />
              {isGenerating ? 'Generating…' : 'Download PDF'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-5xl px-6 py-8 space-y-8">

        {isError && (
          <p className="text-sm text-destructive">Failed to load collection data. Please refresh.</p>
        )}

        {!isLoading && !isError && totalMissing === 0 && (
          <div className="rounded-lg border bg-background px-6 py-12 text-center">
            <p className="text-sm font-medium">All your owned items have their accessories accounted for.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Items without catalog accessories defined are excluded from this list.
            </p>
          </div>
        )}

        {/* Star Wars section */}
        {(isLoading || swMissing.length > 0) && (
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
              {swConfig.emoji} {swConfig.label}
              {!isLoading && swMissing.length > 0 && (
                <span className="text-sm font-normal text-muted-foreground">({swMissing.length})</span>
              )}
            </h2>
            {isLoading ? (
              <SectionSkeleton />
            ) : swMissing.length === 0 ? null : (
              <div className="space-y-2">
                {swMissing.map((item) => {
                  const cat = item.catalog;
                  const metaParts: string[] = [];
                  if (cat?.releaseYear) metaParts.push(String(cat.releaseYear));
                  if (cat?.line) metaParts.push(STAR_WARS_LINE_LABELS[cat.line] ?? cat.line);
                  if (cat?.category) metaParts.push(STAR_WARS_CATEGORY_LABELS[cat.category] ?? cat.category);
                  return (
                    <ItemRow
                      key={item.id}
                      name={cat?.name ?? 'Unknown'}
                      meta={metaParts.join(' · ')}
                      catalogAccessories={cat?.accessories ?? []}
                      ownedAccessories={item.ownedAccessories}
                      condition={item.condition}
                      notes={item.notes}
                      href={`/collections/star-wars/${item.catalogId}`}
                      onNavigate={navigate}
                    />
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Transformers section */}
        {(isLoading || tfMissing.length > 0) && (
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
              {tfConfig.emoji} {tfConfig.label}
              {!isLoading && tfMissing.length > 0 && (
                <span className="text-sm font-normal text-muted-foreground">({tfMissing.length})</span>
              )}
            </h2>
            {isLoading ? (
              <SectionSkeleton />
            ) : tfMissing.length === 0 ? null : (
              <div className="space-y-2">
                {tfMissing.map((item) => {
                  const cat = item.catalog;
                  const metaParts: string[] = [];
                  if (cat?.releaseYear) metaParts.push(String(cat.releaseYear));
                  if (cat?.faction) metaParts.push(FACTION_LABELS[cat.faction] ?? cat.faction);
                  if (cat?.line) metaParts.push(TF_LINE_LABELS[cat.line] ?? cat.line);
                  if (cat?.altMode) metaParts.push(cat.altMode);
                  return (
                    <ItemRow
                      key={item.id}
                      name={cat?.name ?? 'Unknown'}
                      meta={metaParts.join(' · ')}
                      catalogAccessories={cat?.accessories ?? []}
                      ownedAccessories={item.ownedAccessories}
                      condition={item.condition}
                      notes={item.notes}
                      href={`/collections/transformers/${item.catalogId}`}
                      onNavigate={navigate}
                    />
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* He-Man section */}
        {(isLoading || hmMissing.length > 0) && (
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
              {hemanConfig.emoji} {hemanConfig.label}
              {!isLoading && hmMissing.length > 0 && (
                <span className="text-sm font-normal text-muted-foreground">({hmMissing.length})</span>
              )}
            </h2>
            {isLoading ? (
              <SectionSkeleton />
            ) : hmMissing.length === 0 ? null : (
              <div className="space-y-2">
                {hmMissing.map((item) => {
                  const cat = item.catalog;
                  const metaParts: string[] = [];
                  if (cat?.releaseYear) metaParts.push(String(cat.releaseYear));
                  if (cat?.line) metaParts.push(MASTERS_LINE_LABELS[cat.line] ?? cat.line);
                  if (cat?.characterType) metaParts.push(MASTERS_CHARACTER_LABELS[cat.characterType] ?? cat.characterType);
                  return (
                    <ItemRow
                      key={item.id}
                      name={cat?.name ?? 'Unknown'}
                      meta={metaParts.join(' · ')}
                      catalogAccessories={cat?.accessories ?? []}
                      ownedAccessories={item.ownedAccessories}
                      condition={item.condition}
                      notes={item.notes}
                      href={`/collections/he-man/${item.catalogId}`}
                      onNavigate={navigate}
                    />
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
