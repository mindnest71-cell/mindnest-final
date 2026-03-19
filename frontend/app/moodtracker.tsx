/**
 * moodtracker.tsx — หน้าติดตาม Mood
 *
 * ข้อมูลเก็บใน AsyncStorage (ไม่ sync กับ server):
 *   key: 'mood_history' → array ของ MoodEntry[]
 *   จำกัดสูงสุด MAX_STORED_ENTRIES = 200 รายการ
 *
 * แก้ตัวเลือก mood → แก้ใน MOOD_OPTIONS[] (บรรทัด ~23)
 *   ปัจจุบัน: 😢 😔 😐 😊 😄 (level 1–5)
 *
 * แก้ข้อความ → แก้ใน STRINGS.en / STRINGS.th (บรรทัด ~40)
 *
 * Cooldown: บันทึก mood ได้ทุก 4 ชั่วโมง
 *   → แก้เวลา: COOLDOWN_MS = 4 * 60 * 60 * 1000 (บรรทัด ~33)
 *
 * Notification เตือนบันทึก mood:
 *   เวลา: 08:00, 12:00, 16:00, 20:00 (แก้ใน MOOD_REMINDER_HOURS[])
 *   key: 'mood_reminder_ids' → เก็บ notification IDs ที่ schedule ไว้
 */
import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';

import { useTheme } from '@/context/theme-context';
import { useLanguage } from '@/context/language-context';

// -------------------- Constants --------------------

const MOOD_OPTIONS = [
  { level: 1, emoji: '😢', labelEn: 'Very sad', labelTh: 'แย่มาก', color: '#EF4444' },
  { level: 2, emoji: '😔', labelEn: 'Sad',      labelTh: 'เศร้า',   color: '#F97316' },
  { level: 3, emoji: '😐', labelEn: 'Okay',     labelTh: 'เฉยๆ',   color: '#EAB308' },
  { level: 4, emoji: '😊', labelEn: 'Good',     labelTh: 'ดี',      color: '#22C55E' },
  { level: 5, emoji: '😄', labelEn: 'Great',    labelTh: 'ดีมาก',  color: '#6C63FF' },
] as const;

const STORAGE_KEY = 'mood_history';
const BAR_MAX_HEIGHT = 130;
const COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 hours
const MAX_STORED_ENTRIES = 200;

// Mood reminder notifications: 08:00, 12:00, 16:00, 20:00
const MOOD_REMINDER_HOURS = [8, 12, 16, 20];
const MOOD_REMINDER_IDS_KEY = 'mood_reminder_ids';

const STRINGS = {
  en: {
    title: 'Mood Tracker',
    todayQ: 'How are you feeling right now?',
    save: 'Save Mood',
    saved: 'Mood saved!',
    cooldownTitle: 'Too soon',
    cooldownPrefix: 'Next log available at',
    nextLogPrefix: 'Next log at',
    weekChart: '7-Day Trend',
    history: 'History',
    noHistory: 'No mood logs yet.\nStart by logging now!',
    days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    notifTitle: 'Time to log your mood 🌟',
    notifBody: 'How are you feeling right now?',
    resetBtn: 'Reset All History',
    resetConfirmTitle: 'Reset History',
    resetConfirmMsg: 'This will permanently delete all mood logs. Are you sure?',
    resetCancel: 'Cancel',
    resetConfirm: 'Reset',
    resetDone: 'History cleared.',
  },
  th: {
    title: 'ติดตาม Mood',
    todayQ: 'ตอนนี้รู้สึกยังไงบ้าง?',
    save: 'บันทึก Mood',
    saved: 'บันทึก Mood แล้ว!',
    cooldownTitle: 'เร็วเกินไป',
    cooldownPrefix: 'บันทึกได้อีกครั้งเวลา',
    nextLogPrefix: 'บันทึกได้อีกครั้ง',
    weekChart: 'Mood 7 วัน',
    history: 'ประวัติ',
    noHistory: 'ยังไม่มีประวัติ\nเริ่มบันทึก mood ได้เลย!',
    days: ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'],
    notifTitle: 'เวลาบันทึก Mood แล้ว 🌟',
    notifBody: 'ตอนนี้รู้สึกยังไงบ้าง?',
    resetBtn: 'รีเซ็ตประวัติทั้งหมด',
    resetConfirmTitle: 'รีเซ็ตประวัติ',
    resetConfirmMsg: 'ประวัติ mood ทั้งหมดจะถูกลบถาวร แน่ใจมั้ยครับ?',
    resetCancel: 'ยกเลิก',
    resetConfirm: 'รีเซ็ต',
    resetDone: 'ล้างประวัติเรียบร้อย',
  },
};

