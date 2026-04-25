import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {
  type DetailItem,
  type UpdateItemPayload,
  deleteItem,
  fetchItemDetail,
  updateItem,
} from '../../../../../src/services/collectionsService';
import { SLUG_TO_COLLECTION } from '../../../../../src/config/collections';
import { ItemForm, buildPayload, type FormState } from '../../../../../src/components/ItemForm';
import { apiClient } from '../../../../../src/api/client';
import { CollectionType } from '@my-collections/shared';

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

function itemToFormState(item: DetailItem): FormState {
  return {
    isOwned: item.isOwned,
    wishlistPriority: item.wishlistPriority ?? '',
    condition: item.condition ?? 'C8',
    packagingCondition: item.packagingCondition ?? 'NONE',
    isComplete: item.isComplete,
    ownedAccessories: item.ownedAccessories ?? [],
    isCarded: item.isCarded ?? false,
    isBoxed: item.isBoxed ?? false,
    hasInstructions: item.hasInstructions ?? false,
    hasTechSpec: item.hasTechSpec ?? false,
    rubSign: item.rubSign === null || item.rubSign === undefined ? '' : String(item.rubSign),
    hasBackCard: item.hasBackCard ?? false,
    acquisitionSource: item.acquisitionSource ?? '',
    acquisitionDate: item.acquisitionDate ?? '',
    acquisitionPrice: item.acquisitionPrice != null ? String(item.acquisitionPrice) : '',
    estimatedValue: item.estimatedValue != null ? String(item.estimatedValue) : '',
    notes: item.notes ?? '',
    photoUrls: item.photoUrls ?? [],
  };
}

export default function EditItemScreen() {
  const { collection: slug, id } = useLocalSearchParams<{ collection: string; id: string }>();
  const router = useRouter();
  const collectionType = SLUG_TO_COLLECTION[slug ?? ''];

  const [item, setItem] = useState<DetailItem | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const loadItem = useCallback(async () => {
    if (collectionType === undefined || !id) return;
    setLoadError(null);
    try {
      const data = await fetchItemDetail(collectionType, id);
      setItem(data);
      setForm(itemToFormState(data));
    } catch {
      setLoadError('Failed to load item. Tap to retry.');
    } finally {
      setLoading(false);
    }
  }, [collectionType, id]);

  useEffect(() => { void loadItem(); }, [loadItem]);

  async function handleAddPhoto() {
    Alert.alert('Add Photo', '', [
      {
        text: 'Camera',
        onPress: async () => {
          const perm = await ImagePicker.requestCameraPermissionsAsync();
          if (!perm.granted) {
            Alert.alert('Permission needed', 'Camera access is required to take photos.');
            return;
          }
          const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 });
          await uploadPickerResult(result);
        },
      },
      {
        text: 'Photo Library',
        onPress: async () => {
          const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!perm.granted) {
            Alert.alert('Permission needed', 'Photo library access is required.');
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            quality: 0.8,
          });
          await uploadPickerResult(result);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  async function uploadPickerResult(result: ImagePicker.ImagePickerResult) {
    if (result.canceled || result.assets.length === 0) return;
    const asset = result.assets[0];
    if (!asset.mimeType?.startsWith('image/')) {
      Alert.alert('Invalid file', 'Please select an image file.');
      return;
    }
    if (asset.fileSize !== undefined && asset.fileSize > MAX_PHOTO_BYTES) {
      Alert.alert('File too large', 'Photos must be under 10 MB.');
      return;
    }
    setUploadingPhoto(true);
    try {
      const ext = asset.uri.split('.').pop() ?? 'jpg';
      const formData = new FormData();
      formData.append('file', { uri: asset.uri, name: `photo.${ext}`, type: asset.mimeType ?? 'image/jpeg' } as unknown as Blob);
      const { url } = await apiClient.multipartPost<{ url: string }>('/collections/photos/upload', formData);
      setForm(prev => prev ? { ...prev, photoUrls: [...prev.photoUrls, url] } : prev);
    } catch {
      Alert.alert('Upload failed', 'Could not upload photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleSubmit() {
    if (!form || collectionType === undefined || !id) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const dto: UpdateItemPayload = buildPayload(form, collectionType as CollectionType) as UpdateItemPayload;
      await updateItem(collectionType, id, dto);
      router.back();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save changes.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleDelete() {
    const name = item?.catalog?.name ?? 'this item';
    Alert.alert(
      'Remove Item',
      `Remove ${name} from your collection? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            if (collectionType === undefined || !id) return;
            try {
              await deleteItem(collectionType, id);
              router.replace(`/(app)/collections/${slug}`);
            } catch {
              Alert.alert('Error', 'Failed to remove item. Please try again.');
            }
          },
        },
      ],
    );
  }

  const title = item?.catalog?.name ?? 'Edit Item';

  if (collectionType === undefined) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: 'Edit Item' }} />
        <Text style={styles.errorText}>Unknown collection.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: 'Edit Item' }} />
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (loadError || !form) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: 'Edit Item' }} />
        <TouchableOpacity onPress={() => { setLoading(true); void loadItem(); }}>
          <Text style={styles.errorText}>{loadError ?? 'Item not found.'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Stack.Screen options={{ title }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ItemForm
            collectionType={collectionType as CollectionType}
            accessoryOptions={item?.catalog?.accessories ?? []}
            value={form}
            onChange={patch => setForm(prev => prev ? { ...prev, ...patch } : prev)}
            uploadingPhoto={uploadingPhoto}
            onAddPhoto={() => void handleAddPhoto()}
            onRemovePhoto={i => setForm(prev => prev ? { ...prev, photoUrls: prev.photoUrls.filter((_, idx) => idx !== i) } : prev)}
          />

          {submitError && <Text style={styles.errorText}>{submitError}</Text>}

          <TouchableOpacity
            testID="edit-item-save"
            style={[styles.submitBtn, submitting && styles.btnDisabled]}
            onPress={() => void handleSubmit()}
            disabled={submitting}
            activeOpacity={0.8}
          >
            <Text style={styles.submitBtnText}>{submitting ? 'Saving…' : 'Save Changes'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.deleteBtn, submitting && styles.btnDisabled]}
            onPress={handleDelete}
            disabled={submitting}
            activeOpacity={0.8}
          >
            <Text style={styles.deleteBtnText}>Remove from Collection</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f0f0f' },
  centered: { flex: 1, backgroundColor: '#0f0f0f', justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 14, color: '#ef4444', textAlign: 'center', marginVertical: 8 },

  content: { padding: 16, paddingBottom: 40 },
  submitBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  submitBtnText: { fontSize: 16, color: '#fff', fontWeight: '700' },
  deleteBtn: {
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  deleteBtnText: { fontSize: 15, color: '#ef4444', fontWeight: '600' },
  btnDisabled: { opacity: 0.6 },
});
