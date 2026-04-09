import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AcquisitionSource, ConditionGrade } from '@my-collections/shared';
import { apiClient } from '@/api/client.js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.js';
import { Button } from '@/components/ui/button.js';
import { Input } from '@/components/ui/input.js';
import { Label } from '@/components/ui/label.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.js';
import { CONDITION_OPTIONS, ACQUISITION_SOURCE_OPTIONS } from '@/lib/collectionConfig.js';

interface MarkAcquiredDialogProps {
  itemId: string;
  itemName: string;
  collectionPath: string;
  queryKeysToInvalidate: unknown[][];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface AcquiredFormState {
  condition: ConditionGrade | '';
  acquisitionSource: AcquisitionSource | '';
  acquisitionDate: string;
  acquisitionPrice: string;
  estimatedValue: string;
  notes: string;
}

const INITIAL_STATE: AcquiredFormState = {
  condition: '',
  acquisitionSource: '',
  acquisitionDate: '',
  acquisitionPrice: '',
  estimatedValue: '',
  notes: '',
};

export function MarkAcquiredDialog({
  itemId,
  itemName,
  collectionPath,
  queryKeysToInvalidate,
  open,
  onOpenChange,
  onSuccess,
}: MarkAcquiredDialogProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<AcquiredFormState>(INITIAL_STATE);

  function patch<K extends keyof AcquiredFormState>(key: K, value: AcquiredFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function buildDto() {
    const dto: Record<string, unknown> = {};
    if (form.condition) dto.condition = form.condition;
    if (form.acquisitionSource) dto.acquisitionSource = form.acquisitionSource;
    if (form.acquisitionDate) dto.acquisitionDate = form.acquisitionDate;
    if (form.acquisitionPrice) dto.acquisitionPrice = parseFloat(form.acquisitionPrice);
    if (form.estimatedValue) dto.estimatedValue = parseFloat(form.estimatedValue);
    if (form.notes.trim()) dto.notes = form.notes.trim();
    return dto;
  }

  const mutation = useMutation({
    mutationFn: () =>
      apiClient.patch(`${collectionPath}/items/${itemId}/acquired`, buildDto()),
    onSuccess: async () => {
      await Promise.all(
        queryKeysToInvalidate.map((key) => queryClient.invalidateQueries({ queryKey: key })),
      );
      setForm(INITIAL_STATE);
      onOpenChange(false);
      onSuccess();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Mark as Acquired: {itemName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Condition</Label>
            <Select
              value={form.condition}
              onValueChange={(v) => patch('condition', v as ConditionGrade)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select condition (optional)" />
              </SelectTrigger>
              <SelectContent>
                {CONDITION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Acquisition source</Label>
            <Select
              value={form.acquisitionSource}
              onValueChange={(v) => patch('acquisitionSource', v as AcquisitionSource)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Where did you get it? (optional)" />
              </SelectTrigger>
              <SelectContent>
                {ACQUISITION_SOURCE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="acq-date">Date acquired</Label>
              <Input
                id="acq-date"
                type="date"
                value={form.acquisitionDate}
                onChange={(e) => patch('acquisitionDate', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="acq-price">Price paid ($)</Label>
              <Input
                id="acq-price"
                type="number"
                min={0}
                step={0.01}
                placeholder="0.00"
                value={form.acquisitionPrice}
                onChange={(e) => patch('acquisitionPrice', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="est-value">Estimated value ($)</Label>
            <Input
              id="est-value"
              type="number"
              min={0}
              step={0.01}
              placeholder="0.00"
              value={form.estimatedValue}
              onChange={(e) => patch('estimatedValue', e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              placeholder="Optional notes"
              value={form.notes}
              onChange={(e) => patch('notes', e.target.value)}
            />
          </div>
        </div>

        {mutation.isError && (
          <p className="text-sm text-destructive">
            Failed to mark as acquired. Please try again.
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Mark as Acquired'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
