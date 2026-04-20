import { View, Text, StyleSheet } from 'react-native';

export default function WishlistScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Wishlist</Text>
      <Text style={styles.placeholder}>Items you're hunting for — coming soon.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f', padding: 24, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 12 },
  placeholder: { color: '#666', fontSize: 15 },
});
