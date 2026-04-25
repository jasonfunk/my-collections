import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { CollectionType } from '@my-collections/shared';
import {
  type CatalogItem,
  type CreateItemPayload,
  createItem,
  searchCatalog,
} from '../../../../src/services/collectionsService';
import { SLUG_TO_COLLECTION } from '../../../../src/config/collections';
import { ItemForm, defaultFormState, buildPayload, type FormState } from '../../../../src/components/ItemForm';
import { apiClient } from '../../../../src/api/client';

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const DEBOUNCE_MS = 300;

type Step = 'search' | 'form';

export default function AddItemScreen() {
  const { collection: slug } = useLocalSearchParams<{ collection: string }>();
  const router = useRouter();
  const collectionType = SLUG_TO_COLLECTION[slug ?? ''];

  const [step, setStep] = useState<Step>('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CatalogItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedCatalog, setSelectedCatalog] = useState<CatalogItem | null>(null);
  const [form, setForm] = useState<FormState>(defaultFormState);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Android back button: on form step, go back to search
  useEffect(() => {
    if (step !== 'form') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setStep('search');
      return true;
    });
    return () => sub.remove();
  }, [step]);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim() || collectionType === undefined) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const data = await searchCatalog(collectionType, q.trim());
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, [collectionType]);

  function handleQueryChange(text: string) {
    setQuery(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => void runSearch(text), DEBOUNCE_MS);
  }

  function handleSelectCatalog(item: CatalogItem) {
    setSelectedCatalog(item);
    setForm(defaultFormState());
    setSubmitError(null);
    setStep('form');
  }

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
      setForm(prev => ({ ...prev, photoUrls: [...prev.photoUrls, url] }));
    } catch {
      Alert.alert('Upload failed', 'Could not upload photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleSubmit() {
    if (!selectedCatalog || collectionType === undefined) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const dto: CreateItemPayload = {
        catalogId: selectedCatalog.id,
        ...buildPayload(form, collectionType as CollectionType) as Omit<CreateItemPayload, 'catalogId'>,
      };
      await createItem(collectionType, dto);
      router.replace(`/(app)/collections/${slug}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save item.');
    } finally {
      setSubmitting(false);
    }
  }

  if (collectionType === undefined) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: 'Add Item' }} />
        <Text style={styles.errorText}>Unknown collection.</Text>
      </View>
    );
  }

  // ── Step 1: Catalog search ─────────────────────────────────────────────────

  if (step === 'search') {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <Stack.Screen options={{ title: 'Select Item' }} />
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={handleQueryChange}
            placeholder="Search catalog…"
            placeholderTextColor="#555"
            autoFocus
            returnKeyType="search"
            onSubmitEditing={() => void runSearch(query)}
          />
          {searching && <ActivityIndicator size="small" color="#6366f1" style={styles.searchSpinner} />}
        </View>

        {!query.trim() ? (
          <View style={styles.centered}>
            <Text style={styles.hintText}>Type to search for an item</Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              !searching ? (
                <View style={styles.centered}>
                  <Text style={styles.hintText}>No results found</Text>
                </View>
              ) : null
            }
            renderItem={({ item, index }) => (
              <TouchableOpacity
                testID={`catalog-result-${index}`}
                style={styles.resultRow}
                onPress={() => handleSelectCatalog(item)}
                activeOpacity={0.7}
              >
                <View>
                  <Text style={styles.resultName}>{item.name}</Text>
                  {item.accessories.length > 0 && (
                    <Text style={styles.resultAccessories}>{item.accessories.length} accessories</Text>
                  )}
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </SafeAreaView>
    );
  }

  // ── Step 2: Personal record form ──────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Stack.Screen options={{ title: selectedCatalog?.name ?? 'Add Item' }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
          <ItemForm
            collectionType={collectionType as CollectionType}
            accessoryOptions={selectedCatalog?.accessories ?? []}
            value={form}
            onChange={patch => setForm(prev => ({ ...prev, ...patch }))}
            uploadingPhoto={uploadingPhoto}
            onAddPhoto={() => void handleAddPhoto()}
            onRemovePhoto={i => setForm(prev => ({ ...prev, photoUrls: prev.photoUrls.filter((_, idx) => idx !== i) }))}
          />

          {submitError && <Text style={styles.errorText}>{submitError}</Text>}

          <TouchableOpacity
            testID="add-item-save"
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={() => void handleSubmit()}
            disabled={submitting}
            activeOpacity={0.8}
          >
            <Text style={styles.submitBtnText}>{submitting ? 'Saving…' : 'Save'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f0f0f' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { fontSize: 14, color: '#ef4444', textAlign: 'center', marginVertical: 8 },
  hintText: { fontSize: 14, color: '#555', textAlign: 'center' },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#222',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#fff',
  },
  searchSpinner: { marginLeft: 10 },
  listContent: { padding: 16 },
  resultRow: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  resultName: { fontSize: 15, color: '#fff', fontWeight: '500' },
  resultAccessories: { fontSize: 12, color: '#888', marginTop: 3 },

  formContent: { padding: 16, paddingBottom: 32 },
  submitBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 16, color: '#fff', fontWeight: '700' },
});
