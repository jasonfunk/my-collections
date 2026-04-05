import { LayoutGridIcon, ListIcon } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
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
import { CONDITION_OPTIONS } from '@/lib/collectionConfig';

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

  return (
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

      {/* Item count */}
      {totalCount !== undefined && (
        <span className="ml-auto text-sm text-muted-foreground">
          {totalCount} {totalCount === 1 ? 'item' : 'items'}
        </span>
      )}
    </div>
  );
}
