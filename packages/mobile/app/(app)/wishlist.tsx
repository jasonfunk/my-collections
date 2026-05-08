import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { CollectionType } from '@my-collections/shared';
import { COLLECTION_CONFIG } from '../../src/config/collections';
import { fetchWishlist, WishlistItem } from '../../src/services/collectionsService';

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: '#f59e0b',
  MEDIUM: '#94a3b8',
  LOW: '#6b7280',
};

interface WishlistSection {
  collectionType: CollectionType;
  data: WishlistItem[];
}

function PriorityBadge({ priority }: { priority: string | null | undefined }) {
  if (!priority) return null;
  const color = PRIORITY_COLORS[priority] ?? '#6b7280';
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <Text style={[styles.badgeText, { color }]}>{priority}</Text>
    </View>
  );
}

function ItemRow({ item, slug }: { item: WishlistItem; slug: string }) {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={styles.row}
      activeOpacity={0.75}
      onPress={() => router.push(`/(app)/collections/${slug}/${item.id}`)}
    >
      <View style={styles.thumb}>
        {item.catalog?.catalogImageUrl ? (
          <Image
            source={{ uri: item.catalog.catalogImageUrl }}
            style={styles.thumbImg}
            referrerPolicy="no-referrer"
          />
        ) : null}
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowName} numberOfLines={1}>
          {item.catalog?.name ?? 'Unknown item'}
        </Text>
        <PriorityBadge priority={item.wishlistPriority} />
      </View>
    </TouchableOpacity>
  );
}

export default function WishlistScreen() {
  const [sections, setSections] = useState<WishlistSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setError(null);
    try {
      const [swRes, tfRes, hmRes] = await Promise.all([
        fetchWishlist(CollectionType.STAR_WARS),
        fetchWishlist(CollectionType.TRANSFORMERS),
        fetchWishlist(CollectionType.HE_MAN),
      ]);
      const next: WishlistSection[] = [];
      if (swRes.data.length > 0) next.push({ collectionType: CollectionType.STAR_WARS, data: swRes.data });
      if (tfRes.data.length > 0) next.push({ collectionType: CollectionType.TRANSFORMERS, data: tfRes.data });
      if (hmRes.data.length > 0) next.push({ collectionType: CollectionType.HE_MAN, data: hmRes.data });
      setSections(next);
    } catch {
      setError('Failed to load wishlist. Pull down to retry.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadData().finally(() => setLoading(false));
    }, [loadData]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const totalItems = sections.reduce((sum, s) => sum + s.data.length, 0);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Wishlist</Text>
        {totalItems > 0 && <Text style={styles.count}>{totalItems}</Text>}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => {
          const cfg = COLLECTION_CONFIG[section.collectionType];
          return (
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: cfg.color }]}>{cfg.label}</Text>
              <Text style={styles.sectionCount}>{section.data.length}</Text>
            </View>
          );
        }}
        renderItem={({ item, section }) => (
          <ItemRow item={item} slug={COLLECTION_CONFIG[section.collectionType].slug} />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          !error ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>Your wishlist is empty.</Text>
              <Text style={styles.emptySubtext}>Add items from any collection to start tracking.</Text>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor="#6366f1"
          />
        }
        contentContainerStyle={sections.length === 0 ? styles.emptyFlex : styles.listContent}
        stickySectionHeadersEnabled={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f0f0f' },
  centered: { flex: 1, backgroundColor: '#0f0f0f', justifyContent: 'center', alignItems: 'center' },

  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#fff' },
  count: { fontSize: 14, color: '#888', backgroundColor: '#1a1a1a', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },

  error: { color: '#ef4444', fontSize: 14, marginHorizontal: 20, marginBottom: 8 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  sectionCount: { fontSize: 12, color: '#666' },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 12 },
  thumb: { width: 40, height: 40, borderRadius: 6, backgroundColor: '#1a1a1a', overflow: 'hidden' },
  thumbImg: { width: 40, height: 40 },
  rowBody: { flex: 1, gap: 4 },
  rowName: { fontSize: 14, color: '#fff', fontWeight: '500' },

  badge: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

  separator: { height: StyleSheet.hairlineWidth, backgroundColor: '#1e1e1e', marginLeft: 72 },

  listContent: { paddingBottom: 40 },
  emptyFlex: { flex: 1 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyText: { fontSize: 17, color: '#fff', fontWeight: '600', marginBottom: 6, textAlign: 'center' },
  emptySubtext: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20 },
});
