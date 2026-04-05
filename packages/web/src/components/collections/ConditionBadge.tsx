import { ConditionGrade } from '@my-collections/shared';
import { cn } from '@/lib/utils';

const CONDITION_STYLES: Record<string, string> = {
  [ConditionGrade.MINT]: 'bg-green-100 text-green-800',
  [ConditionGrade.NEAR_MINT]: 'bg-emerald-100 text-emerald-800',
  [ConditionGrade.VERY_FINE]: 'bg-blue-100 text-blue-800',
  [ConditionGrade.FINE]: 'bg-indigo-100 text-indigo-800',
  [ConditionGrade.VERY_GOOD]: 'bg-yellow-100 text-yellow-800',
  [ConditionGrade.GOOD]: 'bg-orange-100 text-orange-800',
  [ConditionGrade.POOR]: 'bg-red-100 text-red-800',
  [ConditionGrade.INCOMPLETE]: 'bg-gray-100 text-gray-600',
};

interface ConditionBadgeProps {
  grade: string;
  className?: string;
}

export function ConditionBadge({ grade, className }: ConditionBadgeProps) {
  const style = CONDITION_STYLES[grade] ?? 'bg-gray-100 text-gray-600';
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
        style,
        className,
      )}
    >
      {grade}
    </span>
  );
}
