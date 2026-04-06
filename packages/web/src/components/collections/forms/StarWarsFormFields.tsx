import { useState } from 'react';
import { CardbackStyle, FigureSize, StarWarsLine } from '@my-collections/shared';
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
import {
  CARDBACK_LABELS,
  FIGURE_SIZE_LABELS,
  STAR_WARS_LINE_LABELS,
} from '@/lib/collectionConfig.js';
import { XIcon } from 'lucide-react';

export interface StarWarsFormData {
  line: StarWarsLine;
  figureSize: FigureSize;
  isVariant: boolean;
  variantDescription: string;
  isCarded: boolean;
  cardbackStyle: CardbackStyle | '';
  accessories: string[];
  ownedAccessories: string[];
  coinIncluded: boolean;
  kennerItemNumber: string;
}

export function makeStarWarsDefaults(): StarWarsFormData {
  return {
    line: StarWarsLine.STAR_WARS,
    figureSize: FigureSize.SMALL,
    isVariant: false,
    variantDescription: '',
    isCarded: false,
    cardbackStyle: '',
    accessories: [],
    ownedAccessories: [],
    coinIncluded: false,
    kennerItemNumber: '',
  };
}

interface Props {
  data: StarWarsFormData;
  onChange: (patch: Partial<StarWarsFormData>) => void;
}

export function StarWarsFormFields({ data, onChange }: Props) {
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
      {/* Line + size */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>
            Line <span className="text-destructive">*</span>
          </Label>
          <Select
            value={data.line}
            onValueChange={(v) => onChange({ line: v as StarWarsLine })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STAR_WARS_LINE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label>
            Figure size <span className="text-destructive">*</span>
          </Label>
          <Select
            value={data.figureSize}
            onValueChange={(v) => onChange({ figureSize: v as FigureSize })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(FIGURE_SIZE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Flags */}
      <div className="flex flex-wrap gap-6">
        <div className="flex items-center gap-2">
          <Checkbox
            id="sw-isCarded"
            checked={data.isCarded}
            onCheckedChange={(v) => onChange({ isCarded: !!v })}
          />
          <Label htmlFor="sw-isCarded">Carded</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="sw-coinIncluded"
            checked={data.coinIncluded}
            onCheckedChange={(v) => onChange({ coinIncluded: !!v })}
          />
          <Label htmlFor="sw-coinIncluded">POTF coin included</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="sw-isVariant"
            checked={data.isVariant}
            onCheckedChange={(v) => onChange({ isVariant: !!v })}
          />
          <Label htmlFor="sw-isVariant">Variant</Label>
        </div>
      </div>

      {/* Carded: cardback style */}
      {data.isCarded && (
        <div className="space-y-1">
          <Label>Cardback style</Label>
          <Select
            value={data.cardbackStyle}
            onValueChange={(v) =>
              onChange({ cardbackStyle: v === '__none__' ? '' : (v as CardbackStyle) })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select cardback…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">— Unknown —</SelectItem>
              {Object.entries(CARDBACK_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Variant description */}
      {data.isVariant && (
        <div className="space-y-1">
          <Label htmlFor="sw-variantDesc">Variant description</Label>
          <Input
            id="sw-variantDesc"
            value={data.variantDescription}
            onChange={(e) => onChange({ variantDescription: e.target.value })}
            placeholder="e.g. vinyl cape, double telescoping lightsaber"
          />
        </div>
      )}

      {/* Kenner # */}
      <div className="space-y-1">
        <Label htmlFor="sw-kenner">Kenner item number</Label>
        <Input
          id="sw-kenner"
          value={data.kennerItemNumber}
          onChange={(e) => onChange({ kennerItemNumber: e.target.value })}
          placeholder="e.g. 38180"
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

interface AccessoryEditorProps {
  accessories: string[];
  ownedAccessories: string[];
  newValue: string;
  onNewValueChange: (v: string) => void;
  onAdd: () => void;
  onRemove: (name: string) => void;
  onToggleOwned: (name: string, checked: boolean) => void;
}

export function AccessoryEditor({
  accessories,
  ownedAccessories,
  newValue,
  onNewValueChange,
  onAdd,
  onRemove,
  onToggleOwned,
}: AccessoryEditorProps) {
  return (
    <div className="space-y-2">
      <Label>Accessories</Label>
      {accessories.length > 0 && (
        <ul className="space-y-1 rounded border p-2">
          {accessories.map((acc) => (
            <li key={acc} className="flex items-center gap-2 text-sm">
              <Checkbox
                id={`acc-${acc}`}
                checked={ownedAccessories.includes(acc)}
                onCheckedChange={(v) => onToggleOwned(acc, !!v)}
              />
              <Label htmlFor={`acc-${acc}`} className="flex-1 font-normal">
                {acc}
              </Label>
              <button
                type="button"
                onClick={() => onRemove(acc)}
                className="text-muted-foreground hover:text-destructive"
              >
                <XIcon className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <Input
          value={newValue}
          onChange={(e) => onNewValueChange(e.target.value)}
          placeholder="Add accessory name…"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onAdd();
            }
          }}
        />
        <Button type="button" variant="outline" size="sm" onClick={onAdd}>
          Add
        </Button>
      </div>
      {accessories.length > 0 && (
        <p className="text-xs text-muted-foreground">Check items you actually own</p>
      )}
    </div>
  );
}
