import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Platform } from 'react-native';
import { palette, spacing, radius, shadow, typography, hitSlop } from '../../constants/Design';
import PrimaryButton from '../../components/ui/PrimaryButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ClickVar = { id: string; name: string; count: number };

// Default variables sourced from QR SKUs + a few SRD key metrics
const QR_SKUS = [
  { key: 'salesKegs330', label: 'Kegs 330' },
  { key: 'salesKegs500', label: 'Kegs 500' },
  { key: 'salesMd500', label: 'Microdraught 500' },
  { key: 'salesGdic400', label: 'GDIC 400' },
  { key: 'salesSmoothPint330', label: 'Smooth Pint 330' },
  { key: 'salesSmoothCan330', label: 'Smooth Can 330' },
  { key: 'salesGfesPint330', label: 'GFES Pint 330' },
  { key: 'salesGfesCan330', label: 'GFES Can 330' },
  { key: 'salesGfesQuart620', label: 'GFES Quart 620' },
  { key: 'salesGfesCanbig500', label: 'GFES Can Big 500' },
];
const SRD_MAIN = [
  { key: 'visitorsOverall', label: 'Visitors Overall' },
  { key: 'drinkersSmooth', label: 'Drinkers Smooth' },
  { key: 'drinkersGfes', label: 'Drinkers GFES' },
  { key: 'drinkersKegs', label: 'Drinkers Kegs' },
  { key: 'drinkersMicrodraught', label: 'Drinkers Microdraught' },
  { key: 'totalGuinnessSales', label: 'Total Guinness Sales' },
];

const defaults: ClickVar[] = [
  ...QR_SKUS.map(v => ({ id: v.key, name: v.label, count: 0 })),
  ...SRD_MAIN.map(v => ({ id: v.key, name: v.label, count: 0 })),
];

