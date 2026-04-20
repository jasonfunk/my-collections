import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CollectionType } from '@my-collections/shared';
import type { CollectionStats, RecentCollectionItem } from '@my-collections/shared';
import { apiClient } from '../../src/api/client';
import { useAuth } from '../../src/hooks/useAuth';

const COLLECTION_CONFIG: Record<CollectionType, { label: string; color: string }> = {
  [CollectionType.STAR_WARS]: { label: 'Star Wars', color: '#fbbf24' },
  [CollectionType.TRANSFORMERS]: { label: 'Transformers', color: '#60a5fa' },
  [CollectionType.HE_MAN]: { label: 'He-Man', color: '#a78bfa' },
};

function formatValue(value: number | null): string {
  if (value === null) return '—';
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<CollectionStats | null>(null);
  const [recent, setRecent] = useState<RecentCollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const [statsData, recentData] = await Promise.all([
        apiClient.get<CollectionStats>('/collections/stats'),
        apiClient.get<RecentCollectionItem[]>('/collections/recent?limit=5'),
      ]);
      setStats(statsData);
      setRecent(recentData);
    } catch {
      setError('Failed to load dashboard. Pull down to retry.');
    }
  }, []);

  useEffect(() => {
    void fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor="#6366f1"
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>My Collections</Text>
          <TouchableOpacity onPress={() => void logout()}>
            <Text style={styles.signOut}>Sign Out</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>{user?.email}</Text>

        {error !== null && <Text style={styles.error}>{error}</Text>}

        {stats !== null && (
          <>
            <Text style={styles.sectionLabel}>Collections</Text>

            <CollectionCard
              label="Star Wars"
              color="#fbbf24"
              stats={stats.starWars}
              onPress={() => router.navigate('/(app)/collections')}
            />
            <CollectionCard
              label="Transformers"
              color="#60a5fa"
              stats={stats.transformers}
              onPress={() => router.navigate('/(app)/collections')}
            />
            <CollectionCard
              label="He-Man"
              color="#a78bfa"
              stats={stats.heman}
              onPress={() => router.navigate('/(app)/collections')}
            />

            <Text style={[styles.sectionLabel, styles.sectionSpacing]}>Totals</Text>
            <View style={styles.totalsRow}>
              <TotalPill label="Owned" value={String(stats.totals.owned)} />
              <TotalPill label="Wishlist" value={String(stats.totals.wishlist)} />
              <TotalPill label="Value" value={formatValue(stats.totals.estimatedTotalValue)} />
            </View>
          </>
        )}

        {recent.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, styles.sectionSpacing]}>Recently Added</Text>
            {recent.map((item) => (
              <RecentItemRow key={item.id} item={item} />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function CollectionCard({
  label,
  color,
  stats,
  onPress,
}: {
  label: string;
  color: string;
  stats: { owned: number; wishlist: number; estimatedTotalValue: number | null };
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.cardAccent, { backgroundColor: color }]} />
      <View style={styles.cardBody}>
        <Text style={styles.cardLabel}>{label}</Text>
        <Text style={[styles.cardOwned, { color }]}>{stats.owned} owned</Text>
        <View style={styles.cardMeta}>
          <Text style={styles.cardMetaText}>{stats.wishlist} on wishlist</Text>
          <Text style={styles.cardMetaText}>{formatValue(stats.estimatedTotalValue)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function TotalPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillValue}>{value}</Text>
      <Text style={styles.pillLabel}>{label}</Text>
    </View>
  );
}

function RecentItemRow({ item }: { item: RecentCollectionItem }) {
  const cfg = COLLECTION_CONFIG[item.collectionType];
  return (
    <View style={styles.recentRow}>
      <View style={styles.recentMain}>
        <Text style={styles.recentName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.recentBadge, { color: cfg.color }]}>{cfg.label}</Text>
      </View>
      <View style={styles.recentRight}>
        <Text style={item.isOwned ? styles.ownedTag : styles.wishlistTag}>
          {item.isOwned ? 'Owned' : 'Wishlist'}
        </Text>
        <Text style={styles.recentDate}>{formatDate(item.createdAt)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f0f0f' },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, backgroundColor: '#0f0f0f', justifyContent: 'center', alignItems: 'center' },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#fff' },
  signOut: { color: '#ef4444', fontSize: 14 },
  subtitle: { fontSize: 13, color: '#888', marginBottom: 28 },
  error: { color: '#ef4444', fontSize: 14, marginBottom: 16 },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  sectionSpacing: { marginTop: 20 },

  card: { flexDirection: 'row', backgroundColor: '#1a1a1a', borderRadius: 12, marginBottom: 12, overflow: 'hidden' },
  cardAccent: { width: 4 },
  cardBody: { flex: 1, padding: 16 },
  cardLabel: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 4 },
  cardOwned: { fontSize: 24, fontWeight: 'bold', marginBottom: 6 },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  cardMetaText: { fontSize: 13, color: '#888' },

  totalsRow: { flexDirection: 'row', gap: 10 },
  pill: { flex: 1, backgroundColor: '#1a1a1a', borderRadius: 10, padding: 14, alignItems: 'center' },
  pillValue: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 2 },
  pillLabel: { fontSize: 11, color: '#888' },

  recentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  recentMain: { flex: 1, marginRight: 12 },
  recentName: { fontSize: 14, color: '#fff', marginBottom: 2 },
  recentBadge: { fontSize: 11 },
  recentRight: { alignItems: 'flex-end' },
  ownedTag: { fontSize: 12, color: '#4ade80', marginBottom: 2 },
  wishlistTag: { fontSize: 12, color: '#6366f1', marginBottom: 2 },
  recentDate: { fontSize: 11, color: '#888' },
});
