import { ConditionGrade } from '@my-collections/shared';
import { cn } from '@/lib/utils';
import { CONDITION_GRADE_NAMES } from '@/lib/collectionConfig';

const CONDITION_STYLES: Record<string, string> = {
  [ConditionGrade.MINT]:       'bg-green-500/15 text-green-400',
  [ConditionGrade.NEAR_MINT]:  'bg-emerald-500/15 text-emerald-400',
  [ConditionGrade.VERY_FINE]:  'bg-blue-500/15 text-blue-400',
  [ConditionGrade.FINE]:       'bg-indigo-500/15 text-indigo-400',
  [ConditionGrade.VERY_GOOD]:  'bg-yellow-500/15 text-yellow-300',
  [ConditionGrade.GOOD]:       'bg-orange-500/15 text-orange-400',
  [ConditionGrade.POOR]:       'bg-red-500/15 text-red-400',
  [ConditionGrade.INCOMPLETE]: 'bg-zinc-500/15 text-zinc-400',
};

interface ConditionBadgeProps {
  grade: string;
  className?: string;
}

export function ConditionBadge({ grade, className }: ConditionBadgeProps) {
  const style = CONDITION_STYLES[grade] ?? 'bg-gray-100 text-gray-600';
  const name = CONDITION_GRADE_NAMES[grade];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
        style,
        className,
      )}
    >
      {grade}{name ? ` · ${name}` : ''}
    </span>
  );
}
