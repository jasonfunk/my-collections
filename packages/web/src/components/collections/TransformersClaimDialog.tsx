import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { G1TransformersCatalogItem, UserG1TransformersItem } from '@my-collections/shared';
import {
  AcquisitionSource,
  ConditionGrade,
  PackagingCondition,
  WishlistPriority,
} from '@my-collections/shared';
import { apiClient } from '@/api/client.js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.js';
import { Button } from '@/components/ui/button.js';
import { Checkbox } from '@/components/ui/checkbox.js';
import { Input } from '@/components/ui/input.js';
import { Label } from '@/components/ui/label.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.js';
import { Separator } from '@/components/ui/separator.js';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group.js';
import {
  CONDITION_OPTIONS,
  ACQUISITION_SOURCE_OPTIONS,
  WISHLIST_PRIORITY_OPTIONS,
} from '@/lib/collectionConfig.js';

interface ClaimFormState {
  isOwned: boolean;
  wishlistPriority: WishlistPriority | '';
  condition: ConditionGrade | '';
  packagingCondition: PackagingCondition | '';
  isComplete: boolean;
  isBoxed: boolean;
  hasInstructions: boolean;
  hasTechSpec: boolean;
  rubSign: boolean;
  ownedAccessories: string[];
  acquisitionSource: AcquisitionSource | '';
  acquisitionDate: string;
  acquisitionPrice: string;
  estimatedValue: string;
  notes: string;
}

function makeDefaults(existing?: UserG1TransformersItem): ClaimFormState {
  if (existing) {
    return {
      isOwned: existing.isOwned,
      wishlistPriority: existing.wishlistPriority ?? '',
      condition: existing.condition ?? '',
      packagingCondition: existing.packagingCondition ?? '',
      isComplete: existing.isComplete,
      isBoxed: existing.isBoxed,
      hasInstructions: existing.hasInstructions,
      hasTechSpec: existing.hasTechSpec,
      rubSign: existing.rubSign ?? false,
      ownedAccessories: existing.ownedAccessories,
      acquisitionSource: existing.acquisitionSource ?? '',
      acquisitionDate: existing.acquisitionDate ?? '',
      acquisitionPrice: existing.acquisitionPrice != null ? String(existing.acquisitionPrice) : '',
      estimatedValue: existing.estimatedValue != null ? String(existing.estimatedValue) : '',
      notes: existing.notes ?? '',
    };
  }
  return {
    isOwned: true,
    wishlistPriority: '',
    condition: '',
    packagingCondition: '',
    isComplete: true,
    isBoxed: false,
    hasInstructions: false,
    hasTechSpec: false,
    rubSign: false,
    ownedAccessories: [],
    acquisitionSource: '',
    acquisitionDate: '',
    acquisitionPrice: '',
    estimatedValue: '',
    notes: '',
  };
}

function parseOptionalNumber(s: string): number | undefined {
  const n = parseFloat(s);
  return isNaN(n) ? undefined : n;
}

