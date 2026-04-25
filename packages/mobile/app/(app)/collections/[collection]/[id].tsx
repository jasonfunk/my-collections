import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CollectionType } from '@my-collections/shared';
import { type DetailItem, fetchItemDetail } from '../../../../src/services/collectionsService';
import { SLUG_TO_COLLECTION } from '../../../../src/config/collections';
import { API_BASE } from '../../../../src/api/client';
import { getAccessToken } from '../../../../src/auth/tokenStorage';

// ── Helpers ──────────────────────────────────────────────────────────────────

const CONDITION_LABELS: Record<string, string> = {
  C10: 'C10 · Mint',
  C9: 'C9 · Near Mint',
  C8: 'C8 · Very Fine',
  C7: 'C7 · Fine',
  C6: 'C6 · Very Good',
  C5: 'C5 · Good',
  C4: 'C4 · Poor',
  INC: 'INC · Incomplete',
};

const PACKAGING_LABELS: Record<string, string> = {
  SEALED: 'Sealed',
  COMPLETE: 'Complete',
  GOOD: 'Good',
  FAIR: 'Fair',
  POOR: 'Poor',
  NONE: 'None / Loose',
};

const SOURCE_LABELS: Record<string, string> = {
  ORIGINAL: 'Original owner',
  EBAY: 'eBay',
  ETSY: 'Etsy',
  FLEA_MARKET: 'Flea market',
  ANTIQUE_STORE: 'Antique store',
  CONVENTION: 'Convention',
  PRIVATE_SALE: 'Private sale',
  TRADE: 'Trade',
  GIFT: 'Gift',
  TOY_STORE: 'Toy store',
  OTHER: 'Other',
};

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: '#f59e0b',
  MEDIUM: '#94a3b8',
  LOW: '#6b7280',
};

