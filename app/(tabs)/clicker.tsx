import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Platform, Vibration, Switch, Animated } from 'react-native';
import { palette, spacing, radius, shadow, typography, hitSlop } from '../../constants/Design';
import PrimaryButton from '../../components/ui/PrimaryButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { ModalSheet } from '../../components/ui/ModalSheet';
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
  const [renameFor, setRenameFor] = useState<ClickVar | null>(null);
  const [renameText, setRenameText] = useState('');
  const renameInputRef = useRef<TextInput | null>(null);
  const [didSelectAll, setDidSelectAll] = useState(false);
  const [hapticsOn, setHapticsOn] = useState(true);
  const scaleRefs = useRef<Record<string, Animated.Value>>({});
  const incDelayRefs = useRef<Record<string, any>>({});
  const incIntervalRefs = useRef<Record<string, any>>({});
  const decDelayRefs = useRef<Record<string, any>>({});
  const decIntervalRefs = useRef<Record<string, any>>({});

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
  const hRaw = await AsyncStorage.getItem('clicker:settings:haptics');
  if (!cancelled && hRaw != null) setHapticsOn(hRaw === '1');
      } catch {}
      if (!cancelled) setHydrated(true);
    })();
    return () => { cancelled = true; };
  }, [storageKey]);

  const canAdd = useMemo(() => newName.trim().length > 0 && !items.some(i => i.name.toLowerCase() === newName.trim().toLowerCase()), [newName, items]);

  const buzz = useCallback((ms = 10) => {
    if (!hapticsOn) return;
    try { Vibration.vibrate(ms); } catch {}
  }, [hapticsOn]);

  const getScale = useCallback((id: string) => {
    if (!scaleRefs.current[id]) {
      scaleRefs.current[id] = new Animated.Value(1);
    }
    return scaleRefs.current[id];
  }, []);

  const bump = useCallback((id: string) => {
    const v = getScale(id);
    Animated.sequence([
      Animated.timing(v, { toValue: 1.1, duration: 80, useNativeDriver: true }),
      Animated.timing(v, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
  }, [getScale]);

  const addItem = useCallback(() => {
    const name = newName.trim();
    if (!name) return;
    if (items.some(i => i.name.toLowerCase() === name.toLowerCase())) {
      Alert.alert('Duplicate', 'A variable with that name already exists.');
      return;
    }
    const id = `${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    setItems(prev => [...prev, { id, name, count: 0 }]);
    setNewName('');
    buzz(10);
  }, [newName, items, buzz]);

  const changeCount = useCallback((id: string, delta: number, doBuzz: boolean) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, count: Math.max(0, i.count + delta) } : i));
    bump(id);
    if (doBuzz) buzz(6);
  }, [bump, buzz]);

  const increment = useCallback((id: string) => {
    changeCount(id, 1, true);
  }, [changeCount]);

  const decrement = useCallback((id: string) => {
    changeCount(id, -1, true);
  }, [changeCount]);

  // Press-and-hold handlers
  const startAutoInc = useCallback((id: string) => {
    // delay before starting fast repeat
    incDelayRefs.current[id] = setTimeout(() => {
      incIntervalRefs.current[id] = setInterval(() => changeCount(id, 1, false), 80);
    }, 300);
  }, [changeCount]);

  const stopAutoInc = useCallback((id: string) => {
    if (incDelayRefs.current[id]) { clearTimeout(incDelayRefs.current[id]); incDelayRefs.current[id] = null; }
    if (incIntervalRefs.current[id]) { clearInterval(incIntervalRefs.current[id]); incIntervalRefs.current[id] = null; }
  }, []);

  const startAutoDec = useCallback((id: string) => {
    decDelayRefs.current[id] = setTimeout(() => {
      decIntervalRefs.current[id] = setInterval(() => changeCount(id, -1, false), 80);
    }, 300);
  }, [changeCount]);

  const stopAutoDec = useCallback((id: string) => {
    if (decDelayRefs.current[id]) { clearTimeout(decDelayRefs.current[id]); decDelayRefs.current[id] = null; }
    if (decIntervalRefs.current[id]) { clearInterval(decIntervalRefs.current[id]); decIntervalRefs.current[id] = null; }
  }, []);

  const resetAll = () => {
    Alert.alert('Reset counters', 'This will clear all variables and restore defaults. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: async () => {
        setItems(defaults.map(d => ({ ...d })));
        try { await AsyncStorage.removeItem(storageKey); } catch {}
      } },
    ]);
  };

  const confirmDelete = useCallback((id: string, name: string) => {
    Alert.alert('Delete variable', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel', onPress: () => swipeRefs.current[id]?.close?.() },
      { text: 'Delete', style: 'destructive', onPress: () => {
    setItems(prev => prev.filter(i => i.id !== id));
    buzz(12);
      }},
    ]);
  }, [buzz]);

  const openRename = useCallback((item: ClickVar) => {
    setRenameFor(item);
    setRenameText(item.name);
    setDidSelectAll(false);
    buzz(8);
  }, [buzz]);

  const applyRename = useCallback(() => {
    const next = renameText.trim();
    if (!renameFor) return;
    if (!next) { setRenameFor(null); return; }
    if (items.some(i => i.id !== renameFor.id && i.name.toLowerCase() === next.toLowerCase())) {
      Alert.alert('Duplicate', 'Another variable already has that name.');
      return;
    }
    setItems(prev => prev.map(i => i.id === renameFor.id ? { ...i, name: next } : i));
    setRenameFor(null);
    buzz(8);
  }, [renameText, renameFor, items, buzz]);

  // Persist on changes
  useEffect(() => {
    if (!hydrated) return; // avoid overwriting before initial load
    (async () => {
      try { await AsyncStorage.setItem(storageKey, JSON.stringify(items)); } catch {}
    })();
  }, [items, storageKey, hydrated]);

  useEffect(() => {
    return () => {
      // cleanup timers
      Object.keys(incDelayRefs.current).forEach((k) => incDelayRefs.current[k] && clearTimeout(incDelayRefs.current[k]));
      Object.keys(decDelayRefs.current).forEach((k) => decDelayRefs.current[k] && clearTimeout(decDelayRefs.current[k]));
      Object.keys(incIntervalRefs.current).forEach((k) => incIntervalRefs.current[k] && clearInterval(incIntervalRefs.current[k]));
      Object.keys(decIntervalRefs.current).forEach((k) => decIntervalRefs.current[k] && clearInterval(decIntervalRefs.current[k]));
    };
  }, []);

  // Persist haptics setting
  useEffect(() => {
    (async () => {
      try { await AsyncStorage.setItem('clicker:settings:haptics', hapticsOn ? '1' : '0'); } catch {}
    })();
  }, [hapticsOn]);

  const renderAction = (item: ClickVar, side: 'left' | 'right') => (
    <TouchableOpacity
      style={[styles.swipeAction, side === 'left' ? styles.actionLeft : styles.actionRight]}
      onPress={() => {
        if (side === 'left') {
          openRename(item);
        } else {
          confirmDelete(item.id, item.name);
        }
        swipeRefs.current[item.id]?.close?.();
      }}
      activeOpacity={0.8}
    >
      <Text style={styles.actionText}>{side === 'left' ? 'Rename' : 'Remove'}</Text>
    </TouchableOpacity>
  );

  const renderItem = ({ item, drag, isActive }: RenderItemParams<ClickVar>) => {
    const content = (
      <TouchableOpacity
        style={[styles.card, isActive ? styles.dragActive : undefined]}
        onPress={() => increment(item.id)}
        activeOpacity={0.85}
      >
        <Text style={styles.varName} numberOfLines={1}>{item.name}</Text>
        <View style={styles.counterRow}>
          <TouchableOpacity
            onPress={() => decrement(item.id)}
            onPressIn={() => startAutoDec(item.id)}
            onPressOut={() => stopAutoDec(item.id)}
            style={styles.iconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Decrement"
          >
            <Ionicons name="remove-circle" size={28} color={palette.danger || '#d9534f'} />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={1}
            onLongPress={() => {
              Alert.alert('Reset counter', `Reset "${item.name}" to 0?`, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Reset', style: 'destructive', onPress: () => changeCount(item.id, -item.count, true) },
              ]);
            }}
          >
            <Animated.Text style={[styles.countCentered, { transform: [{ scale: getScale(item.id) }] }]}>{item.count}</Animated.Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => increment(item.id)}
            onPressIn={() => startAutoInc(item.id)}
            onPressOut={() => stopAutoInc(item.id)}
            style={styles.iconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Increment"
          >
            <Ionicons name="add-circle" size={28} color={palette.success} />
          </TouchableOpacity>
          <TouchableOpacity onPressIn={drag} style={styles.dragHandle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityLabel="Reorder">
            <Ionicons name="reorder-three-outline" size={24} color={palette.textMuted} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
    // Use Swipeable on all platforms now that the native module is present
    return (
      <Swipeable
        ref={(ref) => { swipeRefs.current[item.id] = ref; }}
        renderLeftActions={() => renderAction(item, 'left')}
        renderRightActions={() => renderAction(item, 'right')}
        leftThreshold={48}
        rightThreshold={48}
        friction={2}
        onSwipeableWillClose={() => { /* no-op */ }}
      >
        {content}
      </Swipeable>
    );
  };

  const footer = (
    <View style={{ paddingTop: spacing(2), paddingBottom: Math.max(insets.bottom, spacing(8)) }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing(2) }}>
        <Text style={{ color: palette.text, fontWeight: '600' }}>Haptics</Text>
        <Switch
          value={hapticsOn}
          onValueChange={setHapticsOn}
          thumbColor={Platform.OS === 'android' ? (hapticsOn ? palette.primary : '#eee') : undefined}
          trackColor={{ false: '#999', true: palette.primary }}
        />
      </View>
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

      <ModalSheet visible={!!renameFor} onClose={() => setRenameFor(null)}>
        <Text style={styles.renameTitle}>Rename variable</Text>
        <TextInput
          ref={renameInputRef}
          value={renameText}
          onChangeText={setRenameText}
          placeholder="New name"
          placeholderTextColor={palette.textMuted}
          style={[styles.input, { marginBottom: spacing(2) }]}
          autoFocus
          onFocus={() => {
            // Select all once on initial focus; do not force selection on every render
            if (didSelectAll) return;
            setTimeout(() => {
              try {
                const len = renameText.length;
                renameInputRef.current?.setNativeProps?.({ selection: { start: 0, end: len } });
                setDidSelectAll(true);
              } catch {}
            }, 0);
          }}
          onSubmitEditing={applyRename}
        />
        <View style={{ flexDirection: 'row', gap: spacing(2) as any }}>
          <TouchableOpacity style={[styles.smallBtn, { backgroundColor: palette.surface }]} onPress={() => setRenameFor(null)}>
            <Text style={{ color: palette.text }}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.smallBtn, { backgroundColor: palette.primary }]} onPress={applyRename}>
            <Text style={{ color: '#fff' }}>Save</Text>
          </TouchableOpacity>
        </View>
      </ModalSheet>
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
  swipeAction: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing(3),
    borderRadius: radius.lg,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  actionLeft: { width: 100, marginRight: spacing(2) },
  actionRight: { width: 100, marginLeft: spacing(2), alignSelf: 'flex-end' },
  actionText: { color: palette.text, fontWeight: '700' },
  dragActive: { opacity: 0.9, transform: [{ scale: 0.98 }] as any },
  renameTitle: { fontWeight: '800', marginBottom: spacing(2), color: palette.text },
  smallBtn: { paddingVertical: spacing(2.5), paddingHorizontal: spacing(4), borderRadius: radius.md },
});