// -------------------- Types --------------------

interface MoodEntry {
  date: string;       // "YYYY-MM-DD"
  level: number;      // 1–5
  emoji: string;
  timestamp: string;  // ISO
}

// -------------------- Helpers --------------------

const withAlpha = (hex: string, alpha: number) => {
  if (!hex.startsWith('#')) return hex;
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
};

const todayStr = () => new Date().toISOString().slice(0, 10);

const getLast7Days = (): string[] => {
  const result: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    result.push(d.toISOString().slice(0, 10));
  }
  return result;
};

const getCooldownUntil = (lastEntry: MoodEntry | null): Date | null => {
  if (!lastEntry) return null;
  const until = new Date(new Date(lastEntry.timestamp).getTime() + COOLDOWN_MS);
  return until > new Date() ? until : null;
};

const scheduleMoodReminders = async (notifTitle: string, notifBody: string) => {
  if (Platform.OS === 'web') return;

  // Skip if already scheduled
  const stored = await AsyncStorage.getItem(MOOD_REMINDER_IDS_KEY);
  if (stored) return;

  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;

    const ids: string[] = [];
    for (const hour of MOOD_REMINDER_HOURS) {
      const id = await Notifications.scheduleNotificationAsync({
        content: { title: notifTitle, body: notifBody },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          hour,
          minute: 0,
          repeats: true,
        },
      });
      ids.push(id);
    }
    await AsyncStorage.setItem(MOOD_REMINDER_IDS_KEY, JSON.stringify(ids));
  } catch (e) {
    console.log('Error scheduling mood reminders:', e);
  }
};

// -------------------- Component --------------------

