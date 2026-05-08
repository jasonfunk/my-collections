import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CollectionType } from '@my-collections/shared';
import { COLLECTION_CONFIG } from '../../src/config/collections';
import { BrowseItem, fetchItems } from '../../src/services/collectionsService';

interface SearchSection {
  collectionType: CollectionType;
  data: BrowseItem[];
}

function ResultRow({ item, slug }: { item: BrowseItem; slug: string }) {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={styles.row}
      activeOpacity={0.75}
      onPress={() => router.push(`/(app)/collections/${slug}/${item.id}`)}
    >
      <View style={styles.thumb}>
        {item.catalog?.catalogImageUrl ? (
          <Image source={{ uri: item.catalog.catalogImageUrl }} style={styles.thumbImg} />
        ) : null}
      </View>
      <Text style={styles.rowName} numberOfLines={1}>
        {item.catalog?.name ?? 'Unknown'}
      </Text>
    </TouchableOpacity>
  );
}

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [sections, setSections] = useState<SearchSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const [swRes, tfRes, hmRes] = await Promise.all([
          fetchItems(CollectionType.STAR_WARS, 1, 50, q),
          fetchItems(CollectionType.TRANSFORMERS, 1, 50, q),
          fetchItems(CollectionType.HE_MAN, 1, 50, q),
        ]);
        const next: SearchSection[] = [];
        if (swRes.data.length > 0) next.push({ collectionType: CollectionType.STAR_WARS, data: swRes.data });
        if (tfRes.data.length > 0) next.push({ collectionType: CollectionType.TRANSFORMERS, data: tfRes.data });
        if (hmRes.data.length > 0) next.push({ collectionType: CollectionType.HE_MAN, data: hmRes.data });
        setSections(next);
        setHasSearched(true);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  const onChangeText = useCallback(
    (text: string) => {
      setQuery(text);
      if (text.trim().length === 0) {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        setSections([]);
        setHasSearched(false);
        setLoading(false);
      } else {
        runSearch(text.trim());
      }
    },
    [runSearch],
  );

  const onClear = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setQuery('');
    setSections([]);
    setHasSearched(false);
    setLoading(false);
  }, []);

  const showEmpty = hasSearched && !loading && sections.length === 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Search input */}
      <View style={styles.inputRow}>
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            placeholder="Search all collections…"
            placeholderTextColor="#555"
            value={query}
            onChangeText={onChangeText}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            clearButtonMode={Platform.OS === 'ios' ? 'while-editing' : 'never'}
          />
          {Platform.OS === 'android' && query.length > 0 && (
            <TouchableOpacity onPress={onClear} style={styles.clearBtn}>
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Loading */}
      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color="#6366f1" />
        </View>
      )}

      {/* Results */}
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
          <ResultRow item={item} slug={COLLECTION_CONFIG[section.collectionType].slug} />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          showEmpty ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No results for "{query}"</Text>
            </View>
          ) : !hasSearched ? (
            <View style={styles.empty}>
              <Text style={styles.emptySubtext}>Type to search across all collections</Text>
            </View>
          ) : null
        }
        contentContainerStyle={sections.length === 0 ? styles.emptyFlex : styles.listContent}
        stickySectionHeadersEnabled={false}
        keyboardShouldPersistTaps="handled"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f0f0f' },

  inputRow: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 10, paddingHorizontal: 12 },
  input: { flex: 1, height: 44, fontSize: 16, color: '#fff' },
  clearBtn: { padding: 6 },
  clearText: { color: '#888', fontSize: 14 },

  loadingRow: { alignItems: 'center', paddingVertical: 8 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 6 },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  sectionCount: { fontSize: 12, color: '#666' },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 12 },
  thumb: { width: 40, height: 40, borderRadius: 6, backgroundColor: '#1a1a1a', overflow: 'hidden' },
  thumbImg: { width: 40, height: 40 },
  rowName: { flex: 1, fontSize: 14, color: '#fff', fontWeight: '500' },

  separator: { height: StyleSheet.hairlineWidth, backgroundColor: '#1e1e1e', marginLeft: 72 },

  listContent: { paddingBottom: 40 },
  emptyFlex: { flex: 1 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, paddingTop: 60 },
  emptyText: { fontSize: 15, color: '#888', textAlign: 'center' },
  emptySubtext: { fontSize: 14, color: '#555', textAlign: 'center' },
});
