import { Switch, StyleSheet, Text, TextInput, TouchableOpacity, View, Image, ScrollView } from 'react-native';
import { CollectionType } from '@my-collections/shared';
import { SelectPicker, type SelectOption } from './SelectPicker';
import { API_BASE } from '../api/client';
import { getAccessToken } from '../auth/tokenStorage';

// ── Form state ─────────────────────────────────────────────────────────────────

export interface FormState {
  isOwned: boolean;
  wishlistPriority: string;
  condition: string;
  packagingCondition: string;
  isComplete: boolean;
  ownedAccessories: string[];
  isCarded: boolean;
  isBoxed: boolean;
  hasInstructions: boolean;
  hasTechSpec: boolean;
  rubSign: string;      // 'true' | 'false' | '' (unknown)
  hasBackCard: boolean;
  acquisitionSource: string;
  acquisitionDate: string;
  acquisitionPrice: string;
  estimatedValue: string;
  notes: string;
  photoUrls: string[];
}

export function defaultFormState(): FormState {
  return {
    isOwned: true,
    wishlistPriority: '',
    condition: 'C8',
    packagingCondition: 'NONE',
    isComplete: true,
    ownedAccessories: [],
    isCarded: false,
    isBoxed: false,
    hasInstructions: false,
    hasTechSpec: false,
    rubSign: '',
    hasBackCard: false,
    acquisitionSource: '',
    acquisitionDate: '',
    acquisitionPrice: '',
    estimatedValue: '',
    notes: '',
    photoUrls: [],
  };
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function buildPayload(form: FormState, collectionType: CollectionType) {
  const acquisitionPrice = parseFloat(form.acquisitionPrice);
  const estimatedValue = parseFloat(form.estimatedValue);

  const collectionFields: Record<string, unknown> = {};
  if (collectionType === CollectionType.STAR_WARS) {
    collectionFields.isCarded = form.isCarded;
    collectionFields.isBoxed = form.isBoxed;
  } else if (collectionType === CollectionType.TRANSFORMERS) {
    collectionFields.isBoxed = form.isBoxed;
    collectionFields.hasInstructions = form.hasInstructions;
    collectionFields.hasTechSpec = form.hasTechSpec;
    if (form.rubSign !== '') collectionFields.rubSign = form.rubSign === 'true';
  } else if (collectionType === CollectionType.HE_MAN) {
    collectionFields.isCarded = form.isCarded;
    collectionFields.hasBackCard = form.hasBackCard;
  }

  return {
    isOwned: form.isOwned,
    condition: form.condition || undefined,
    packagingCondition: form.packagingCondition || undefined,
    isComplete: form.isComplete,
    ownedAccessories: form.ownedAccessories,
    ...(!form.isOwned && form.wishlistPriority ? { wishlistPriority: form.wishlistPriority } : {}),
    ...collectionFields,
    ...(form.isOwned && form.acquisitionSource ? { acquisitionSource: form.acquisitionSource } : {}),
    ...(form.isOwned && form.acquisitionDate ? { acquisitionDate: form.acquisitionDate } : {}),
    ...(form.isOwned && !isNaN(acquisitionPrice) ? { acquisitionPrice } : {}),
    ...(!isNaN(estimatedValue) ? { estimatedValue } : {}),
    ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
    photoUrls: form.photoUrls,
  };
}

// ── Option lists ───────────────────────────────────────────────────────────────

const CONDITION_OPTIONS: SelectOption[] = [
  { value: 'C10', label: 'C10 · Mint' },
  { value: 'C9',  label: 'C9 · Near Mint' },
  { value: 'C8',  label: 'C8 · Very Fine' },
  { value: 'C7',  label: 'C7 · Fine' },
  { value: 'C6',  label: 'C6 · Very Good' },
  { value: 'C5',  label: 'C5 · Good' },
  { value: 'C4',  label: 'C4 · Poor' },
  { value: 'INC', label: 'INC · Incomplete' },
];

const PACKAGING_OPTIONS: SelectOption[] = [
  { value: 'SEALED',   label: 'Sealed' },
  { value: 'C9',       label: 'Complete (C9)' },
  { value: 'GOOD',     label: 'Good' },
  { value: 'FAIR',     label: 'Fair' },
  { value: 'POOR',     label: 'Poor' },
  { value: 'NONE',     label: 'No packaging' },
];

const PRIORITY_OPTIONS: SelectOption[] = [
  { value: 'HIGH',   label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW',    label: 'Low' },
];

const SOURCE_OPTIONS: SelectOption[] = [
  { value: 'ORIGINAL',      label: 'Original owner' },
  { value: 'EBAY',          label: 'eBay' },
  { value: 'ETSY',          label: 'Etsy' },
  { value: 'FLEA_MARKET',   label: 'Flea market' },
  { value: 'ANTIQUE_STORE', label: 'Antique store' },
  { value: 'CONVENTION',    label: 'Convention' },
  { value: 'PRIVATE_SALE',  label: 'Private sale' },
  { value: 'TRADE',         label: 'Trade' },
  { value: 'GIFT',          label: 'Gift' },
  { value: 'TOY_STORE',     label: 'Toy store' },
  { value: 'OTHER',         label: 'Other' },
];

const RUB_SIGN_OPTIONS: SelectOption[] = [
  { value: '',      label: 'Unknown' },
  { value: 'true',  label: 'Present' },
  { value: 'false', label: 'Missing' },
];

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#333', true: '#6366f1' }}
        thumbColor="#fff"
      />
    </View>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

interface Props {
  collectionType: CollectionType;
  accessoryOptions: string[];
  value: FormState;
  onChange: (patch: Partial<FormState>) => void;
  uploadingPhoto: boolean;
  onAddPhoto: () => void;
  onRemovePhoto: (index: number) => void;
}

export function ItemForm({
  collectionType,
  accessoryOptions,
  value: form,
  onChange,
  uploadingPhoto,
  onAddPhoto,
  onRemovePhoto,
}: Props) {
  function toggleAccessory(acc: string) {
    const next = form.ownedAccessories.includes(acc)
      ? form.ownedAccessories.filter(a => a !== acc)
      : [...form.ownedAccessories, acc];
    onChange({ ownedAccessories: next });
  }

  const token = getAccessToken() ?? '';
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : undefined;

  return (
    <View>
      {/* Status */}
      <SectionHeader title="Status" />
      <View style={styles.card}>
        <View style={styles.ownedRow}>
          {(['Owned', 'Wishlist'] as const).map((label, idx) => {
            const active = idx === 0 ? form.isOwned : !form.isOwned;
            return (
              <TouchableOpacity
                key={label}
                style={[styles.statusPill, active && styles.statusPillActive]}
                onPress={() => onChange({ isOwned: idx === 0 })}
                activeOpacity={0.7}
              >
                <Text style={[styles.statusPillText, active && styles.statusPillTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {!form.isOwned && (
          <SelectPicker
            label="Priority"
            value={form.wishlistPriority || null}
            options={PRIORITY_OPTIONS}
            placeholder="Select priority…"
            onChange={v => onChange({ wishlistPriority: v })}
          />
        )}
      </View>

      {/* Condition */}
      <SectionHeader title="Condition" />
      <View style={styles.card}>
        <SelectPicker
          label="Figure condition"
          value={form.condition || null}
          options={CONDITION_OPTIONS}
          onChange={v => onChange({ condition: v })}
        />
        <SelectPicker
          label="Packaging condition"
          value={form.packagingCondition || null}
          options={PACKAGING_OPTIONS}
          onChange={v => onChange({ packagingCondition: v })}
        />
        <ToggleRow label="Complete (all accessories present)" value={form.isComplete} onChange={v => onChange({ isComplete: v })} />
      </View>

      {/* Accessories */}
      {accessoryOptions.length > 0 && (
        <>
          <SectionHeader title="Accessories" />
          <View style={styles.card}>
            {accessoryOptions.map(acc => (
              <TouchableOpacity
                key={acc}
                style={styles.accessoryRow}
                onPress={() => toggleAccessory(acc)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, form.ownedAccessories.includes(acc) && styles.checkboxChecked]}>
                  {form.ownedAccessories.includes(acc) && <Text style={styles.checkboxTick}>✓</Text>}
                </View>
                <Text style={styles.accessoryLabel}>{acc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* Collection-specific */}
      <SectionHeader title="Details" />
      <View style={styles.card}>
        {collectionType === CollectionType.STAR_WARS && (
          <>
            <ToggleRow label="Carded" value={form.isCarded} onChange={v => onChange({ isCarded: v })} />
            <ToggleRow label="Boxed" value={form.isBoxed} onChange={v => onChange({ isBoxed: v })} />
          </>
        )}
        {collectionType === CollectionType.TRANSFORMERS && (
          <>
            <ToggleRow label="Boxed" value={form.isBoxed} onChange={v => onChange({ isBoxed: v })} />
            <ToggleRow label="Instructions included" value={form.hasInstructions} onChange={v => onChange({ hasInstructions: v })} />
            <ToggleRow label="Tech Spec included" value={form.hasTechSpec} onChange={v => onChange({ hasTechSpec: v })} />
            <SelectPicker
              label="Rub Sign"
              value={form.rubSign}
              options={RUB_SIGN_OPTIONS}
              onChange={v => onChange({ rubSign: v })}
            />
          </>
        )}
        {collectionType === CollectionType.HE_MAN && (
          <>
            <ToggleRow label="Carded" value={form.isCarded} onChange={v => onChange({ isCarded: v })} />
            <ToggleRow label="Back card intact" value={form.hasBackCard} onChange={v => onChange({ hasBackCard: v })} />
          </>
        )}
      </View>

      {/* Acquisition (owned only) */}
      {form.isOwned && (
        <>
          <SectionHeader title="Acquisition" />
          <View style={styles.card}>
            <SelectPicker
              label="Source"
              value={form.acquisitionSource || null}
              options={SOURCE_OPTIONS}
              placeholder="Select source…"
              onChange={v => onChange({ acquisitionSource: v })}
            />
            <View style={styles.inputField}>
              <Text style={styles.inputLabel}>Date acquired (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                value={form.acquisitionDate}
                onChangeText={t => onChange({ acquisitionDate: t })}
                placeholder="e.g. 2024-06-15"
                placeholderTextColor="#555"
                keyboardType="numbers-and-punctuation"
              />
            </View>
            <View style={styles.inputField}>
              <Text style={styles.inputLabel}>Price paid ($)</Text>
              <TextInput
                style={styles.input}
                value={form.acquisitionPrice}
                onChangeText={t => onChange({ acquisitionPrice: t })}
                placeholder="0.00"
                placeholderTextColor="#555"
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        </>
      )}

      {/* Value */}
      <SectionHeader title="Value" />
      <View style={styles.card}>
        <View style={styles.inputField}>
          <Text style={styles.inputLabel}>Estimated value ($)</Text>
          <TextInput
            style={styles.input}
            value={form.estimatedValue}
            onChangeText={t => onChange({ estimatedValue: t })}
            placeholder="0.00"
            placeholderTextColor="#555"
            keyboardType="decimal-pad"
          />
        </View>
      </View>

      {/* Notes */}
      <SectionHeader title="Notes" />
      <View style={styles.card}>
        <TextInput
          testID="item-notes-input"
          style={[styles.input, styles.notesInput]}
          value={form.notes}
          onChangeText={t => onChange({ notes: t })}
          placeholder="Condition notes, provenance, variants…"
          placeholderTextColor="#555"
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Photos */}
      <SectionHeader title="Photos" />
      <View style={styles.card}>
        {form.photoUrls.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
            {form.photoUrls.map((url, i) => (
              <View key={i} style={styles.photoWrapper}>
                <Image
                  source={{
                    uri: url.startsWith('http') ? url : `${API_BASE}${url}`,
                    headers: authHeaders,
                  }}
                  style={styles.photo}
                />
                <TouchableOpacity style={styles.removePhoto} onPress={() => onRemovePhoto(i)}>
                  <Text style={styles.removePhotoText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
        <TouchableOpacity
          style={[styles.addPhotoBtn, uploadingPhoto && styles.addPhotoBtnDisabled]}
          onPress={onAddPhoto}
          disabled={uploadingPhoto}
          activeOpacity={0.7}
        >
          <Text style={styles.addPhotoBtnText}>{uploadingPhoto ? 'Uploading…' : '+ Add Photo'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  sectionHeader: {
    fontSize: 11,
    fontWeight: '600',
    color: '#555',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 14,
    marginBottom: 4,
  },

  ownedRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statusPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#252525',
    alignItems: 'center',
  },
  statusPillActive: { backgroundColor: '#6366f1' },
  statusPillText: { fontSize: 14, color: '#888', fontWeight: '600' },
  statusPillTextActive: { color: '#fff' },

  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2a2a2a',
  },
  toggleLabel: { fontSize: 14, color: '#ccc', flex: 1 },

  accessoryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  checkboxTick: { fontSize: 13, color: '#fff', fontWeight: '700' },
  accessoryLabel: { fontSize: 14, color: '#ccc', flex: 1 },

  inputField: { marginBottom: 12 },
  inputLabel: { fontSize: 12, color: '#888', marginBottom: 4, fontWeight: '500' },
  input: {
    backgroundColor: '#252525',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#fff',
  },
  notesInput: { minHeight: 80, textAlignVertical: 'top' },

  photoScroll: { marginBottom: 12 },
  photoWrapper: { position: 'relative', marginRight: 10 },
  photo: { width: 90, height: 90, borderRadius: 8, backgroundColor: '#252525' },
  removePhoto: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePhotoText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  addPhotoBtn: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addPhotoBtnDisabled: { opacity: 0.5 },
  addPhotoBtnText: { fontSize: 14, color: '#6366f1', fontWeight: '600' },
});
