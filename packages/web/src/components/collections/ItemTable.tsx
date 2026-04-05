import { useNavigate } from 'react-router-dom';
import type { CollectionItem } from '@my-collections/shared';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ConditionBadge } from './ConditionBadge.js';
import type { CollectionKey } from '@/lib/collectionConfig';
import {
  STAR_WARS_LINE_LABELS,
  TF_LINE_LABELS,
  MASTERS_LINE_LABELS,
  FACTION_LABELS,
} from '@/lib/collectionConfig';

function formatCurrency(value: number | undefined | null): string {
  if (value == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function getExtraColumnHeader(key: CollectionKey): string {
  if (key === 'star-wars') return 'Carded';
  if (key === 'transformers') return 'Faction';
  return 'Type';
}

function getExtraColumnValue(item: CollectionItem & Record<string, unknown>, key: CollectionKey): React.ReactNode {
  if (key === 'star-wars') {
    return item.isCarded ? '✓' : '✗';
  }
  if (key === 'transformers' && item.faction) {
    const label = FACTION_LABELS[item.faction as string] ?? String(item.faction);
    const variant = item.faction === 'AUTOBOT' ? 'secondary' : 'destructive';
    return <Badge variant={variant} className="text-xs">{label}</Badge>;
  }
  if (key === 'he-man' && item.characterType) {
    const type = String(item.characterType);
    const isEvil = type.startsWith('EVIL');
    return <Badge variant={isEvil ? 'destructive' : 'secondary'} className="text-xs">{type.replace(/_/g, ' ')}</Badge>;
  }
  return '—';
}

function getLineLabel(item: CollectionItem & Record<string, unknown>, key: CollectionKey): string {
  if (key === 'star-wars' && item.line) return STAR_WARS_LINE_LABELS[item.line as string] ?? String(item.line);
  if (key === 'transformers' && item.line) return TF_LINE_LABELS[item.line as string] ?? String(item.line);
  if (key === 'he-man' && item.line) return MASTERS_LINE_LABELS[item.line as string] ?? String(item.line);
  return '—';
}

interface ItemTableProps {
  items: CollectionItem[];
  collectionKey: CollectionKey;
}

export function ItemTable({ items, collectionKey }: ItemTableProps) {
  const navigate = useNavigate();

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Condition</TableHead>
            <TableHead>Line</TableHead>
            <TableHead>{getExtraColumnHeader(collectionKey)}</TableHead>
            <TableHead>Owned</TableHead>
            <TableHead>Complete</TableHead>
            <TableHead className="text-right">Est. Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow
              key={item.id}
              className="cursor-pointer"
              onClick={() => navigate(`/collections/${collectionKey}/${item.id}`)}
            >
              <TableCell className="font-medium">
                {item.name}
                {!(item as CollectionItem & Record<string, unknown>).isOwned && (
                  <Badge variant="outline" className="ml-2 text-xs">Wishlist</Badge>
                )}
              </TableCell>
              <TableCell>
                <ConditionBadge grade={item.condition} />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {getLineLabel(item as CollectionItem & Record<string, unknown>, collectionKey)}
              </TableCell>
              <TableCell>
                {getExtraColumnValue(item as CollectionItem & Record<string, unknown>, collectionKey)}
              </TableCell>
              <TableCell>{item.isOwned ? '✓' : '—'}</TableCell>
              <TableCell>{item.isComplete ? '✓' : '✗'}</TableCell>
              <TableCell className="text-right">{formatCurrency(item.estimatedValue)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function ItemTableSkeleton() {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            {['Name', 'Condition', 'Line', 'Extra', 'Owned', 'Complete', 'Value'].map((h) => (
              <TableHead key={h}>{h}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 8 }).map((_, i) => (
            <TableRow key={i}>
              {Array.from({ length: 7 }).map((__, j) => (
                <TableCell key={j}>
                  <Skeleton className="h-4 w-full max-w-24" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