function formatMoney(value: number): string {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function BoolRow({ label, value }: { label: string; value: boolean }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={value ? styles.boolYes : styles.boolNo}>{value ? 'Yes' : 'No'}</Text>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function ItemDetailScreen() {
  const { collection: slug, id } = useLocalSearchParams<{ collection: string; id: string }>();
  const router = useRouter();

  const collectionType = SLUG_TO_COLLECTION[slug ?? ''];
  const [item, setItem] = useState<DetailItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadItem = useCallback(async () => {
    if (collectionType === undefined || !id) return;
    setError(null);
    try {
      const data = await fetchItemDetail(collectionType, id);
      setItem(data);
    } catch {
      setError('Failed to load item. Tap to retry.');
    }
  }, [collectionType, id]);

  useFocusEffect(
    useCallback(() => {
      void loadItem().finally(() => setLoading(false));
    }, [loadItem])
  );

  const itemName = item?.catalog?.name ?? 'Item Detail';

  if (loading) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: 'Item Detail' }} />
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (error || item === null) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: 'Item Detail' }} />
        <TouchableOpacity onPress={() => { setLoading(true); void loadItem().finally(() => setLoading(false)); }}>
          <Text style={styles.errorText}>{error ?? 'Item not found.'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const hasAcquisition =
    item.acquisitionSource != null ||
    item.acquisitionDate != null ||
    item.acquisitionPrice != null ||
    item.estimatedValue != null;

  const authHeaders = { Authorization: `Bearer ${getAccessToken() ?? ''}` };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: itemName,
          headerRight: () => (
            <TouchableOpacity
              style={{ padding: 4, marginRight: 4 }}
              onPress={() => router.push(`/(app)/collections/${slug}/edit/${id}`)}
              activeOpacity={0.7}
              testID="header-edit-button"
            >
              <Ionicons name="pencil-outline" size={20} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView contentContainerStyle={styles.content}>

        {/* ── Status Header ── */}
        <View style={styles.card}>
          <Text style={styles.itemName}>{itemName}</Text>
          <View style={styles.badges}>
            <Text style={item.isOwned ? styles.ownedBadge : styles.wishlistBadge}>
              {item.isOwned ? 'Owned' : 'Wishlist'}
            </Text>
            {!item.isOwned && item.wishlistPriority != null && (
              <Text style={[styles.priorityBadge, { color: PRIORITY_COLORS[item.wishlistPriority] ?? '#888' }]}>
                {item.wishlistPriority.charAt(0) + item.wishlistPriority.slice(1).toLowerCase()} Priority
              </Text>
            )}
          </View>
        </View>

        {/* ── Condition ── */}
        <SectionHeader title="Condition" />
        <View style={styles.card}>
          <DetailRow
            label="Figure"
            value={item.condition != null ? (CONDITION_LABELS[item.condition] ?? item.condition) : 'Not recorded'}
          />
          <DetailRow
            label="Packaging"
            value={item.packagingCondition != null ? (PACKAGING_LABELS[item.packagingCondition] ?? item.packagingCondition) : 'Not recorded'}
          />
          <BoolRow label="Complete" value={item.isComplete} />
        </View>

        {/* ── Collection-specific fields ── */}
        <SectionHeader title="Details" />
        <View style={styles.card}>
          {collectionType === CollectionType.STAR_WARS && (
            <>
              <BoolRow label="Carded" value={item.isCarded ?? false} />
              <BoolRow label="Boxed" value={item.isBoxed ?? false} />
            </>
          )}
          {collectionType === CollectionType.TRANSFORMERS && (
            <>
              <BoolRow label="Boxed" value={item.isBoxed ?? false} />
              <BoolRow label="Instructions" value={item.hasInstructions ?? false} />
              <BoolRow label="Tech Spec" value={item.hasTechSpec ?? false} />
              {item.rubSign != null && <BoolRow label="Rub Sign" value={item.rubSign} />}
            </>
          )}
          {collectionType === CollectionType.HE_MAN && (
            <>
              <BoolRow label="Carded" value={item.isCarded ?? false} />
              <BoolRow label="Back Card" value={item.hasBackCard ?? false} />
            </>
          )}

          {item.ownedAccessories.length > 0 && (
            <View style={styles.accessorySection}>
              <Text style={styles.detailLabel}>Owned Accessories</Text>
              {item.ownedAccessories.map((acc, i) => (
                <Text key={i} style={styles.accessoryItem}>· {acc}</Text>
              ))}
            </View>
          )}

          {item.catalog?.accessories != null && item.catalog.accessories.length > 0 && (
            <View style={styles.accessorySection}>
              <Text style={styles.detailLabel}>Should Include</Text>
              {item.catalog.accessories.map((acc, i) => (
                <Text
                  key={i}
                  style={[
                    styles.accessoryItem,
                    item.ownedAccessories.includes(acc) ? styles.accessoryOwned : styles.accessoryMissing,
                  ]}
                >
                  · {acc}
                </Text>
              ))}
            </View>
          )}
        </View>

        {/* ── Acquisition ── */}
        {hasAcquisition && (
          <>
            <SectionHeader title="Acquisition" />
            <View style={styles.card}>
              {item.acquisitionSource != null && (
                <DetailRow label="Source" value={SOURCE_LABELS[item.acquisitionSource] ?? item.acquisitionSource} />
              )}
              {item.acquisitionDate != null && (
                <DetailRow label="Date" value={formatDate(item.acquisitionDate)} />
              )}
              {item.acquisitionPrice != null && (
                <DetailRow label="Price Paid" value={formatMoney(item.acquisitionPrice)} />
              )}
              {item.estimatedValue != null && (
                <DetailRow label="Est. Value" value={formatMoney(item.estimatedValue)} />
              )}
            </View>
          </>
        )}

        {/* ── Notes ── */}
        {item.notes != null && (
          <>
            <SectionHeader title="Notes" />
            <View style={styles.card}>
              <Text style={styles.notes}>{item.notes}</Text>
            </View>
          </>
        )}

        {/* ── Photos ── */}
        {item.photoUrls.length > 0 && (
          <>
            <SectionHeader title="Photos" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
              {item.photoUrls.map((url, i) => (
                <Image
                  key={i}
                  source={{
                    uri: url.startsWith('http') ? url : `${API_BASE}${url}`,
                    headers: authHeaders,
                  }}
                  style={styles.photo}
                />
              ))}
            </ScrollView>
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f0f0f' },
  centered: { flex: 1, backgroundColor: '#0f0f0f', justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, paddingBottom: 32 },

  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },

  itemName: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 10 },
  badges: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  ownedBadge: { fontSize: 13, fontWeight: '600', color: '#4ade80' },
  wishlistBadge: { fontSize: 13, fontWeight: '600', color: '#6366f1' },
  priorityBadge: { fontSize: 13, fontWeight: '500' },

  sectionHeader: {
    fontSize: 11,
    fontWeight: '600',
    color: '#555',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 2,
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2a2a2a',
  },
  detailLabel: { fontSize: 13, color: '#888' },
  detailValue: { fontSize: 13, color: '#fff', flexShrink: 1, textAlign: 'right', marginLeft: 12 },
  boolYes: { fontSize: 13, color: '#4ade80' },
  boolNo: { fontSize: 13, color: '#555' },

  accessorySection: { marginTop: 10 },
  accessoryItem: { fontSize: 13, color: '#aaa', marginTop: 2, paddingLeft: 4 },
  accessoryOwned: { color: '#4ade80' },
  accessoryMissing: { color: '#555' },

  notes: { fontSize: 14, color: '#ccc', lineHeight: 20 },

  errorText: { fontSize: 14, color: '#ef4444', textAlign: 'center', padding: 16 },

  photoScroll: { marginBottom: 8 },
  photo: {
    width: 140,
    height: 140,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: '#1a1a1a',
  },
});
