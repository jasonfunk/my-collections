import { useRef, useState } from 'react';
import {
  AcquisitionSource,
  ConditionGrade,
  PackagingCondition,
} from '@my-collections/shared';
import { uploadFile } from '@/api/client.js';
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
import { Textarea } from '@/components/ui/textarea.js';
import { CONDITION_LABELS } from '@/lib/collectionConfig.js';
import { Loader2Icon, XIcon } from 'lucide-react';
import { AuthenticatedImage } from '@/components/AuthenticatedImage.js';

export interface BaseFormData {
  name: string;
  condition: ConditionGrade;
  packagingCondition: PackagingCondition;
  isOwned: boolean;
  isComplete: boolean;
  acquisitionSource: AcquisitionSource | '';
  acquisitionDate: string;
  acquisitionPrice: string;
  estimatedValue: string;
  notes: string;
  photoUrls: string[];
}

export function makeBaseDefaults(): BaseFormData {
  return {
    name: '',
    condition: ConditionGrade.VERY_FINE,
    packagingCondition: PackagingCondition.NONE,
    isOwned: true,
    isComplete: true,
    acquisitionSource: '',
    acquisitionDate: '',
    acquisitionPrice: '',
    estimatedValue: '',
    notes: '',
    photoUrls: [],
  };
}

const PACKAGING_LABELS: Record<PackagingCondition, string> = {
  [PackagingCondition.SEALED]: 'Sealed',
  [PackagingCondition.COMPLETE]: 'Complete (C9)',
  [PackagingCondition.GOOD]: 'Good',
  [PackagingCondition.FAIR]: 'Fair',
  [PackagingCondition.POOR]: 'Poor',
  [PackagingCondition.NONE]: 'No packaging',
};

const ACQUISITION_LABELS: Record<AcquisitionSource, string> = {
  [AcquisitionSource.ORIGINAL]: 'Original (childhood)',
  [AcquisitionSource.EBAY]: 'eBay',
  [AcquisitionSource.ETSY]: 'Etsy',
  [AcquisitionSource.FLEA_MARKET]: 'Flea market',
  [AcquisitionSource.ANTIQUE_STORE]: 'Antique store',
  [AcquisitionSource.CONVENTION]: 'Convention',
  [AcquisitionSource.PRIVATE_SALE]: 'Private sale',
  [AcquisitionSource.TRADE]: 'Trade',
  [AcquisitionSource.GIFT]: 'Gift',
  [AcquisitionSource.TOY_STORE]: 'Toy Store',
  [AcquisitionSource.OTHER]: 'Other',
};

interface Props {
  data: BaseFormData;
  errors: Partial<Record<keyof BaseFormData, string>>;
  onChange: (patch: Partial<BaseFormData>) => void;
}

export function BaseFormFields({ data, errors, onChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadError(null);
    try {
      const { url } = await uploadFile('/collections/photos/upload', file);
      onChange({ photoUrls: [...data.photoUrls, url] });
    } catch {
      setUploadError('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      // Reset so the same file can be re-selected after removal
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function removePhoto(index: number) {
    onChange({ photoUrls: data.photoUrls.filter((_, i) => i !== index) });
  }

  return (
    <div className="space-y-4">
      {/* Name */}
      <div className="space-y-1">
        <Label htmlFor="name">
          Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          value={data.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="e.g. Luke Skywalker (X-Wing Pilot)"
        />
        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
      </div>

      {/* Status row */}
      <div className="flex flex-wrap gap-6">
        <div className="flex items-center gap-2">
          <Checkbox
            id="isOwned"
            checked={data.isOwned}
            onCheckedChange={(v) => onChange({ isOwned: !!v })}
          />
          <Label htmlFor="isOwned">Owned (uncheck = wishlist)</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="isComplete"
            checked={data.isComplete}
            onCheckedChange={(v) => onChange({ isComplete: !!v })}
          />
          <Label htmlFor="isComplete">Complete</Label>
        </div>
      </div>

      {/* Condition + Packaging */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>
            Condition <span className="text-destructive">*</span>
          </Label>
          <Select
            value={data.condition}
            onValueChange={(v) => onChange({ condition: v as ConditionGrade })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CONDITION_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label>Packaging condition</Label>
          <Select
            value={data.packagingCondition}
            onValueChange={(v) => onChange({ packagingCondition: v as PackagingCondition })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PACKAGING_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Acquisition */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Acquisition source</Label>
          <Select
            value={data.acquisitionSource}
            onValueChange={(v) =>
              onChange({ acquisitionSource: v === '__none__' ? '' : (v as AcquisitionSource) })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select source…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">— None —</SelectItem>
              {Object.entries(ACQUISITION_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="acquisitionDate">Date acquired</Label>
          <Input
            id="acquisitionDate"
            type="date"
            value={data.acquisitionDate}
            onChange={(e) => onChange({ acquisitionDate: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="acquisitionPrice">Price paid ($)</Label>
          <Input
            id="acquisitionPrice"
            type="number"
            min="0"
            step="0.01"
            value={data.acquisitionPrice}
            onChange={(e) => onChange({ acquisitionPrice: e.target.value })}
            placeholder="0.00"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="estimatedValue">Estimated value ($)</Label>
          <Input
            id="estimatedValue"
            type="number"
            min="0"
            step="0.01"
            value={data.estimatedValue}
            onChange={(e) => onChange({ estimatedValue: e.target.value })}
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={data.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder="Provenance, variant details, condition notes…"
          rows={3}
        />
      </div>

      {/* Photos */}
      <div className="space-y-2">
        <Label>Photos</Label>
        {data.photoUrls.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {data.photoUrls.map((url, i) => (
              <div key={i} className="relative">
                <AuthenticatedImage
                  src={url}
                  alt={`Photo ${i + 1}`}
                  className="h-20 w-20 rounded border object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white hover:bg-destructive/90"
                >
                  <XIcon className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? (
              <>
                <Loader2Icon className="mr-1 h-3 w-3 animate-spin" />
                Uploading…
              </>
            ) : (
              'Upload photo'
            )}
          </Button>
          {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
        </div>
      </div>
    </div>
  );
}
