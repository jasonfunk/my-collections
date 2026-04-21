import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { type BrowseFilters, FilterSheet } from '../../../src/components/FilterSheet';
import { type BrowseItem, fetchItems } from '../../../src/services/collectionsService';
import { COLLECTION_CONFIG, SLUG_TO_COLLECTION } from '../../../src/config/collections';

function formatValue(value: number): string {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function CollectionBrowseScreen() {
  const { collection: slug } = useLocalSearchParams<{ collection: string }>();
  const router = useRouter();

  const collectionType = SLUG_TO_COLLECTION[slug ?? ''];
  const config = collectionType !== undefined ? COLLECTION_CONFIG[collectionType] : null;

  const [items, setItems] = useState<BrowseItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterVisible, setFilterVisible] = useState(false);
  const [filters, setFilters] = useState<BrowseFilters>({ status: 'all' });

  const loadItems = useCallback(async () => {
    if (collectionType === undefined) return;
    setError(null);
    try {
      const result = await fetchItems(collectionType);
      setItems(result.data);
      setTotal(result.meta.total);
    } catch {
      setError('Failed to load items. Pull down to retry.');
    }
  }, [collectionType]);

  useEffect(() => {
    void loadItems().finally(() => setLoading(false));
  }, [loadItems]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  }, [loadItems]);

  const handleApplyFilters = useCallback((f: BrowseFilters) => {
    setFilters(f);
    setFilterVisible(false);
  }, []);

  const filteredItems = useMemo(() => {
    if (filters.status === 'owned') return items.filter(i => i.isOwned);
    if (filters.status === 'wishlist') return items.filter(i => !i.isOwned);
    return items;
  }, [items, filters.status]);

  const activeFilterCount = filters.status !== 'all' ? 1 : 0;

  if (config === null) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Unknown collection.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: config.label,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => setFilterVisible(true)}
              style={styles.filterButton}
              activeOpacity={0.7}
            >
              <Ionicons
                name="options-outline"
                size={22}
                color={activeFilterCount > 0 ? '#6366f1' : '#fff'}
              />
              {activeFilterCount > 0 && <View style={styles.filterDot} />}
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.listHeader}>
        {error !== null ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <Text style={styles.countText}>
            {filteredItems.length === total
              ? `${total} items`
              : `${filteredItems.length} of ${total} items`}
          </Text>
        )}
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor="#6366f1"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No items found</Text>
            <Text style={styles.emptySubtitle}>
              {filters.status !== 'all' ? 'Try adjusting your filters' : 'Add items to get started'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <ItemRow
            item={item}
            onPress={() => router.push(`/(app)/collections/${slug}/${item.id}`)}
          />
        )}
        contentContainerStyle={styles.listContent}
      />

      <FilterSheet
        visible={filterVisible}
        filters={filters}
        onApply={handleApplyFilters}
        onClose={() => setFilterVisible(false)}
      />
    </SafeAreaView>
  );
}

function ItemRow({ item, onPress }: { item: BrowseItem; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.rowMain}>
        <Text style={styles.rowName} numberOfLines={1}>
          {item.catalog?.name ?? '—'}
        </Text>
        {item.condition != null && (
          <Text style={styles.rowCondition}>{item.condition}</Text>
        )}
      </View>
      <View style={styles.rowRight}>
        {item.estimatedValue != null && (
          <Text style={styles.rowValue}>{formatValue(item.estimatedValue)}</Text>
        )}
        <Text style={item.isOwned ? styles.ownedBadge : styles.wishlistBadge}>
          {item.isOwned ? 'Owned' : 'Wishlist'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f0f0f' },
  centered: { flex: 1, backgroundColor: '#0f0f0f', justifyContent: 'center', alignItems: 'center' },

  filterButton: { padding: 4, marginRight: 4 },
  filterDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6366f1',
  },

  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  listHeader: { paddingHorizontal: 16, paddingVertical: 10 },
  countText: { fontSize: 13, color: '#888' },
  errorText: { fontSize: 14, color: '#ef4444' },

  emptyContainer: { alignItems: 'center', paddingVertical: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#888', marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: '#555' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  rowMain: { flex: 1, marginRight: 12 },
  rowName: { fontSize: 15, color: '#fff', marginBottom: 3 },
  rowCondition: { fontSize: 11, color: '#888' },
  rowRight: { alignItems: 'flex-end' },
  rowValue: { fontSize: 13, color: '#fff', marginBottom: 4 },
  ownedBadge: { fontSize: 12, color: '#4ade80' },
  wishlistBadge: { fontSize: 12, color: '#6366f1' },
});
