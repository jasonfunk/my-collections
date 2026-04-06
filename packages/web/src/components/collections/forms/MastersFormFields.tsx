import { useState } from 'react';
import { MastersCharacterType, MastersLine } from '@my-collections/shared';
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
import { MASTERS_CHARACTER_LABELS, MASTERS_LINE_LABELS } from '@/lib/collectionConfig.js';
import { AccessoryEditor } from './StarWarsFormFields.js';

export interface MastersFormData {
  line: MastersLine;
  characterType: MastersCharacterType;
  releaseYear: string;
  isVariant: boolean;
  variantDescription: string;
  isCarded: boolean;
  hasBackCard: boolean;
  miniComic: string;
  hasArmorOrFeature: boolean;
  featureDescription: string;
  accessories: string[];
  ownedAccessories: string[];
}

export function makeMastersDefaults(): MastersFormData {
  return {
    line: MastersLine.ORIGINAL,
    characterType: MastersCharacterType.HEROIC_WARRIOR,
    releaseYear: '',
    isVariant: false,
    variantDescription: '',
    isCarded: false,
    hasBackCard: false,
    miniComic: '',
    hasArmorOrFeature: false,
    featureDescription: '',
    accessories: [],
    ownedAccessories: [],
  };
}

interface Props {
  data: MastersFormData;
  errors: Partial<Record<keyof MastersFormData, string>>;
  onChange: (patch: Partial<MastersFormData>) => void;
}

export function MastersFormFields({ data, errors, onChange }: Props) {
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
      {/* Line + Character type */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>
            Line <span className="text-destructive">*</span>
          </Label>
          <Select
            value={data.line}
            onValueChange={(v) => onChange({ line: v as MastersLine })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(MASTERS_LINE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label>
            Character type <span className="text-destructive">*</span>
          </Label>
          <Select
            value={data.characterType}
            onValueChange={(v) => onChange({ characterType: v as MastersCharacterType })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(MASTERS_CHARACTER_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Release year */}
      <div className="space-y-1 max-w-[160px]">
        <Label htmlFor="motu-year">Release year</Label>
        <Input
          id="motu-year"
          type="number"
          min="1981"
          max="1990"
          value={data.releaseYear}
          onChange={(e) => onChange({ releaseYear: e.target.value })}
          placeholder="e.g. 1982"
        />
        {errors.releaseYear && (
          <p className="text-xs text-destructive">{errors.releaseYear}</p>
        )}
      </div>

      {/* Flags */}
      <div className="flex flex-wrap gap-6">
        {(
          [
            ['isCarded', 'Carded'],
            ['hasBackCard', 'Back card intact'],
            ['hasArmorOrFeature', 'Armor / feature'],
            ['isVariant', 'Variant'],
          ] as const
        ).map(([field, label]) => (
          <div key={field} className="flex items-center gap-2">
            <Checkbox
              id={`motu-${field}`}
              checked={data[field]}
              onCheckedChange={(v) => onChange({ [field]: !!v })}
            />
            <Label htmlFor={`motu-${field}`}>{label}</Label>
          </div>
        ))}
      </div>

      {/* Conditional text fields */}
      {data.hasArmorOrFeature && (
        <div className="space-y-1">
          <Label htmlFor="motu-feature">Feature description</Label>
          <Input
            id="motu-feature"
            value={data.featureDescription}
            onChange={(e) => onChange({ featureDescription: e.target.value })}
            placeholder="e.g. Battle Armor, Slime Pit trap"
          />
        </div>
      )}

      {data.isVariant && (
        <div className="space-y-1">
          <Label htmlFor="motu-variant">Variant description</Label>
          <Input
            id="motu-variant"
            value={data.variantDescription}
            onChange={(e) => onChange({ variantDescription: e.target.value })}
            placeholder="e.g. first release, cross sell back"
          />
        </div>
      )}

      {/* Mini-comic */}
      <div className="space-y-1">
        <Label htmlFor="motu-comic">Mini-comic title</Label>
        <Input
          id="motu-comic"
          value={data.miniComic}
          onChange={(e) => onChange({ miniComic: e.target.value })}
          placeholder="e.g. He-Man and the Power Sword"
        />
      </div>

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
