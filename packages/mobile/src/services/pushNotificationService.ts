import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { apiClient } from '../api/client';

const PUSH_ENABLED_KEY = 'push_notifications_enabled';

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

export async function getPushPermissionStatus(): Promise<PermissionStatus> {
  const { status } = await Notifications.getPermissionsAsync();
  return status as PermissionStatus;
}

export async function isStoredPushEnabled(): Promise<boolean> {
  const val = await SecureStore.getItemAsync(PUSH_ENABLED_KEY);
  return val === 'true';
}

export interface EnableResult {
  success: boolean;
  systemDenied?: boolean;
}

export async function enablePushNotifications(): Promise<EnableResult> {
  // Android requires a channel before the permission prompt appears
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'My Collections',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return { success: false, systemDenied: true };
  }

  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
  if (!projectId) throw new Error('EAS Project ID not found in app.json');

  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });

  await apiClient.post<void>('/users/me/push-token', { token, platform: 'android' });
  await SecureStore.setItemAsync(PUSH_ENABLED_KEY, 'true');

  return { success: true };
}

export async function disablePushNotifications(): Promise<void> {
  await SecureStore.deleteItemAsync(PUSH_ENABLED_KEY);
}