interface TransformersClaimDialogProps {
  catalogItem: G1TransformersCatalogItem;
  existing?: UserG1TransformersItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function TransformersClaimDialog({
  catalogItem,
  existing,
  open,
  onOpenChange,
  onSuccess,
}: TransformersClaimDialogProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ClaimFormState>(() => makeDefaults(existing));
  const [submitError, setSubmitError] = useState<string | null>(null);

  function patch(updates: Partial<ClaimFormState>) {
    setForm((prev) => ({ ...prev, ...updates }));
  }

  function toggleOwnedAccessory(acc: string, checked: boolean) {
    patch({
      ownedAccessories: checked
        ? [...form.ownedAccessories, acc]
        : form.ownedAccessories.filter((a) => a !== acc),
    });
  }

  function buildDto() {
    return {
      catalogId: catalogItem.id,
      isOwned: form.isOwned,
      ...(form.wishlistPriority ? { wishlistPriority: form.wishlistPriority } : {}),
      ...(form.condition ? { condition: form.condition } : {}),
      ...(form.packagingCondition ? { packagingCondition: form.packagingCondition } : {}),
      isComplete: form.isComplete,
      isBoxed: form.isBoxed,
      hasInstructions: form.hasInstructions,
      hasTechSpec: form.hasTechSpec,
      rubSign: form.rubSign,
      ownedAccessories: form.ownedAccessories,
      ...(form.acquisitionSource ? { acquisitionSource: form.acquisitionSource } : {}),
      ...(form.acquisitionDate ? { acquisitionDate: form.acquisitionDate } : {}),
      ...(form.acquisitionPrice !== '' ? { acquisitionPrice: parseOptionalNumber(form.acquisitionPrice) } : {}),
      ...(form.estimatedValue !== '' ? { estimatedValue: parseOptionalNumber(form.estimatedValue) } : {}),
      ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
    };
  }

  const mutation = useMutation({
    mutationFn: (dto: unknown) =>
      existing
        ? apiClient.patch<UserG1TransformersItem>(`/collections/transformers/items/${existing.id}`, dto)
        : apiClient.post<UserG1TransformersItem>('/collections/transformers/items', dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tf-user-items'] });
      void queryClient.invalidateQueries({ queryKey: ['tf-catalog-item', catalogItem.id] });
      onSuccess();
      onOpenChange(false);
    },
    onError: (err: Error) => setSubmitError(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    mutation.mutate(buildDto());
  }

  const title = existing ? `Edit — ${catalogItem.name}` : `Claim — ${catalogItem.name}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-5 py-2">
            {/* Owned vs Wishlist */}
            <div className="space-y-1">
              <Label>Status</Label>
              <ToggleGroup
                type="single"
                value={form.isOwned ? 'owned' : 'wishlist'}
                onValueChange={(v) => v && patch({ isOwned: v === 'owned' })}
                variant="outline"
                className="justify-start"
              >
                <ToggleGroupItem value="owned">Mark as Owned</ToggleGroupItem>
                <ToggleGroupItem value="wishlist">Add to Wishlist</ToggleGroupItem>
              </ToggleGroup>
            </div>

            {/* Wishlist priority */}
            {!form.isOwned && (
              <div className="space-y-1">
                <Label>Priority</Label>
                <Select
                  value={form.wishlistPriority}
                  onValueChange={(v) => patch({ wishlistPriority: v === '__none__' ? '' : v as WishlistPriority })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— None —</SelectItem>
                    {WISHLIST_PRIORITY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {form.isOwned && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Condition</Label>
                    <Select
                      value={form.condition}
                      onValueChange={(v) => patch({ condition: v === '__none__' ? '' : v as ConditionGrade })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— Unknown —</SelectItem>
                        {CONDITION_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label>Packaging</Label>
                    <Select
                      value={form.packagingCondition}
                      onValueChange={(v) => patch({ packagingCondition: v === '__none__' ? '' : v as PackagingCondition })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— None —</SelectItem>
                        <SelectItem value={PackagingCondition.SEALED}>Sealed</SelectItem>
                        <SelectItem value={PackagingCondition.COMPLETE}>Complete</SelectItem>
                        <SelectItem value={PackagingCondition.GOOD}>Good</SelectItem>
                        <SelectItem value={PackagingCondition.FAIR}>Fair</SelectItem>
                        <SelectItem value={PackagingCondition.POOR}>Poor</SelectItem>
                        <SelectItem value={PackagingCondition.NONE}>No packaging</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Transformer-specific flags */}
                <div className="flex flex-wrap gap-6">
                  {(
                    [
                      ['isComplete', 'Complete'],
                      ['isBoxed', 'Boxed'],
                      ['hasInstructions', 'Instructions'],
                      ['hasTechSpec', 'Tech spec'],
                      ['rubSign', 'Rub sign'],
                    ] as const
                  ).map(([field, label]) => (
                    <div key={field} className="flex items-center gap-2">
                      <Checkbox
                        id={`claim-${field}`}
                        checked={form[field]}
                        onCheckedChange={(v) => patch({ [field]: !!v })}
                      />
                      <Label htmlFor={`claim-${field}`}>{label}</Label>
                    </div>
                  ))}
                </div>

                {/* Accessories */}
                {catalogItem.accessories.length > 0 && (
                  <div className="space-y-1">
                    <Label>Accessories you have</Label>
                    <ul className="space-y-1 rounded border p-2">
                      {catalogItem.accessories.map((acc) => (
                        <li key={acc} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            id={`acc-${acc}`}
                            checked={form.ownedAccessories.includes(acc)}
                            onCheckedChange={(v) => toggleOwnedAccessory(acc, !!v)}
                          />
                          <Label htmlFor={`acc-${acc}`} className="flex-1 font-normal">{acc}</Label>
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-muted-foreground">Check accessories you physically have</p>
                  </div>
                )}
              </>
            )}

            <Separator />

            {/* Acquisition */}
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {form.isOwned ? 'Acquisition' : 'Wishlist'}
              </p>

              <div className="space-y-1">
                <Label htmlFor="claim-value">Est. value</Label>
                <Input
                  id="claim-value"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.estimatedValue}
                  onChange={(e) => patch({ estimatedValue: e.target.value })}
                />
              </div>

              {form.isOwned && (
                <>
                  <div className="space-y-1">
                    <Label>Source</Label>
                    <Select
                      value={form.acquisitionSource}
                      onValueChange={(v) => patch({ acquisitionSource: v === '__none__' ? '' : v as AcquisitionSource })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="How did you get it?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— Unknown —</SelectItem>
                        {ACQUISITION_SOURCE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="claim-date">Date acquired</Label>
                      <Input
                        id="claim-date"
                        type="date"
                        value={form.acquisitionDate}
                        onChange={(e) => patch({ acquisitionDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="claim-price">Price paid</Label>
                      <Input
                        id="claim-price"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={form.acquisitionPrice}
                        onChange={(e) => patch({ acquisitionPrice: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <Label htmlFor="claim-notes">Notes</Label>
              <Input
                id="claim-notes"
                value={form.notes}
                onChange={(e) => patch({ notes: e.target.value })}
                placeholder="Any notes about this item…"
              />
            </div>

            {submitError && (
              <p className="text-sm text-destructive">{submitError}</p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving…' : existing ? 'Save changes' : form.isOwned ? 'Mark as Owned' : 'Add to Wishlist'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
