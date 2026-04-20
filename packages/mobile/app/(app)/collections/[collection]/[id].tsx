import { View, Text, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ collection: string; id: string }>();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Item Detail' }} />
      <Text style={styles.label}>Item ID: {id}</Text>
      <Text style={styles.note}>Full detail coming in COL-49.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f', padding: 24, paddingTop: 40 },
  label: { fontSize: 14, color: '#888', marginBottom: 8 },
  note: { fontSize: 13, color: '#555', marginTop: 16 },
});