export default function MoodTracker() {
  const router = useRouter();
  const { colors, colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const { lang } = useLanguage();
  const t = STRINGS[lang];
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [history, setHistory] = useState<MoodEntry[]>([]);
  const [lastEntry, setLastEntry] = useState<MoodEntry | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const entries: MoodEntry[] = raw ? JSON.parse(raw) : [];
      const sorted = [...entries].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      setHistory(sorted);
      setLastEntry(sorted[0] ?? null);
    } catch (e) {
      console.log('Error loading mood history:', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
      scheduleMoodReminders(t.notifTitle, t.notifBody);
    }, [loadHistory, t.notifTitle, t.notifBody])
  );

  // Cooldown state (computed from lastEntry at render time)
  const cooldownUntil = useMemo(() => getCooldownUntil(lastEntry), [lastEntry]);
  const canLog = !cooldownUntil;

  const doSave = async () => {
    if (!selectedLevel) return;
    const option = MOOD_OPTIONS.find(m => m.level === selectedLevel)!;
    const entry: MoodEntry = {
      date: todayStr(),
      level: selectedLevel,
      emoji: option.emoji,
      timestamp: new Date().toISOString(),
    };
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      let entries: MoodEntry[] = raw ? JSON.parse(raw) : [];
      entries.push(entry);
      // Trim to keep storage manageable
      if (entries.length > MAX_STORED_ENTRIES) {
        entries.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
        entries = entries.slice(-MAX_STORED_ENTRIES);
      }
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
      setSelectedLevel(null);
      Alert.alert('', t.saved);
      loadHistory();
    } catch (e) {
      console.log('Error saving mood:', e);
    }
  };

  const handleReset = () => {
    Alert.alert(t.resetConfirmTitle, t.resetConfirmMsg, [
      { text: t.resetCancel, style: 'cancel' },
      {
        text: t.resetConfirm,
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem(STORAGE_KEY);
          setHistory([]);
          setLastEntry(null);
          setSelectedLevel(null);
          Alert.alert('', t.resetDone);
        },
      },
    ]);
  };

  const handleSave = () => {
    if (!selectedLevel) return;
    const until = getCooldownUntil(lastEntry);
    if (until) {
      const timeStr = until.toLocaleTimeString(
        lang === 'th' ? 'th-TH' : 'en-US',
        { hour: '2-digit', minute: '2-digit' }
      );
      Alert.alert(t.cooldownTitle, `${t.cooldownPrefix} ${timeStr}`);
      return;
    }
    doSave();
  };

  // 7-day chart — show latest entry per day
  const last7Days = useMemo(() => getLast7Days(), []);
  const historyMap = useMemo(() => {
    const map: Record<string, MoodEntry> = {};
    history.forEach(e => {
      if (!map[e.date] || e.timestamp > map[e.date].timestamp) {
        map[e.date] = e;
      }
    });
    return map;
  }, [history]);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Mood Picker */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>{t.todayQ}</Text>
          <View style={styles.moodRow}>
            {MOOD_OPTIONS.map(m => {
              const selected = selectedLevel === m.level;
              return (
                <TouchableOpacity
                  key={m.level}
                  onPress={() => setSelectedLevel(m.level)}
                  activeOpacity={0.8}
                  style={[
                    styles.moodBtn,
                    selected && {
                      borderColor: m.color,
                      borderWidth: 2,
                      backgroundColor: withAlpha(m.color, 0.14),
                    },
                  ]}
                >
                  <Text style={styles.moodEmoji}>{m.emoji}</Text>
                  <Text style={[styles.moodLabel, selected && { color: m.color, fontWeight: '700' }]}>
                    {lang === 'en' ? m.labelEn : m.labelTh}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            onPress={handleSave}
            style={[styles.saveBtn, (!selectedLevel || !canLog) && styles.saveBtnDisabled]}
            activeOpacity={0.85}
            disabled={!selectedLevel || !canLog}
          >
            <MaterialCommunityIcons name="check" size={18} color="#fff" />
            <Text style={styles.saveBtnText}>{t.save}</Text>
          </TouchableOpacity>

          {!canLog && cooldownUntil && (
            <Text style={styles.cooldownText}>
              {t.nextLogPrefix}{' '}
              {cooldownUntil.toLocaleTimeString(
                lang === 'th' ? 'th-TH' : 'en-US',
                { hour: '2-digit', minute: '2-digit' }
              )}
            </Text>
          )}
        </View>

        {/* 7-Day Bar Chart */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>{t.weekChart}</Text>
          <View style={styles.chartOuter}>
            {/* Y-axis */}
            <View style={styles.yAxis}>
              {[5, 4, 3, 2, 1].map(l => {
                const mc = MOOD_OPTIONS.find(m => m.level === l);
                return (
                  <Text key={l} style={[styles.yLabel, { color: mc?.color ?? colors.textMuted }]}>
                    {l}
                  </Text>
                );
              })}
            </View>

            {/* Bars */}
            <View style={styles.chart}>
              {last7Days.map(date => {
                const entry = historyMap[date];
                const dayOfWeek = new Date(date + 'T12:00:00').getDay();
                const barH = entry ? (entry.level / 5) * BAR_MAX_HEIGHT : 0;
                const moodColor = entry
                  ? MOOD_OPTIONS.find(m => m.level === entry.level)?.color ?? colors.primary
                  : colors.border;
                const isToday = date === todayStr();
                return (
                  <View key={date} style={styles.barCol}>
                    <Text style={[styles.barLevelLabel, { color: entry ? moodColor : 'transparent' }]}>
                      {entry?.level ?? ''}
                    </Text>
                    <Text style={styles.barEmoji}>{entry?.emoji ?? ''}</Text>
                    <View style={[styles.barBg, { height: BAR_MAX_HEIGHT }]}>
                      {/* Grid lines inside bar */}
                      {[1, 2, 3, 4].map(l => (
                        <View
                          key={l}
                          style={[styles.gridLine, { bottom: (l / 5) * BAR_MAX_HEIGHT }]}
                        />
                      ))}
                      <View style={[styles.barFill, { height: barH, backgroundColor: moodColor }]} />
                    </View>
                    <Text style={[styles.barDay, isToday && { color: colors.primary, fontWeight: '700' }]}>
                      {t.days[dayOfWeek]}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* History List */}
        <Text style={styles.historyTitle}>{t.history}</Text>

        {history.length === 0 ? (
          <Text style={styles.emptyText}>{t.noHistory}</Text>
        ) : (
          history.map(entry => {
            const option = MOOD_OPTIONS.find(m => m.level === entry.level)!;
            const dateObj = new Date(entry.timestamp);
            const dateLabel = dateObj.toLocaleDateString(
              lang === 'th' ? 'th-TH' : 'en-US',
              { day: 'numeric', month: 'short', year: 'numeric' }
            );
            const timeLabel = dateObj.toLocaleTimeString(
              lang === 'th' ? 'th-TH' : 'en-US',
              { hour: '2-digit', minute: '2-digit' }
            );
            return (
              <View key={entry.timestamp} style={styles.historyItem}>
                <Text style={styles.historyEmoji}>{entry.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.historyMoodName, { color: option.color }]}>
                    {lang === 'en' ? option.labelEn : option.labelTh}
                  </Text>
                  <Text style={styles.historyDate}>{dateLabel} · {timeLabel}</Text>
                  {/* Mini progress bar */}
                  <View style={styles.miniBarBg}>
                    <View
                      style={[
                        styles.miniBarFill,
                        { width: `${(entry.level / 5) * 100}%`, backgroundColor: option.color },
                      ]}
                    />
                  </View>
                </View>
                <View style={[styles.levelBadge, { backgroundColor: withAlpha(option.color, 0.18) }]}>
                  <Text style={[styles.levelBadgeText, { color: option.color }]}>{entry.level}/5</Text>
                </View>
              </View>
            );
          })
        )}

        {/* Reset Button */}
        <TouchableOpacity onPress={handleReset} style={styles.resetBtn} activeOpacity={0.8}>
          <MaterialCommunityIcons name="trash-can-outline" size={18} color="#EF4444" />
          <Text style={styles.resetBtnText}>{t.resetBtn}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// -------------------- Styles --------------------

type ThemeColors = ReturnType<typeof useTheme>['colors'];

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 18,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '800',
    },

    content: {
      padding: 18,
    },

    card: {
      backgroundColor: colors.surface,
      borderRadius: 22,
      padding: 18,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOpacity: 1,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },

    sectionLabel: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 16,
    },

    moodRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 18,
    },
    moodBtn: {
      alignItems: 'center',
      flex: 1,
      marginHorizontal: 3,
      paddingVertical: 10,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: 'transparent',
      backgroundColor: colors.surface2,
    },
    moodEmoji: { fontSize: 26 },
    moodLabel: {
      marginTop: 4,
      fontSize: 11,
      fontWeight: '600',
      color: colors.textMuted,
      textAlign: 'center',
    },

    saveBtn: {
      backgroundColor: colors.primary,
      borderRadius: 16,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    saveBtnDisabled: {
      opacity: 0.4,
    },
    saveBtnText: {
      color: '#fff',
      fontSize: 15,
      fontWeight: '700',
    },
    cooldownText: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '500',
      textAlign: 'center',
      marginTop: 10,
    },

    // Chart
    chartOuter: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingTop: 8,
    },
    yAxis: {
      height: BAR_MAX_HEIGHT,
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginRight: 6,
      paddingBottom: 0,
    },
    yLabel: {
      fontSize: 10,
      fontWeight: '800',
      lineHeight: 12,
    },
    chart: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
    },
    barCol: {
      flex: 1,
      alignItems: 'center',
      gap: 2,
    },
    barLevelLabel: {
      fontSize: 11,
      fontWeight: '800',
      height: 14,
      textAlign: 'center',
    },
    barEmoji: {
      fontSize: 14,
      height: 20,
      textAlign: 'center',
    },
    barBg: {
      width: 22,
      backgroundColor: colors.surface2,
      borderRadius: 8,
      justifyContent: 'flex-end',
      overflow: 'hidden',
      position: 'relative',
    },
    gridLine: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: 1,
      backgroundColor: colors.border,
      opacity: 0.6,
      zIndex: 1,
    },
    barFill: {
      width: '100%',
      borderRadius: 8,
    },
    barDay: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textMuted,
    },

    // History
    historyTitle: {
      color: colors.textMuted,
      fontSize: 15,
      fontWeight: '700',
      marginBottom: 12,
    },
    emptyText: {
      color: colors.textMuted,
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 22,
      marginTop: 24,
    },
    historyItem: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    historyEmoji: { fontSize: 28 },
    historyMoodName: {
      fontSize: 15,
      fontWeight: '700',
    },
    historyDate: {
      fontSize: 12,
      color: colors.textMuted,
      fontWeight: '500',
      marginTop: 2,
    },
    levelBadge: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
    },
    levelBadgeText: {
      fontSize: 13,
      fontWeight: '800',
    },
    miniBarBg: {
      marginTop: 6,
      height: 5,
      borderRadius: 99,
      backgroundColor: colors.surface2,
      overflow: 'hidden',
    },
    miniBarFill: {
      height: '100%',
      borderRadius: 99,
    },

    resetBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 8,
      paddingVertical: 14,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#EF4444',
      backgroundColor: 'rgba(239,68,68,0.07)',
    },
    resetBtnText: {
      color: '#EF4444',
      fontSize: 14,
      fontWeight: '700',
    },
  });
