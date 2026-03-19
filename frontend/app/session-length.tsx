import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '../context/theme-context';

const STORAGE_MINUTES_KEY = 'session_length_minutes';
const STORAGE_NOTIFICATION_KEY = 'session_length_notification_id';

if (Platform.OS !== 'web' && Notifications.setNotificationHandler) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export default function SessionLengthScreen() {
  const router = useRouter();
  const { colors, colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const [pickerDate, setPickerDate] = useState(toDurationDate(10));
  const [durationMinutes, setDurationMinutes] = useState(10);
  const [showPicker, setShowPicker] = useState(Platform.OS === 'ios');
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  const [isCounting, setIsCounting] = useState(false);
  const countdownLabel =
    countdownSeconds === null
      ? ''
      : isCounting
        ? 'Time Remaining'
        : countdownSeconds === 0
          ? 'Session Complete'
          : 'Paused';

  useEffect(() => {
    const loadDuration = async () => {
      try {
        const storedMinutes = await AsyncStorage.getItem(STORAGE_MINUTES_KEY);
        if (storedMinutes) {
          const parsedMinutes = Number(storedMinutes);
          if (!Number.isNaN(parsedMinutes) && parsedMinutes > 0) {
            setDurationMinutes(parsedMinutes);
            setPickerDate(toDurationDate(parsedMinutes));
          }
        }
      } catch (error) {
        console.log('Error loading session length:', error);
      }
    };

    loadDuration();
  }, []);

  useEffect(() => {
    const requestNotificationPermissions = async () => {
      if (Platform.OS === 'web') return;
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        await Notifications.requestPermissionsAsync();
      }
    };

    requestNotificationPermissions();
  }, []);

  useEffect(() => {
    if (!isCounting || countdownSeconds === null) return;

    if (countdownSeconds <= 0) {
      setIsCounting(false);
      Alert.alert('Session Length', 'ครบเวลาแล้วนะคะ');
      return;
    }

    const intervalId = setInterval(() => {
      setCountdownSeconds((previous) => {
        if (previous === null) return null;
        if (previous <= 1) {
          clearInterval(intervalId);
          return 0;
        }
        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [countdownSeconds, isCounting]);

  const updateDuration = useCallback((date: Date) => {
    const minutes = getMinutesFromDate(date);
    const safeMinutes = Math.max(1, minutes);
    setPickerDate(toDurationDate(safeMinutes));
    setDurationMinutes(safeMinutes);
  }, []);

  const handlePickerChange = useCallback(
    (event: DateTimePickerEvent, selectedDate?: Date) => {
      if (Platform.OS === 'android') {
        setShowPicker(false);
        if (event.type === 'dismissed') return;
      }

      if (selectedDate) {
        updateDuration(selectedDate);
      }
    },
    [updateDuration]
  );

  const scheduleSessionNotification = async (seconds: number) => {
    if (Platform.OS === 'web') {
      Alert.alert('Reminder', 'Notification ไม่รองรับบนเว็บ');
      return;
    }

    try {
      const existingId = await AsyncStorage.getItem(STORAGE_NOTIFICATION_KEY);
      if (existingId) {
        await Notifications.cancelScheduledNotificationAsync(existingId);
      }

      const safeSeconds = Math.max(1, Math.round(seconds));
      const trigger: Notifications.TimeIntervalTriggerInput = {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: safeSeconds,
        repeats: false,
      };

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'MindNest Session',
          body: 'Session length ครบเวลาแล้วนะคะ',
        },
        trigger,
      });

      await AsyncStorage.setItem(STORAGE_NOTIFICATION_KEY, id);
    } catch (error) {
      console.log('Error scheduling session notification:', error);
      throw error;
    }
  };

  const cancelSessionNotification = async () => {
    if (Platform.OS === 'web') return;

    try {
      const existingId = await AsyncStorage.getItem(STORAGE_NOTIFICATION_KEY);
      if (existingId) {
        await Notifications.cancelScheduledNotificationAsync(existingId);
        await AsyncStorage.removeItem(STORAGE_NOTIFICATION_KEY);
      }
    } catch (error) {
      console.log('Error cancelling session notification:', error);
    }
  };

  const handleStartCountdown = async () => {
    if (durationMinutes < 1) {
      Alert.alert('Session Length', 'กรุณาเลือกเวลาอย่างน้อย 1 นาที');
      return;
    }

    try {
      await AsyncStorage.setItem(STORAGE_MINUTES_KEY, String(durationMinutes));
      const totalSeconds = durationMinutes * 60;
      await scheduleSessionNotification(totalSeconds);
      setCountdownSeconds(totalSeconds);
      setIsCounting(true);
      Alert.alert('Reminder Set', `เริ่มนับถอยหลัง ${formatSessionLength(durationMinutes)} แล้ว`);
    } catch (error) {
      Alert.alert('Error', 'ตั้งเวลาแจ้งเตือนไม่สำเร็จ');
    }
  };

  const handlePauseToggle = async () => {
    if (countdownSeconds === null || countdownSeconds <= 0) return;

    if (isCounting) {
      setIsCounting(false);
      await cancelSessionNotification();
      return;
    }

    setIsCounting(true);
    if (Platform.OS !== 'web') {
      await scheduleSessionNotification(countdownSeconds);
    }
  };

  const handleResetCountdown = async () => {
    const totalSeconds = Math.max(1, durationMinutes) * 60;
    await cancelSessionNotification();
    setIsCounting(false);
    setCountdownSeconds(totalSeconds);
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={isDark ? [colors.primaryDark, colors.primary] : [colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.85}>
            <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textOnPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Session Length</Text>
          <Text style={styles.headerSub}>ตั้งเวลานับถอยหลังสำหรับการฝึก</Text>
        </LinearGradient>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>Duration Picker</Text>
              <Text style={styles.cardSub}>เลือกเวลาที่ต้องการ แล้วกดเริ่มนับถอยหลัง</Text>
            </View>
            <View style={styles.durationPill}>
              <Text style={styles.durationText}>{formatSessionLength(durationMinutes)}</Text>
            </View>
          </View>

          {Platform.OS === 'android' && !showPicker ? (
            <TouchableOpacity
              onPress={() => setShowPicker(true)}
              style={styles.androidPickerButton}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="clock-outline" size={18} color={colors.text} />
              <Text style={styles.androidPickerText}>เลือกเวลา</Text>
            </TouchableOpacity>
          ) : null}

          {showPicker ? (
            <DateTimePicker
              value={pickerDate}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handlePickerChange}
              is24Hour
              textColor={isDark ? colors.textOnPrimary : colors.text}
              style={styles.picker}
            />
          ) : null}

          {countdownSeconds !== null ? (
            <View style={styles.countdownWrapper}>
              <Text style={styles.countdownLabel}>{countdownLabel}</Text>
              <Text style={styles.countdownValue}>{formatCountdown(countdownSeconds)}</Text>
            </View>
          ) : null}

          {countdownSeconds !== null ? (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  (countdownSeconds <= 0 || countdownSeconds === null) && styles.buttonDisabled,
                ]}
                onPress={handlePauseToggle}
                activeOpacity={0.85}
                disabled={countdownSeconds <= 0}
              >
                <Text style={styles.secondaryButtonText}>{isCounting ? 'Pause' : 'Resume'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.secondaryButton, styles.resetButton]}
                onPress={handleResetCountdown}
                activeOpacity={0.85}
              >
                <Text style={styles.secondaryButtonText}>Reset</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <TouchableOpacity style={styles.primaryButton} onPress={handleStartCountdown} activeOpacity={0.9}>
            <Text style={styles.primaryButtonText}>Start Countdown</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type ThemeColors = ReturnType<typeof useTheme>['colors'];

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    content: { padding: 18, paddingBottom: 32 },
    header: {
      borderRadius: 24,
      padding: 18,
      marginBottom: 18,
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: withAlpha(colors.textOnPrimary, 0.2),
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      marginTop: 14,
      fontSize: 28,
      fontWeight: '900',
      color: colors.textOnPrimary,
    },
    headerSub: {
      marginTop: 6,
      fontSize: 14,
      fontWeight: '700',
      color: withAlpha(colors.textOnPrimary, 0.85),
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 22,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOpacity: 1,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 8 },
      elevation: 3,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    cardTitle: {
      color: colors.text,
      fontWeight: '900',
      fontSize: 16,
    },
    cardSub: {
      color: colors.textMuted,
      fontWeight: '700',
      marginTop: 4,
    },
    durationPill: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: withAlpha(colors.primary, isDark ? 0.2 : 0.12),
    },
    durationText: {
      color: isDark ? colors.textOnPrimary : colors.text,
      fontWeight: '900',
    },
    androidPickerButton: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 12,
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    androidPickerText: {
      color: colors.text,
      fontWeight: '800',
      fontSize: 14,
    },
    picker: {
      marginTop: Platform.OS === 'ios' ? 0 : 10,
    },
    countdownWrapper: {
      marginTop: 16,
      alignItems: 'center',
      paddingVertical: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: withAlpha(colors.primary, isDark ? 0.3 : 0.2),
      backgroundColor: withAlpha(colors.primary, isDark ? 0.16 : 0.08),
    },
    countdownLabel: {
      color: colors.textMuted,
      fontWeight: '700',
      letterSpacing: 0.4,
    },
    countdownValue: {
      marginTop: 6,
      fontSize: 32,
      fontWeight: '900',
      color: isDark ? colors.textOnPrimary : colors.text,
    },
    actionRow: {
      marginTop: 12,
      flexDirection: 'row',
      gap: 12,
    },
    secondaryButton: {
      flex: 1,
      borderRadius: 14,
      paddingVertical: 10,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: withAlpha(colors.primary, isDark ? 0.35 : 0.2),
      backgroundColor: withAlpha(colors.primary, isDark ? 0.2 : 0.08),
    },
    resetButton: {
      borderColor: withAlpha(colors.textMuted, isDark ? 0.45 : 0.25),
      backgroundColor: withAlpha(colors.textMuted, isDark ? 0.2 : 0.1),
    },
    secondaryButtonText: {
      color: colors.text,
      fontWeight: '800',
      fontSize: 14,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    primaryButton: {
      marginTop: 18,
      backgroundColor: colors.primary,
      borderRadius: 16,
      paddingVertical: 14,
      alignItems: 'center',
    },
    primaryButtonText: {
      color: colors.textOnPrimary,
      fontWeight: '900',
      fontSize: 15,
    },
  });

const toDurationDate = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  const baseDate = new Date();
  baseDate.setHours(hours, remainingMinutes, 0, 0);
  return baseDate;
};

const getMinutesFromDate = (date: Date) => date.getHours() * 60 + date.getMinutes();

const formatSessionLength = (minutes: number) => {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (remaining === 0) return `${hours} hr`;
  return `${hours} hr ${remaining} min`;
};

const formatCountdown = (totalSeconds: number) => {
  const safeSeconds = Math.max(0, totalSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  const paddedMinutes = String(minutes).padStart(2, '0');
  const paddedSeconds = String(seconds).padStart(2, '0');
  if (hours > 0) {
    const paddedHours = String(hours).padStart(2, '0');
    return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
  }
  return `${paddedMinutes}:${paddedSeconds}`;
};

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
