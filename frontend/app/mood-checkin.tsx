import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../context/theme-context';

type MoodOptionId = 'happy' | 'neutral' | 'sad' | 'angry' | 'anxious';
type ReasonOptionId = 'work' | 'family' | 'love' | 'health' | 'unknown';

type MoodEntry = {
  id: string;
  date: string;
  dateKey: string;
  mood: MoodOptionId;
  reason: ReasonOptionId;
  note?: string;
};

type MoodOption = {
  id: MoodOptionId;
  emoji: string;
  label: string;
};

type ReasonOption = {
  id: ReasonOptionId;
  label: string;
};

const STORAGE_KEY = 'mood_checkins';
const CHART_MAX_HEIGHT = 80;

const MOOD_OPTIONS: MoodOption[] = [
  { id: 'happy', emoji: '😊', label: 'ดีมาก' },
  { id: 'neutral', emoji: '😐', label: 'เฉย ๆ' },
  { id: 'sad', emoji: '😞', label: 'เศร้า' },
  { id: 'angry', emoji: '😡', label: 'โกรธ' },
  { id: 'anxious', emoji: '😰', label: 'กังวล' },
];

const REASON_OPTIONS: ReasonOption[] = [
  { id: 'work', label: 'งาน' },
  { id: 'family', label: 'ครอบครัว' },
  { id: 'love', label: 'ความรัก' },
  { id: 'health', label: 'สุขภาพ' },
  { id: 'unknown', label: 'ไม่รู้' },
];

const MOOD_SCORES: Record<MoodOptionId, number> = {
  happy: 5,
  neutral: 4,
  sad: 3,
  angry: 2,
  anxious: 1,
};

const formatDateKey = (date: Date) => date.toISOString().slice(0, 10);

