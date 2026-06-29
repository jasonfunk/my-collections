import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../src/hooks/useAuth';
import {
  disablePushNotifications,
  enablePushNotifications,
  isStoredPushEnabled,
  getPushPermissionStatus,
  type PermissionStatus,
} from '../../../src/services/pushNotificationService';

export default function SettingsScreen() {
  const { user, logout } = useAuth();

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('undetermined');
  const [toggling, setToggling] = useState(false);
  const [loadingState, setLoadingState] = useState(true);

  const loadState = useCallback(async () => {
    const [enabled, status] = await Promise.all([
      isStoredPushEnabled(),
      getPushPermissionStatus(),
    ]);
    setNotificationsEnabled(enabled);
    setPermissionStatus(status);
    setLoadingState(false);
  }, []);

  useEffect(() => {
    void loadState();
  }, [loadState]);

  const handleToggle = useCallback(async (value: boolean) => {
    setToggling(true);
    try {
      if (value) {
        const result = await enablePushNotifications();
        if (result.success) {
          setNotificationsEnabled(true);
          setPermissionStatus('granted');
        } else if (result.systemDenied) {
          Alert.alert(
            'Permission required',
            'Notifications are blocked. Open Android Settings → App info → Notifications to enable them.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => void Linking.openSettings() },
            ],
          );
        }
      } else {
        await disablePushNotifications();
        setNotificationsEnabled(false);
      }
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Something went wrong. Try again.');
    } finally {
      setToggling(false);
    }
  }, []);

  if (loadingState) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  const permissionLabel =
    permissionStatus === 'granted'
      ? 'Allowed'
      : permissionStatus === 'denied'
        ? 'Blocked — open Android Settings to enable'
        : 'Not yet requested';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>Settings</Text>

        <Text style={styles.sectionLabel}>Notifications</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Push notifications</Text>
              <Text style={styles.rowSubtitle}>{permissionLabel}</Text>
            </View>
            {toggling ? (
              <ActivityIndicator size="small" color="#6366f1" />
            ) : (
              <Switch
                value={notificationsEnabled}
                onValueChange={(v) => void handleToggle(v)}
                trackColor={{ false: '#333', true: '#6366f1' }}
                thumbColor="#fff"
                disabled={toggling}
              />
            )}
          </View>
          {permissionStatus === 'denied' && (
            <TouchableOpacity
              style={styles.openSettingsButton}
              onPress={() => void Linking.openSettings()}
            >
              <Text style={styles.openSettingsText}>Open Android Settings</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowTitle}>Signed in as</Text>
            <Text style={styles.rowValue}>{user?.email}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={() => void logout()}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f0f0f' },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, backgroundColor: '#0f0f0f', justifyContent: 'center', alignItems: 'center' },

  pageTitle: { fontSize: 26, fontWeight: 'bold', color: '#fff', marginBottom: 28 },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },

  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 24,
    overflow: 'hidden',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  rowText: { flex: 1, marginRight: 12 },
  rowTitle: { fontSize: 15, color: '#fff', marginBottom: 2 },
  rowSubtitle: { fontSize: 12, color: '#888' },
  rowValue: { fontSize: 13, color: '#888' },

  openSettingsButton: {
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
    padding: 14,
    alignItems: 'center',
  },
  openSettingsText: { fontSize: 14, color: '#6366f1' },

  signOutButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  signOutText: { fontSize: 15, color: '#ef4444', fontWeight: '600' },
});
