import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../../src/hooks/useAuth';

export default function DashboardScreen() {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Welcome back</Text>
      <Text style={styles.email}>{user?.email}</Text>
      <Text style={styles.placeholder}>
        Dashboard coming soon — collection stats, recent additions, and value summary.
      </Text>
      <TouchableOpacity style={styles.signOut} onPress={() => void logout()}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f', padding: 24, paddingTop: 60 },
  greeting: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  email: { fontSize: 14, color: '#888', marginBottom: 32 },
  placeholder: { color: '#666', fontSize: 15, lineHeight: 22 },
  signOut: { marginTop: 'auto', padding: 16, alignItems: 'center' },
  signOutText: { color: '#ef4444', fontSize: 15 },
});
