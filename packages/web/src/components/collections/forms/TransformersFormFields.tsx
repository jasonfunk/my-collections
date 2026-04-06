import { useState } from 'react';
import { TransformersFaction, TransformersLine, TransformerSize } from '@my-collections/shared';
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
import { FACTION_LABELS, TF_LINE_LABELS, TF_SIZE_LABELS } from '@/lib/collectionConfig.js';
import { AccessoryEditor } from './StarWarsFormFields.js';

export interface TransformersFormData {
  faction: TransformersFaction;
  line: TransformersLine;
  size: TransformerSize;
  altMode: string;
  isBoxed: boolean;
  hasInstructions: boolean;
  hasTechSpec: boolean;
  rubSign: boolean;
  isCombiner: boolean;
  combinerTeam: string;
  isGiftSet: boolean;
  isMailaway: boolean;
  japaneseRelease: boolean;
  accessories: string[];
  ownedAccessories: string[];
}

export function makeTransformersDefaults(): TransformersFormData {
  return {
    faction: TransformersFaction.AUTOBOT,
    line: TransformersLine.G1_SERIES_1,
    size: TransformerSize.MEDIUM,
    altMode: '',
    isBoxed: false,
    hasInstructions: false,
    hasTechSpec: false,
    rubSign: false,
    isCombiner: false,
    combinerTeam: '',
    isGiftSet: false,
    isMailaway: false,
    japaneseRelease: false,
    accessories: [],
    ownedAccessories: [],
  };
}

interface Props {
  data: TransformersFormData;
  errors: Partial<Record<keyof TransformersFormData, string>>;
  onChange: (patch: Partial<TransformersFormData>) => void;
}

export function TransformersFormFields({ data, errors, onChange }: Props) {
  const [newAccessory, setNewAccessory] = useState('');

  function addAccessory() {
    const trimmed = newAccessory.trim();
    if (!trimmed || data.accessories.includes(trimmed)) return;
    onChange({ accessories: [...data.accessories, trimmed] });
    setNewAccessory('');
  }

  function removeAccessory(name: string) {
    onChange({
      accessories: data.accessories.filter((a) => a !== name),
      ownedAccessories: data.ownedAccessories.filter((a) => a !== name),
    });
  }

  function toggleOwned(name: string, checked: boolean) {
    onChange({
      ownedAccessories: checked
        ? [...data.ownedAccessories, name]
        : data.ownedAccessories.filter((a) => a !== name),
    });
  }

  return (
    <div className="space-y-4">
      {/* Faction + Line */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>
            Faction <span className="text-destructive">*</span>
          </Label>
          <Select
            value={data.faction}
            onValueChange={(v) => onChange({ faction: v as TransformersFaction })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(FACTION_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label>
            Series <span className="text-destructive">*</span>
          </Label>
          <Select
            value={data.line}
            onValueChange={(v) => onChange({ line: v as TransformersLine })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TF_LINE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Size + Alt mode */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>
            Size class <span className="text-destructive">*</span>
          </Label>
          <Select
            value={data.size}
            onValueChange={(v) => onChange({ size: v as TransformerSize })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TF_SIZE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="tf-altmode">
            Alt mode <span className="text-destructive">*</span>
          </Label>
          <Input
            id="tf-altmode"
            value={data.altMode}
            onChange={(e) => onChange({ altMode: e.target.value })}
            placeholder="e.g. Porsche 911"
          />
          {errors.altMode && <p className="text-xs text-destructive">{errors.altMode}</p>}
        </div>
      </div>

      {/* Flags row 1 */}
      <div className="flex flex-wrap gap-6">
        {(
          [
            ['isBoxed', 'Boxed'],
            ['hasInstructions', 'Instructions'],
            ['hasTechSpec', 'Tech spec'],
            ['rubSign', 'Rub sign'],
          ] as const
        ).map(([field, label]) => (
          <div key={field} className="flex items-center gap-2">
            <Checkbox
              id={`tf-${field}`}
              checked={data[field]}
              onCheckedChange={(v) => onChange({ [field]: !!v })}
            />
            <Label htmlFor={`tf-${field}`}>{label}</Label>
          </div>
        ))}
      </div>

      {/* Flags row 2 */}
      <div className="flex flex-wrap gap-6">
        {(
          [
            ['isCombiner', 'Combiner'],
            ['isGiftSet', 'Gift set'],
            ['isMailaway', 'Mail-away'],
            ['japaneseRelease', 'Japanese release'],
          ] as const
        ).map(([field, label]) => (
          <div key={field} className="flex items-center gap-2">
            <Checkbox
              id={`tf-${field}`}
              checked={data[field]}
              onCheckedChange={(v) => onChange({ [field]: !!v })}
            />
            <Label htmlFor={`tf-${field}`}>{label}</Label>
          </div>
        ))}
      </div>

      {/* Combiner team */}
      {data.isCombiner && (
        <div className="space-y-1">
          <Label htmlFor="tf-combiner">Combiner team</Label>
          <Input
            id="tf-combiner"
            value={data.combinerTeam}
            onChange={(e) => onChange({ combinerTeam: e.target.value })}
            placeholder="e.g. Aerialbots, Stunticons"
          />
        </div>
      )}

      {/* Accessories */}
      <AccessoryEditor
        accessories={data.accessories}
        ownedAccessories={data.ownedAccessories}
        newValue={newAccessory}
        onNewValueChange={setNewAccessory}
        onAdd={addAccessory}
        onRemove={removeAccessory}
        onToggleOwned={toggleOwned}
      />
    </div>
  );
}
