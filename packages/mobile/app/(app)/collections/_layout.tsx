import { Stack } from 'expo-router';

export default function CollectionsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#0f0f0f' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
      }}
    />
  );
}