export default function ClickerScreen() {
  const [items, setItems] = useState<ClickVar[]>(defaults);
  const [newName, setNewName] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid || null);
  const prevUidRef = useRef<string | null>(uid);
  const storageKey = useMemo(() => `clicker:items:${uid || 'anon'}`, [uid]);
  const swipeRefs = useRef<Record<string, Swipeable | null>>({});
  const insets = useSafeAreaInsets();

  // Hydrate from storage on mount and when user changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      const nextUid = user?.uid || null;
      const prevUid = prevUidRef.current;
      // If logging out (had UID, now null): clear stored data and reset
      if (prevUid && !nextUid) {
        try { await AsyncStorage.removeItem(`clicker:items:${prevUid}`); } catch {}
        setItems(defaults.map(d => ({ ...d })));
      }
      prevUidRef.current = nextUid;
      setUid(nextUid);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(storageKey);
        if (!cancelled && raw) {
          const parsed = JSON.parse(raw) as ClickVar[];
          if (Array.isArray(parsed)) setItems(parsed);
        }
      } catch {}
      if (!cancelled) setHydrated(true);
    })();
    return () => { cancelled = true; };
  }, [storageKey]);

  const canAdd = useMemo(() => newName.trim().length > 0 && !items.some(i => i.name.toLowerCase() === newName.trim().toLowerCase()), [newName, items]);

  const addItem = () => {
    const name = newName.trim();
    if (!name) return;
    if (items.some(i => i.name.toLowerCase() === name.toLowerCase())) {
      Alert.alert('Duplicate', 'A variable with that name already exists.');
      return;
    }
    const id = `${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    setItems(prev => [...prev, { id, name, count: 0 }]);
    setNewName('');
  };

  const increment = (id: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, count: i.count + 1 } : i));
  };

  const resetAll = () => {
    Alert.alert('Reset counters', 'This will clear all variables and restore defaults. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: async () => {
        setItems(defaults.map(d => ({ ...d })));
        try { await AsyncStorage.removeItem(storageKey); } catch {}
      } },
    ]);
  };

  const confirmDelete = (id: string, name: string) => {
    Alert.alert('Delete variable', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel', onPress: () => swipeRefs.current[id]?.close?.() },
      { text: 'Delete', style: 'destructive', onPress: () => {
        setItems(prev => prev.filter(i => i.id !== id));
      }},
    ]);
  };

  // Persist on changes
  useEffect(() => {
    if (!hydrated) return; // avoid overwriting before initial load
    (async () => {
      try { await AsyncStorage.setItem(storageKey, JSON.stringify(items)); } catch {}
    })();
  }, [items, storageKey, hydrated]);

  const renderAction = (id: string, name: string, side: 'left' | 'right') => (
    <TouchableOpacity
      style={[styles.deleteAction, side === 'left' ? styles.actionLeft : styles.actionRight]}
      onPress={() => confirmDelete(id, name)}
      activeOpacity={0.8}
    >
      <Text style={styles.deleteText}>Delete</Text>
    </TouchableOpacity>
  );

  const renderItem = ({ item, drag, isActive }: RenderItemParams<ClickVar>) => (
    Platform.OS !== 'android' ? (
      <Swipeable
        ref={(ref) => { swipeRefs.current[item.id] = ref; }}
        renderLeftActions={() => renderAction(item.id, item.name, 'left')}
        renderRightActions={() => renderAction(item.id, item.name, 'right')}
        onSwipeableOpen={() => confirmDelete(item.id, item.name)}
      >
        <TouchableOpacity
          style={[styles.card, isActive ? styles.dragActive : undefined]}
          onPress={() => increment(item.id)}
          activeOpacity={0.85}
        >
          <Text style={styles.varName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.counterRow}>
            <TouchableOpacity onPress={() => increment(item.id)} style={styles.iconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="add-circle" size={28} color={palette.success} />
            </TouchableOpacity>
            <Text style={styles.countCentered}>{item.count}</Text>
            <TouchableOpacity onPressIn={drag} style={styles.dragHandle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="reorder-three-outline" size={24} color={palette.textMuted} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Swipeable>
    ) : (
      <TouchableOpacity
        style={[styles.card, isActive ? styles.dragActive : undefined]}
        onPress={() => increment(item.id)}
        activeOpacity={0.85}
      >
        <Text style={styles.varName} numberOfLines={1}>{item.name}</Text>
        <View style={styles.counterRow}>
          <TouchableOpacity onPress={() => increment(item.id)} style={styles.iconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="add-circle" size={28} color={palette.success} />
          </TouchableOpacity>
          <Text style={styles.countCentered}>{item.count}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPressIn={drag} style={styles.dragHandle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="reorder-three-outline" size={24} color={palette.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => confirmDelete(item.id, item.name)} style={[styles.iconBtn, { marginLeft: spacing(1) }]} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="trash-outline" size={22} color="#E53935" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    )
  );

  const footer = (
    <View style={{ paddingTop: spacing(2), paddingBottom: Math.max(insets.bottom, spacing(8)) }}>
      <PrimaryButton title="Reset" onPress={resetAll} />
    </View>
  );

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Clicker</Text>
        <TextInput
          placeholder="New variable..."
          placeholderTextColor={palette.textMuted}
          value={newName}
          onChangeText={setNewName}
          style={[styles.input, styles.headerInput]}
        />
        <TouchableOpacity
          onPress={addItem}
          disabled={!canAdd}
          style={[styles.addIconBtn, !canAdd && { opacity: 0.4 }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Add variable"
        >
          <Ionicons name="add-circle" size={28} color={palette.primary} />
        </TouchableOpacity>
      </View>

      <DraggableFlatList
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        onDragEnd={({ data }) => setItems(data)}
        activationDistance={8}
        ListFooterComponent={footer}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, spacing(8)) }}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bg, paddingTop: spacing(10), paddingHorizontal: spacing(6) },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing(2), marginBottom: spacing(2) } as any,
  header: { ...typography.h1, color: palette.text, marginBottom: 0, flexShrink: 0 },
  addRow: { marginBottom: spacing(3) },
  input: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(3),
    backgroundColor: palette.surface,
    color: palette.text,
    marginBottom: spacing(2),
  },
  headerInput: { flex: 1, marginBottom: 0 },
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    padding: spacing(4),
    marginBottom: spacing(3),
    borderWidth: 1,
    borderColor: palette.border,
    ...shadow.card,
  },
  varName: { fontWeight: '700', color: palette.text, marginBottom: spacing(1) },
  counterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  count: { fontSize: 24, fontWeight: '800', color: palette.text },
  counterGroup: { flexDirection: 'row', alignItems: 'center', gap: spacing(2) } as any,
  countCentered: { fontSize: 26, fontWeight: '800', color: palette.text, textAlign: 'center', flex: 1 },
  iconBtn: { paddingHorizontal: spacing(1), paddingVertical: spacing(1) },
  addIconBtn: { paddingHorizontal: spacing(1), paddingVertical: spacing(1) },
  dragHandle: { paddingHorizontal: spacing(2), paddingVertical: spacing(1) },
  deleteAction: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E53935',
    marginBottom: spacing(3),
    borderRadius: radius.lg,
  },
  actionLeft: { width: 100, marginRight: spacing(2) },
  actionRight: { width: 100, marginLeft: spacing(2), alignSelf: 'flex-end' },
  deleteText: { color: 'white', fontWeight: '700' },
  dragActive: { opacity: 0.9, transform: [{ scale: 0.98 }] as any },
});
