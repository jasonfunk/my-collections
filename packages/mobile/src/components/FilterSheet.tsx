import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export type StatusFilter = 'all' | 'owned' | 'wishlist';

export interface BrowseFilters {
  status: StatusFilter;
}

interface Props {
  visible: boolean;
  filters: BrowseFilters;
  onApply: (filters: BrowseFilters) => void;
  onClose: () => void;
}

const SHEET_HEIGHT = 260;

const STATUS_OPTIONS: { label: string; value: StatusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Owned', value: 'owned' },
  { label: 'Wishlist', value: 'wishlist' },
];

export function FilterSheet({ visible, filters, onApply, onClose }: Props) {
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const [draft, setDraft] = useState<BrowseFilters>(filters);

  useEffect(() => {
    if (visible) {
      setDraft(filters);
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: SHEET_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, filters, translateY]);

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        <View style={styles.handle} />
        <Text style={styles.heading}>Filter</Text>

        <Text style={styles.sectionLabel}>STATUS</Text>
        <View style={styles.optionsRow}>
          {STATUS_OPTIONS.map(({ label, value }) => (
            <TouchableOpacity
              key={value}
              style={[styles.option, draft.status === value && styles.optionActive]}
              onPress={() => setDraft(d => ({ ...d, status: value }))}
              activeOpacity={0.7}
            >
              <Text style={[styles.optionText, draft.status === value && styles.optionTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.resetBtn}
            onPress={() => setDraft({ status: 'all' })}
            activeOpacity={0.7}
          >
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.applyBtn}
            onPress={() => onApply(draft)}
            activeOpacity={0.8}
          >
            <Text style={styles.applyText}>Apply</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    height: SHEET_HEIGHT,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#444',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#888',
    letterSpacing: 1,
    marginBottom: 10,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  option: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  optionActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  optionText: {
    fontSize: 14,
    color: '#888',
  },
  optionTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  resetBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    alignItems: 'center',
  },
  resetText: {
    color: '#888',
    fontSize: 15,
  },
  applyBtn: {
    flex: 2,
    paddingVertical: 12,
    backgroundColor: '#6366f1',
    borderRadius: 10,
    alignItems: 'center',
  },
  applyText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
