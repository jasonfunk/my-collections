import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CollectionType } from '@my-collections/shared';
import { CollectionIcon } from '../../../src/components/CollectionIcon';
import { COLLECTION_CONFIG } from '../../../src/config/collections';

const COLLECTION_TYPES: CollectionType[] = [
  CollectionType.STAR_WARS,
  CollectionType.TRANSFORMERS,
  CollectionType.HE_MAN,
];

export default function CollectionsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Collections</Text>
        {COLLECTION_TYPES.map(type => {
          const { label, color, subtitle, slug } = COLLECTION_CONFIG[type];
          return (
            <TouchableOpacity
              key={type}
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => router.push(`/(app)/collections/${slug}`)}
            >
              <View style={[styles.cardAccent, { backgroundColor: color }]} />
              <View style={styles.cardBody}>
                <CollectionIcon type={type} size={36} />
                <View style={styles.cardText}>
                  <Text style={styles.cardLabel}>{label}</Text>
                  <Text style={styles.cardSubtitle}>{subtitle}</Text>
                </View>
                <Text style={[styles.arrow, { color }]}>{'›'}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f0f0f' },
  content: { padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardAccent: { width: 4 },
  cardBody: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  cardText: { flex: 1 },
  cardLabel: { fontSize: 17, fontWeight: '600', color: '#fff', marginBottom: 2 },
  cardSubtitle: { fontSize: 11, color: '#888' },
  arrow: { fontSize: 28, fontWeight: '300' },
});
