import { View, Text, StyleSheet } from 'react-native';

/**
 * Placeholder home screen. Will become the collection dashboard
 * showing counts and recent additions across all collections.
 */
export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Collections</Text>
      <Text style={styles.subtitle}>Your collection dashboard will appear here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});
