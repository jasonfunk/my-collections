import { useEffect, useState } from 'react';
import { LayoutGridIcon, ListIcon } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import type { CollectionConfig } from '@/lib/collectionConfig';
import { ACQUISITION_SOURCE_OPTIONS, CONDITION_OPTIONS } from '@/lib/collectionConfig';

export type ViewMode = 'grid' | 'table';
export type OwnedFilter = 'all' | 'owned' | 'wishlist';

interface FilterBarProps {
  config: CollectionConfig;
  totalCount: number | undefined;
}

export function FilterBar({ config, totalCount }: FilterBarProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const view = (searchParams.get('view') as ViewMode) ?? 'grid';
  const ownedFilter = (searchParams.get('owned') === 'true'
    ? 'owned'
    : searchParams.get('owned') === 'false'
      ? 'wishlist'
      : 'all') as OwnedFilter;
  const condition = searchParams.get('condition') ?? '';
  const line = searchParams.get('line') ?? '';
  const faction = searchParams.get('faction') ?? '';
  const acquisitionSource = searchParams.get('acquisitionSource') ?? '';
  const isComplete = searchParams.get('isComplete') ?? '';

  // Local state for search input so typing doesn't trigger a fetch on every keystroke
  const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '');

  // Sync searchInput when URL changes externally (e.g., browser back)
  useEffect(() => {
    setSearchInput(searchParams.get('search') ?? '');
  }, [searchParams]);

  // Debounce: write to URL 300ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (searchInput) {
          next.set('search', searchInput);
        } else {
          next.delete('search');
        }
        return next;
      }, { replace: true });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, setSearchParams]);

  function setParam(key: string, value: string | null) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      return next;
    }, { replace: true });
  }

  function handleOwnedChange(value: string) {
    if (!value) return;
    if (value === 'owned') setParam('owned', 'true');
    else if (value === 'wishlist') setParam('owned', 'false');
    else setParam('owned', null);
  }

  function handleIsCompleteChange(value: string) {
    if (!value) return;
    if (value === 'complete') setParam('isComplete', 'true');
    else if (value === 'incomplete') setParam('isComplete', 'false');
    else setParam('isComplete', null);
  }

  const isCompleteFilter = isComplete === 'true' ? 'complete' : isComplete === 'false' ? 'incomplete' : 'all';

  return (
    <div className="space-y-2">
      {/* Search input */}
      <Input
        type="search"
        placeholder={`Search ${config.label} by name or notes…`}
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        className="h-9"
      />

      {/* Filter controls row */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-background p-3">
        {/* View toggle */}
        <ToggleGroup
          type="single"
          value={view}
          onValueChange={(v) => v && setParam('view', v)}
          variant="outline"
        >
          <ToggleGroupItem value="grid" aria-label="Grid view">
            <LayoutGridIcon className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="table" aria-label="Table view">
            <ListIcon className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>

        <Separator orientation="vertical" className="h-6" />

        {/* Owned / All / Wishlist */}
        <ToggleGroup
          type="single"
          value={ownedFilter}
          onValueChange={handleOwnedChange}
          variant="outline"
        >
          <ToggleGroupItem value="all">All</ToggleGroupItem>
          <ToggleGroupItem value="owned">Owned</ToggleGroupItem>
          <ToggleGroupItem value="wishlist">Wishlist</ToggleGroupItem>
        </ToggleGroup>

        <Separator orientation="vertical" className="h-6" />

        {/* Complete / Incomplete */}
        <ToggleGroup
          type="single"
          value={isCompleteFilter}
          onValueChange={handleIsCompleteChange}
          variant="outline"
        >
          <ToggleGroupItem value="all">Any</ToggleGroupItem>
          <ToggleGroupItem value="complete">Complete</ToggleGroupItem>
          <ToggleGroupItem value="incomplete">Incomplete</ToggleGroupItem>
        </ToggleGroup>

        <Separator orientation="vertical" className="h-6" />

        {/* Condition filter */}
        <Select value={condition} onValueChange={(v) => setParam('condition', v === '__all__' ? null : v)}>
          <SelectTrigger className="h-8 w-44 text-sm">
            <SelectValue placeholder="Condition" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Any condition</SelectItem>
            {CONDITION_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Line filter */}
        {config.lineOptions && (
          <Select value={line} onValueChange={(v) => setParam('line', v === '__all__' ? null : v)}>
            <SelectTrigger className="h-8 w-48 text-sm">
              <SelectValue placeholder={config.lineLabel ?? 'Line'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Any {config.lineLabel?.toLowerCase()}</SelectItem>
              {config.lineOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Faction filter (Transformers only) */}
        {config.factionOptions && (
          <Select value={faction} onValueChange={(v) => setParam('faction', v === '__all__' ? null : v)}>
            <SelectTrigger className="h-8 w-36 text-sm">
              <SelectValue placeholder="Faction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Any faction</SelectItem>
              {config.factionOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Acquisition source filter */}
        <Select value={acquisitionSource} onValueChange={(v) => setParam('acquisitionSource', v === '__all__' ? null : v)}>
          <SelectTrigger className="h-8 w-44 text-sm">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Any source</SelectItem>
            {ACQUISITION_SOURCE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Item count */}
        {totalCount !== undefined && (
          <span className="ml-auto text-sm text-muted-foreground">
            {totalCount} {totalCount === 1 ? 'item' : 'items'}
          </span>
        )}
      </div>
    </div>
  );
}
