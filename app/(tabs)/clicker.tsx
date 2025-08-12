import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Platform, Vibration, Switch, Animated, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { palette, spacing, radius, shadow, typography, hitSlop } from '../../constants/Design';
import PrimaryButton from '../../components/ui/PrimaryButton';
import SecondaryButton from '../../components/ui/SecondaryButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { ModalSheet } from '../../components/ui/ModalSheet';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { trackEvent } from '../../components/analytics';
import { useEffectiveScheme } from '../../components/ThemePreference';
import { useI18n } from '../../components/I18n';

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
  const scheme = useEffectiveScheme();
  const isDark = scheme === 'dark';
  const { t } = useI18n();
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
  const [stepSize, setStepSize] = useState<1 | 5 | 10>(1);
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
        const sRaw = await AsyncStorage.getItem('clicker:settings:step');
        if (!cancelled && sRaw != null) {
          const val = parseInt(sRaw, 10);
          setStepSize(val === 10 ? 10 : val === 5 ? 5 : 1);
        }
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
  try { trackEvent('clicker_add', { id, name }); } catch {}
  }, [newName, items, buzz]);

  const changeCount = useCallback((id: string, delta: number, doBuzz: boolean) => {
    const applied = delta * stepSize;
    setItems(prev => prev.map(i => i.id === id ? { ...i, count: Math.max(0, i.count + applied) } : i));
    bump(id);
    if (doBuzz) buzz(6);
  }, [bump, buzz, stepSize]);

  const increment = useCallback((id: string) => {
    changeCount(id, 1, true);
    try { trackEvent('clicker_increment', { id, step: stepSize }); } catch {}
  }, [changeCount, stepSize]);

  const decrement = useCallback((id: string) => {
    changeCount(id, -1, true);
    try { trackEvent('clicker_decrement', { id, step: stepSize }); } catch {}
  }, [changeCount, stepSize]);

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
  try { trackEvent('clicker_reset_all'); } catch {}
      } },
    ]);
  };

  const confirmDelete = useCallback((id: string, name: string) => {
    Alert.alert('Delete variable', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel', onPress: () => swipeRefs.current[id]?.close?.() },
      { text: 'Delete', style: 'destructive', onPress: () => {
    setItems(prev => prev.filter(i => i.id !== id));
    buzz(12);
  try { trackEvent('clicker_remove', { id, name }); } catch {}
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
  try { trackEvent('clicker_rename', { id: renameFor.id, from: renameFor.name, to: next }); } catch {}
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

  // Persist step size setting
  useEffect(() => {
    (async () => {
      try { await AsyncStorage.setItem('clicker:settings:step', String(stepSize)); } catch {}
    })();
  }, [stepSize]);
  const renderAction = (item: ClickVar, side: 'left' | 'right') => {
    if (side === 'left') {
      // Left swipe: Rename (neutral)
      return (
        <TouchableOpacity
          style={[styles.swipeAction, styles.actionLeft]}
          onPress={() => {
            openRename(item);
            swipeRefs.current[item.id]?.close?.();
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.actionText}>Rename</Text>
        </TouchableOpacity>
      );
    }
    // Right swipe: show two actions stacked: Decrement (-) and Remove (both red)
    return (
      <View style={[styles.actionStack, styles.actionRight]}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionDanger]}
          onPress={() => {
            changeCount(item.id, -1, true);
            swipeRefs.current[item.id]?.close?.();
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.actionTextLight}>-x{stepSize}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionDanger]}
          onPress={() => {
            confirmDelete(item.id, item.name);
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.actionTextLight}>Remove</Text>
        </TouchableOpacity>
      </View>
    );
  };

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
            onPress={() => increment(item.id)}
            onPressIn={() => startAutoInc(item.id)}
            onPressOut={() => stopAutoInc(item.id)}
            style={styles.iconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Increment"
          >
            <Ionicons name="add-circle" size={28} color={palette.success} />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={1}
            onLongPress={() => {
              Alert.alert('Reset counter', `Reset "${item.name}" to 0?`, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Reset', style: 'destructive', onPress: () => {
                  setItems(prev => prev.map(i => i.id === item.id ? { ...i, count: 0 } : i));
                  bump(item.id);
                  buzz(10);
                  try { trackEvent('clicker_reset_item', { id: item.id, name: item.name }); } catch {}
                } },
              ]);
            }}
          >
            <Animated.Text style={[styles.countCentered, { transform: [{ scale: getScale(item.id) }] }]}>{item.count}</Animated.Text>
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

  const clearCounts = () => {
    Alert.alert('Clear counts', 'Set all counts to zero? Your variables will be kept.', [
      { text: 'Cancel', style: 'cancel' },
  { text: 'Clear', style: 'destructive', onPress: () => { setItems(prev => prev.map(i => ({ ...i, count: 0 }))); try { trackEvent('clicker_clear_counts'); } catch {} } },
    ]);
  };

  const copySummary = async () => {
    try {
      const lines = items.map(i => `${i.name}: ${i.count}`);
      const text = lines.join('\n');
      await Clipboard.setStringAsync(text);
      Alert.alert('Copied', 'Current counters copied to clipboard.');
      try { trackEvent('clicker_copy_summary', { items: items.length }); } catch {}
    } catch (e) {
      Alert.alert('Copy failed', 'Unable to copy to clipboard.');
    }
  };

  const shareSummary = async () => {
    try {
      const lines = items.map(i => `${i.name}: ${i.count}`);
      const text = lines.join('\n');
      await Share.share({ message: text });
      try { trackEvent('clicker_share_summary', { items: items.length }); } catch {}
    } catch (e) {
      // user cancelled or share failed; ignore
    }
  };

  const exportClickerJSON = async () => {
    try {
      const payload = {
        version: 1,
        exportedAt: new Date().toISOString(),
        items: items.map(i => ({ id: i.id, name: i.name, count: i.count })),
        settings: { hapticsOn, stepSize },
      };
      const json = JSON.stringify(payload, null, 2);
      await Clipboard.setStringAsync(json);
      Alert.alert('Exported', 'Clicker data copied to clipboard as JSON.');
      try { trackEvent('clicker_export_json', { items: items.length }); } catch {}
    } catch (e) {
      Alert.alert('Export failed', 'Unable to create export JSON.');
    }
  };

  const importClickerFromClipboard = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      const obj = JSON.parse(text);
      if (!obj || typeof obj !== 'object' || !Array.isArray(obj.items)) throw new Error('invalid');
      const nextItems: ClickVar[] = obj.items
        .filter((x: any) => x && typeof x.name === 'string')
        .map((x: any) => ({
          id: typeof x.id === 'string' && x.id ? x.id : `${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
          name: String(x.name).trim(),
          count: Math.max(0, Number.isFinite(x.count) ? Math.floor(x.count) : 0),
        }))
        .filter((x: ClickVar) => x.name.length > 0);
      if (nextItems.length === 0) throw new Error('empty');
      setItems(nextItems);
      if (obj.settings && typeof obj.settings === 'object') {
        if (typeof obj.settings.hapticsOn === 'boolean') setHapticsOn(!!obj.settings.hapticsOn);
        if ([1,5,10].includes(obj.settings.stepSize)) setStepSize(obj.settings.stepSize as 1|5|10);
      }
      Alert.alert('Imported', `Loaded ${nextItems.length} variables from JSON.`);
      try { trackEvent('clicker_import_json', { items: nextItems.length }); } catch {}
    } catch (e) {
      Alert.alert('Import failed', 'Clipboard does not contain valid Clicker JSON.');
    }
  };

  const footer = (
    <View style={{ paddingTop: spacing(1), paddingBottom: Math.max(insets.bottom, spacing(6)) }}>
      <View style={[styles.settingsCard, { padding: spacing(3) }, isDark && { backgroundColor: '#111827', borderColor: '#1f2937' }]}> 
        <Text style={[styles.settingsTitle, { marginBottom: spacing(2) }, isDark && { color: '#e5e7eb' }]}>{t('clicker_settings') || 'Clicker Setting'}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing(1.5) }}>
          <Text style={{ color: isDark ? '#cbd5e1' : palette.text, fontWeight: '600' }}>{t('haptics') || 'Haptics'}</Text>
          <Switch
            value={hapticsOn}
            onValueChange={setHapticsOn}
            thumbColor={Platform.OS === 'android' ? (hapticsOn ? palette.primary : '#eee') : undefined}
            trackColor={{ false: '#999', true: palette.primary }}
          />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing(1.5) }}>
          <Text style={{ color: isDark ? '#cbd5e1' : palette.text, fontWeight: '600' }}>{t('step') || 'Step'}</Text>
          <View style={{ flexDirection: 'row', gap: spacing(1) as any }}>
            <TouchableOpacity onPress={() => setStepSize(1)} style={[styles.stepChip, stepSize === 1 && styles.stepChipActive]}>
              <Text style={[styles.stepChipText, stepSize === 1 && styles.stepChipTextActive]}>x1</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStepSize(5)} style={[styles.stepChip, stepSize === 5 && styles.stepChipActive]}>
              <Text style={[styles.stepChipText, stepSize === 5 && styles.stepChipTextActive]}>x5</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStepSize(10)} style={[styles.stepChip, stepSize === 10 && styles.stepChipActive]}>
              <Text style={[styles.stepChipText, stepSize === 10 && styles.stepChipTextActive]}>x10</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: spacing(1) as any, marginBottom: spacing(1.5), alignItems: 'stretch' }}>
          <View style={{ flex: 1 }}>
            <SecondaryButton compact title={t('share') || 'Share'} onPress={shareSummary} />
          </View>
          <View style={{ flex: 2, flexDirection: 'row', justifyContent: 'flex-end', gap: spacing(1) as any }}>
            <SecondaryButton compact title={t('import') || 'Import'} onPress={importClickerFromClipboard} />
            <SecondaryButton compact title={t('export') || 'Export'} onPress={exportClickerJSON} />
            <SecondaryButton compact title={t('copy') || 'Copy'} onPress={copySummary} />
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: spacing(1) as any }}>
          <View style={{ flex: 1 }}>
            <SecondaryButton title={t('clear') || 'Clear'} onPress={clearCounts} />
          </View>
          <View style={{ flex: 2 }}>
            <PrimaryButton title={t('reset') || 'Reset'} onPress={resetAll} />
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <GestureHandlerRootView style={[styles.container, { backgroundColor: isDark ? '#0b1220' : palette.bg }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.header, isDark && { color: '#e5e7eb' }]}>{t('clicker') || 'Clicker'}</Text>
        <TextInput
          placeholder={t('new_variable') || 'New variable...'}
          placeholderTextColor={isDark ? '#64748b' : palette.textMuted}
          value={newName}
          onChangeText={setNewName}
          style={[styles.input, styles.headerInput, isDark && { backgroundColor: '#111827', borderColor: '#1f2937', color: '#e5e7eb' }]}
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
        <Text style={[styles.renameTitle, isDark && { color: '#e5e7eb' }]}>{t('rename_variable') || 'Rename variable'}</Text>
        <TextInput
          ref={renameInputRef}
          value={renameText}
          onChangeText={setRenameText}
          placeholder={t('new_name') || 'New name'}
          placeholderTextColor={isDark ? '#64748b' : palette.textMuted}
          style={[styles.input, { marginBottom: spacing(2) }, isDark && { backgroundColor: '#111827', borderColor: '#1f2937', color: '#e5e7eb' }]}
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
          <TouchableOpacity style={[styles.smallBtn, { backgroundColor: isDark ? '#111827' : palette.surface }]} onPress={() => setRenameFor(null)}>
            <Text style={{ color: isDark ? '#e5e7eb' : palette.text }}>{t('cancel') || 'Cancel'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.smallBtn, { backgroundColor: palette.primary }]} onPress={applyRename}>
            <Text style={{ color: '#fff' }}>{t('save') || 'Save'}</Text>
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
  actionTextLight: { color: '#fff', fontWeight: '800' },
  actionStack: { width: 100, marginLeft: spacing(2), alignSelf: 'flex-end', justifyContent: 'center' },
  actionBtn: { paddingVertical: spacing(3), borderRadius: radius.md, marginBottom: spacing(2), alignItems: 'center', borderWidth: 1 },
  actionDanger: { backgroundColor: palette.danger, borderColor: palette.danger },
  dragActive: { opacity: 0.9, transform: [{ scale: 0.98 }] as any },
  renameTitle: { fontWeight: '800', marginBottom: spacing(2), color: palette.text },
  smallBtn: { paddingVertical: spacing(2.5), paddingHorizontal: spacing(4), borderRadius: radius.md },
  stepChip: { paddingVertical: spacing(1.5), paddingHorizontal: spacing(3), borderRadius: radius.md, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface },
  stepChipActive: { borderColor: palette.primary, backgroundColor: palette.primarySoft },
  stepChipText: { color: palette.text, fontWeight: '700' },
  stepChipTextActive: { color: palette.primary },
  settingsCard: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border, borderRadius: radius.lg, padding: spacing(4), ...shadow.card },
  settingsTitle: { ...typography.h2, color: palette.text, marginBottom: spacing(3) },
});