export default function MoodCheckin() {
  const router = useRouter();
  const { colors, colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const heroGradient = useMemo(
    () =>
      (isDark
        ? [colors.primaryDark, colors.primary, colors.primarySoft]
        : [colors.primary, colors.primaryDark, colors.primarySoft2]) as [string, string, string],
    [colors, isDark]
  );

  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [selectedMood, setSelectedMood] = useState<MoodOptionId | null>(null);
  const [selectedReason, setSelectedReason] = useState<ReasonOptionId | null>(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    const loadEntries = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed = stored ? JSON.parse(stored) : [];
        setEntries(Array.isArray(parsed) ? parsed : []);
      } catch (error) {
        console.log('Error loading mood check-ins:', error);
        setEntries([]);
      }
    };

    loadEntries();
  }, []);

  const chartData = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_value, index) => {
      const date = new Date();
      date.setDate(today.getDate() - (6 - index));
      const dateKey = formatDateKey(date);
      const entry = entries.find((item) => item.dateKey === dateKey);
      return {
        dateKey,
        label: date.getDate().toString(),
        score: entry ? MOOD_SCORES[entry.mood] : 0,
      };
    });
  }, [entries]);

  const handleSave = async () => {
    if (!selectedMood) {
      Alert.alert('เลือกอารมณ์วันนี้ก่อน');
      return;
    }
    if (!selectedReason) {
      Alert.alert('เลือกเหตุผลก่อน');
      return;
    }

    try {
      const now = new Date();
      const dateKey = formatDateKey(now);
      const trimmedNote = note.trim();
      const entry: MoodEntry = {
        id: `${dateKey}-${now.getTime()}`,
        date: now.toISOString(),
        dateKey,
        mood: selectedMood,
        reason: selectedReason,
        note: trimmedNote ? trimmedNote : undefined,
      };

      const nextEntries = [entry, ...entries.filter((item) => item.dateKey !== dateKey)];
      setEntries(nextEntries);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextEntries));
      setNote('');
      Alert.alert('บันทึกแล้ว', 'บันทึกอารมณ์วันนี้เรียบร้อย');
    } catch (error) {
      console.log('Error saving mood check-in:', error);
      Alert.alert('บันทึกไม่สำเร็จ', 'ลองใหม่อีกครั้งนะ');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient colors={heroGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroTopRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
              <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textOnPrimary} />
            </TouchableOpacity>
            <View style={styles.heroPill}>
              <MaterialCommunityIcons name="calendar-heart" size={14} color={colors.textOnPrimary} />
              <Text style={styles.heroPillText}>รายวัน</Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>🧠 Mood Check-in</Text>
          <Text style={styles.heroSub}>เลือกอารมณ์วันนี้ พร้อมเหตุผลและโน้ตสั้น ๆ</Text>
        </LinearGradient>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>เลือกอารมณ์วันนี้ (😊 😐 😞 😡 😰)</Text>
          <View style={styles.chipWrap}>
            {MOOD_OPTIONS.map((option) => {
              const active = selectedMood === option.id;
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setSelectedMood(option.id)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.chipEmoji}>{option.emoji}</Text>
                  <Text style={styles.chipText}>{option.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>เลือกเหตุผล</Text>
          <View style={styles.chipWrap}>
            {REASON_OPTIONS.map((option) => {
              const active = selectedReason === option.id;
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setSelectedReason(option.id)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.chipText}>{option.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>เขียน note สั้น ๆ ได้ (optional)</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="วันนี้เกิดอะไรขึ้นบ้าง..."
            placeholderTextColor={withAlpha(colors.textMuted, 0.8)}
            value={note}
            onChangeText={setNote}
            multiline
            maxLength={160}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={handleSave} activeOpacity={0.9}>
          <Text style={styles.primaryBtnText}>บันทึกอารมณ์วันนี้</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>กราฟอารมณ์ย้อนหลัง (7 วันล่าสุด)</Text>
          <View style={styles.chartCard}>
            <View style={styles.chart}>
              {chartData.map((item) => {
                const height = item.score
                  ? Math.max(8, (item.score / 5) * CHART_MAX_HEIGHT)
                  : 8;
                return (
                  <View key={item.dateKey} style={styles.chartColumn}>
                    <View style={styles.chartBarWrap}>
                      <View
                        style={[
                          styles.chartBar,
                          {
                            height,
                            backgroundColor: item.score ? colors.primary : colors.surface2,
                            opacity: item.score ? 1 : 0.45,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.chartLabel}>{item.label}</Text>
                  </View>
                );
              })}
            </View>
            <Text style={styles.chartHint}>ยิ่งสูงยิ่งรู้สึกดีขึ้น</Text>
          </View>
        </View>

        <View style={styles.benefitCard}>
          <Text style={styles.benefitTitle}>ประโยชน์</Text>
          <Text style={styles.benefitText}>- ผู้ป่วยรู้เท่าทันอารมณ์ตัวเอง</Text>
          <Text style={styles.benefitText}>- ใช้เป็นข้อมูลให้ therapist / AI วิเคราะห์ได้</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type ThemeColors = ReturnType<typeof useTheme>['colors'];

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },

    scrollContent: {
      padding: 18,
      paddingBottom: 32,
    },

    hero: {
      borderRadius: 26,
      padding: 18,
      overflow: 'hidden',
      marginBottom: 6,
    },

    heroTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: withAlpha(colors.textOnPrimary, 0.2),
    },

    heroPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: withAlpha(colors.textOnPrimary, 0.2),
    },

    heroPillText: {
      color: colors.textOnPrimary,
      fontWeight: '800',
      fontSize: 12,
    },

    heroTitle: {
      marginTop: 14,
      color: colors.textOnPrimary,
      fontSize: 26,
      fontWeight: '800',
      letterSpacing: 0.2,
    },

    heroSub: {
      marginTop: 6,
      color: withAlpha(colors.textOnPrimary, 0.82),
      fontSize: 13,
      fontWeight: '600',
    },

    section: {
      marginTop: 18,
    },

    sectionTitle: {
      marginBottom: 10,
      color: colors.textMuted,
      fontSize: 15,
      fontWeight: '700',
    },

    chipWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },

    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 999,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },

    chipActive: {
      backgroundColor: withAlpha(colors.primary, isDark ? 0.28 : 0.16),
      borderColor: withAlpha(colors.primary, 0.5),
    },

    chipEmoji: {
      fontSize: 18,
    },

    chipText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
    },

    noteInput: {
      minHeight: 100,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: 14,
      fontSize: 14,
      color: colors.text,
    },

    primaryBtn: {
      marginTop: 18,
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: 18,
      alignItems: 'center',
      shadowColor: colors.shadow,
      shadowOpacity: 1,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 6,
    },

    primaryBtnText: {
      color: colors.textOnPrimary,
      fontSize: 15,
      fontWeight: '800',
      letterSpacing: 0.2,
    },

    chartCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },

    chart: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
    },

    chartColumn: {
      flex: 1,
      alignItems: 'center',
    },

    chartBarWrap: {
      height: CHART_MAX_HEIGHT,
      width: 16,
      justifyContent: 'flex-end',
    },

    chartBar: {
      width: '100%',
      borderRadius: 999,
    },

    chartLabel: {
      marginTop: 8,
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '700',
    },

    chartHint: {
      marginTop: 12,
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '600',
      textAlign: 'center',
    },

    benefitCard: {
      marginTop: 20,
      backgroundColor: colors.surface2,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },

    benefitTitle: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '800',
      marginBottom: 8,
    },

    benefitText: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '600',
      marginBottom: 6,
    },
  });

const withAlpha = (hexColor: string, alpha: number) => {
  if (!hexColor.startsWith('#')) {
    return hexColor;
  }

  let hex = hexColor.replace('#', '');
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((char) => `${char}${char}`)
      .join('');
  }

  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
