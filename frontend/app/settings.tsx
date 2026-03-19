import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Switch,
  Platform,
  Image,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import api from '../utils/api';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../context/theme-context';
import { useLanguage } from '../context/language-context';

export default function Settings() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  // Profile
  const [userName, setUserName] = useState('Jessica');
  const [userEmail, setUserEmail] = useState('jessica@email.com');

  // UI toggles (ตามรูป)
  const [dailyReminder, setDailyReminder] = useState(true);
  const [reminderTimeDate, setReminderTimeDate] = useState(new Date(0, 0, 0, 21, 0, 0));
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const [sessionLengthMinutes, setSessionLengthMinutes] = useState(10);

  const [bgSound, setBgSound] = useState(true);
  const [volume, setVolume] = useState(0.6);

  const [emergencyNumber, setEmergencyNumber] = useState('');
  const [savingEmergencyNumber, setSavingEmergencyNumber] = useState(false);

  // Expand panels
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Change password form
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const loadSessionLength = useCallback(async () => {
    try {
      const storedMinutes = await AsyncStorage.getItem('session_length_minutes');
      if (storedMinutes) {
        const parsedMinutes = Number(storedMinutes);
        if (!Number.isNaN(parsedMinutes) && parsedMinutes > 0) {
          setSessionLengthMinutes(parsedMinutes);
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const name = await AsyncStorage.getItem('user_name');
        const email = await AsyncStorage.getItem('user_email');
        const storedReminderEnabled = await AsyncStorage.getItem('daily_reminder_enabled');
        const storedReminderTime = await AsyncStorage.getItem('daily_reminder_time');
        const storedEmergencyNumber = await AsyncStorage.getItem('emergency_number');
        if (name) setUserName(name);
        if (email) setUserEmail(email);
        if (storedReminderEnabled) {
          setDailyReminder(storedReminderEnabled === 'true');
        }
        if (storedReminderTime) {
          const parsed = parseReminderTime(storedReminderTime);
          if (parsed) {
            setReminderTimeDate(parsed);
          }
        }
        if (storedEmergencyNumber) {
          setEmergencyNumber(storedEmergencyNumber);
        }
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSessionLength();
    }, [loadSessionLength])
  );

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
  }, []);

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const userId = await AsyncStorage.getItem('user_id');
      if (!userId) {
        Alert.alert('Error', 'User ID not found. Please log in again.');
        router.replace('/');
        return;
      }

      const response = await api.post('/auth/change-password', {
        user_id: userId,
        old_password: oldPassword,
        new_password: newPassword,
      });

      if (response.status === 200) {
        Alert.alert('Success', 'Password changed successfully', [
          {
            text: 'OK',
            onPress: () => {
              setOldPassword('');
              setNewPassword('');
              setConfirmPassword('');
              setShowChangePassword(false);
            },
          },
        ]);
      }
    } catch (error: any) {
      console.log('Change Password Error:', error);
      const msg = error?.response?.data?.detail || 'Failed to change password';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHistory = async () => {
    Alert.alert(
      'Delete Chat History',
      'Are you sure you want to delete all your chat history? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const response = await api.delete('/chat/history');
              if (response.status === 200) {
                Alert.alert('Success', 'Chat history deleted.');
              }
            } catch (error) {
              console.log('Delete History Error:', error);
              Alert.alert('Error', 'Failed to delete history.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account and all data? This action CANNOT be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete My Account',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const response = await api.delete('/auth/me');
              if (response.status === 200) {
                await AsyncStorage.multiRemove(['user_id', 'user_name', 'user_email']);
                Alert.alert('Account Deleted', 'Your account has been deleted.');
                router.replace('/');
              }
            } catch (error) {
              console.log('Delete Account Error:', error);
              Alert.alert('Error', 'Failed to delete account.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.multiRemove(['user_id', 'user_name', 'user_email']);
          router.replace('/');
        },
      },
    ]);
  };

  const cancelDailyReminder = async () => {
    try {
      const existingId = await AsyncStorage.getItem('daily_reminder_notification_id');
      if (existingId) {
        await Notifications.cancelScheduledNotificationAsync(existingId);
        await AsyncStorage.removeItem('daily_reminder_notification_id');
      }
    } catch (error) {
      console.log('Error canceling daily reminder:', error);
    }
  };

  const scheduleDailyReminder = async (date: Date) => {
    if (Platform.OS === 'web') {
      Alert.alert('Reminder', 'Notification ไม่รองรับบนเว็บ');
      return;
    }

    try {
      await cancelDailyReminder();

      const trigger: Notifications.NotificationTriggerInput = {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour: date.getHours(),
        minute: date.getMinutes(),
        repeats: true,
      };

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'MindNest Reminder',
          body: 'ได้เวลาเช็คอินความรู้สึกแล้วนะคะ',
        },
        trigger,
      });

      await AsyncStorage.setItem('daily_reminder_notification_id', id);
    } catch (error) {
      console.log('Error scheduling daily reminder:', error);
      Alert.alert('Error', 'ตั้งเวลาแจ้งเตือนไม่สำเร็จ');
    }
  };

  const handleDailyReminderToggle = async (value: boolean) => {
    setDailyReminder(value);
    await AsyncStorage.setItem('daily_reminder_enabled', String(value));
    if (!value) {
      await cancelDailyReminder();
      return;
    }

    await scheduleDailyReminder(reminderTimeDate);
  };

  const handleReminderPickerChange = async (
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    if (Platform.OS === 'android') {
      setShowReminderPicker(false);
      if (event.type === 'dismissed') return;
    }

    if (!selectedDate) return;
    const nextDate = new Date(0, 0, 0, selectedDate.getHours(), selectedDate.getMinutes(), 0);
    setReminderTimeDate(nextDate);
    await AsyncStorage.setItem('daily_reminder_time', formatReminderTime(nextDate));
    if (dailyReminder) {
      await scheduleDailyReminder(nextDate);
    }
  };

  const handleSessionLengthPress = () => {
    router.push('/session-length');
  };

  const handleSaveEmergencyNumber = async () => {
    const trimmed = emergencyNumber.trim();
    setSavingEmergencyNumber(true);
    try {
      if (!trimmed) {
        await AsyncStorage.removeItem('emergency_number');
        Alert.alert('Saved', 'Emergency number removed.');
      } else {
        await AsyncStorage.setItem('emergency_number', trimmed);
        Alert.alert('Saved', 'Emergency number updated.');
      }
    } catch (error) {
      console.log('Error saving emergency number:', error);
      Alert.alert('Error', 'Failed to save emergency number.');
    } finally {
      setSavingEmergencyNumber(false);
    }
  };

  // ---- small UI helpers ----
  const Row = ({
    icon,
    label,
    right,
    onPress,
    danger,
    disabled,
  }: {
    icon: any;
    label: string;
    right?: React.ReactNode;
    onPress?: () => void;
    danger?: boolean;
    disabled?: boolean;
  }) => (
    <TouchableOpacity
      activeOpacity={onPress ? 0.85 : 1}
      onPress={onPress}
      disabled={!onPress || disabled}
      style={[styles.row, disabled && { opacity: 0.7 }]}
    >
      <View style={styles.rowLeft}>
        <View style={[styles.rowIcon, danger && { backgroundColor: withAlpha(colors.danger, 0.12) }]}>
          <MaterialCommunityIcons
            name={icon}
            size={20}
            color={danger ? colors.danger : colors.icon}
          />
        </View>
        <Text style={[styles.rowLabel, danger && { color: withAlpha(colors.danger, 0.8) }]}>{label}</Text>
      </View>

      <View style={styles.rowRight}>
        {right}
        {onPress ? (
          <MaterialCommunityIcons
            name="chevron-right"
            size={22}
            color={withAlpha(colors.textMuted, 0.8)}
          />
        ) : null}
      </View>
    </TouchableOpacity>
  );

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={{ marginTop: 16 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );

  const { colorScheme, colors, setColorScheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const isDark = colorScheme === 'dark';

  const appVersion = useMemo(() => '1.0.0', []);
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const heroGradient = useMemo(
    () =>
      (isDark
        ? [colors.primaryDark, colors.primary, colors.primarySoft]
        : [colors.primary, colors.primaryDark, colors.primarySoft2]) as [string, string, string],
    [colors, isDark]
  );

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO HEADER */}
        <LinearGradient
          colors={heroGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.heroIconBtn} activeOpacity={0.85}>
              <MaterialCommunityIcons
                name="arrow-left"
                size={22}
                color={withAlpha(colors.textOnPrimary, 0.9)}
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/settings')} style={styles.heroIconBtn} activeOpacity={0.85}>
              <MaterialCommunityIcons
                name="cog-outline"
                size={22}
                color={withAlpha(colors.textOnPrimary, 0.9)}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.heroTitle}>Settings</Text>
          <Text style={styles.heroSub}>Make this space feel right for you</Text>

          {/* hills */}
          <View style={styles.hillLayer}>
            <View style={styles.hill1} />
            <View style={styles.hill2} />
          </View>
        </LinearGradient>

        {/* PROFILE CARD */}
        <View style={styles.profileCard}>
          <View style={styles.profileLeft}>
            <View style={styles.avatar}>
              {/* ถ้ามีรูปในอนาคตเปลี่ยนเป็น Image ได้ */}
              <MaterialCommunityIcons name="account" size={22} color={colors.icon} />
            </View>
            <View>
              <Text style={styles.profileName}>{userName}</Text>
              <Text style={styles.profileEmail}>{userEmail}</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/editprofile' as any)}
            activeOpacity={0.85}
            style={styles.editProfileBtn}
          >
            <Text style={styles.editProfileText}>Edit Profile</Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={withAlpha(colors.text, 0.6)}
            />
          </TouchableOpacity>
        </View>

        {/* Preferences */}
        <Section title="Preferences">
          <Row
            icon="bell-outline"
            label="Daily Reminder"
            right={
              <Switch
                value={dailyReminder}
                onValueChange={handleDailyReminderToggle}
                thumbColor={Platform.OS === 'android' ? colors.textOnPrimary : undefined}
                trackColor={{
                  false: withAlpha(colors.textMuted, 0.25),
                  true: withAlpha(colors.primary, 0.65),
                }}
              />
            }
          />
          <View style={styles.divider} />

          <Row
            icon="clock-outline"
            label="Reminder Time"
            onPress={() => setShowReminderPicker((prev) => !prev)}
            right={<Text style={styles.valueText}>{formatReminderTime(reminderTimeDate)}</Text>}
            disabled={!dailyReminder}
          />
          {showReminderPicker ? (
            <View style={styles.pickerContainer}>
              <DateTimePicker
                value={reminderTimeDate}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleReminderPickerChange}
                is24Hour
                textColor={isDark ? colors.textOnPrimary : colors.text}
              />
            </View>
          ) : null}
          <View style={styles.divider} />

          <Row
            icon="flower-outline"
            label="Session Length"
            onPress={handleSessionLengthPress}
            right={<Text style={styles.valueText}>{formatSessionLength(sessionLengthMinutes)}</Text>}
          />
        </Section>

        {/* Language */}
        <Section title="Language">
          <View style={styles.languageToggle}>
            <TouchableOpacity
              style={[styles.languageOption, language === 'en' && styles.languageOptionActive]}
              onPress={() => setLanguage('en')}
              activeOpacity={0.85}
            >
              <Text style={[styles.languageText, language === 'en' && styles.languageTextActive]}>
                English
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.languageOption, language === 'th' && styles.languageOptionActive]}
              onPress={() => setLanguage('th')}
              activeOpacity={0.85}
            >
              <Text style={[styles.languageText, language === 'th' && styles.languageTextActive]}>
                ภาษาไทย
              </Text>
            </TouchableOpacity>
          </View>
        </Section>

        {/* Sound & Mood */}
        <Section title="Sound & Mood">
          <Row
            icon="music-note-outline"
            label="Background Sound"
            right={
              <Switch
                value={bgSound}
                onValueChange={setBgSound}
                thumbColor={Platform.OS === 'android' ? colors.textOnPrimary : undefined}
                trackColor={{
                  false: withAlpha(colors.textMuted, 0.25),
                  true: withAlpha(colors.primary, 0.65),
                }}
              />
            }
          />
          <View style={styles.divider} />

          {/* “Volume” แบบลุคใกล้ภาพ (ทำเป็นแถบหลอกแบบง่าย) */}
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={styles.rowIcon}>
                <MaterialCommunityIcons name="volume-medium" size={20} color={colors.icon} />
              </View>
              <Text style={styles.rowLabel}>Volume</Text>
            </View>

            <View style={styles.rowRightWide}>
              <View style={styles.volumeTrack}>
                <View style={[styles.volumeFill, { width: `${Math.round(volume * 100)}%` }]} />
                <View style={[styles.volumeKnob, { left: `${Math.round(volume * 100)}%` }]} />
              </View>

              <TouchableOpacity
                onPress={() => setVolume((v) => (v >= 0.9 ? 0.2 : Math.min(1, v + 0.2)))}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={22}
                  color={withAlpha(colors.textMuted, 0.8)}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

            <Row
              icon="moon-waning-crescent"
              label="Dark Mode"
              right={
                <Switch
                  value={colorScheme === 'dark'}
                  onValueChange={(value) => setColorScheme(value ? 'dark' : 'light')}
                  thumbColor={Platform.OS === 'android' ? colors.textOnPrimary : undefined}
                  trackColor={{
                    false: withAlpha(colors.textMuted, 0.25),
                    true: withAlpha(colors.primary, 0.65),
                  }}
                />
              }
            />
          </Section>

        {/* Crisis */}
        <Section title="Crisis">
          <View style={styles.crisisContent}>
            <Text style={styles.crisisLabel}>Emergency Number</Text>
            <TextInput
              style={styles.input}
              value={emergencyNumber}
              onChangeText={setEmergencyNumber}
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
              placeholder="e.g. +66 2 123 4567"
              placeholderTextColor={colors.textMuted}
            />
            <Text style={styles.crisisHint}>Used when you tap Crisis mode on Home.</Text>
            <TouchableOpacity
              style={[styles.primaryBtn, styles.crisisSaveBtn, savingEmergencyNumber && { opacity: 0.7 }]}
              onPress={handleSaveEmergencyNumber}
              disabled={savingEmergencyNumber}
              activeOpacity={0.9}
            >
              {savingEmergencyNumber ? (
                <ActivityIndicator color={colors.textOnPrimary} />
              ) : (
                <Text style={styles.primaryBtnText}>Save Number</Text>
              )}
            </TouchableOpacity>
          </View>
        </Section>

        {/* Security */}
        <Section title="Security">
          <Row
            icon="lock-outline"
            label="Change Password"
            onPress={() => setShowChangePassword((s) => !s)}
          />

          {/* Expand panel (ฟอร์มเดิมของคุณ แต่ theme ใหม่) */}
          {showChangePassword && (
            <View style={styles.expandBox}>
              <Text style={styles.expandHint}>Enter your current password and new password</Text>

              <View style={{ height: 10 }} />

              <TextInput
                style={styles.input}
                value={oldPassword}
                onChangeText={setOldPassword}
                secureTextEntry
                placeholder="Current password"
                placeholderTextColor={colors.textMuted}
              />
              <View style={{ height: 12 }} />
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                placeholder="New password"
                placeholderTextColor={colors.textMuted}
              />
              <View style={{ height: 12 }} />
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholder="Confirm new password"
                placeholderTextColor={colors.textMuted}
              />

              <TouchableOpacity
                style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
                onPress={handleChangePassword}
                disabled={loading}
                activeOpacity={0.9}
              >
                {loading ? (
                  <ActivityIndicator color={colors.textOnPrimary} />
                ) : (
                  <Text style={styles.primaryBtnText}>Update Password</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.divider} />

          <Row icon="logout" label="Log out" danger onPress={handleLogout} />
          <View style={styles.divider} />
          <Row icon="delete-clock" label="Delete Chat History" danger onPress={handleDeleteHistory} />
          <View style={styles.divider} />
          <Row icon="account-remove" label="Delete Account" danger onPress={handleDeleteAccount} />
        </Section>

        {/* About */}
        <Section title="About">
          <Row
            icon="file-document-outline"
            label="Privacy Policy"
            onPress={() => Alert.alert('Privacy Policy', 'คุณสามารถลิงก์ไปหน้า Privacy ได้ครับ')}
          />
          <View style={styles.divider} />
          <Row
            icon="file-certificate-outline"
            label="Terms & Conditions"
            onPress={() => Alert.alert('Terms & Conditions', 'คุณสามารถลิงก์ไปหน้า Terms ได้ครับ')}
            right={<Text style={styles.valueText}>{appVersion}</Text>}
          />
          <View style={styles.divider} />
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={styles.rowIcon}>
                <MaterialCommunityIcons name="information-outline" size={20} color={colors.icon} />
              </View>
              <Text style={styles.rowLabel}>App Version</Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={styles.valueText}>{appVersion}</Text>
            </View>
          </View>
        </Section>

        <View style={{ height: 26 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

type ThemeColors = ReturnType<typeof useTheme>['colors'];

const createStyles = (colors: ThemeColors, isDark: boolean) => {
  const overlayBase = isDark ? colors.textOnPrimary : colors.text;

  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingBottom: 22 },

    hero: {
      margin: 18,
      borderRadius: 28,
      padding: 18,
      paddingBottom: 24,
      overflow: 'hidden',
    },
    heroTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    heroIconBtn: {
      width: 40,
      height: 40,
      borderRadius: 999,
      backgroundColor: withAlpha(colors.textOnPrimary, 0.18),
      justifyContent: 'center',
      alignItems: 'center',
    },
    heroTitle: {
      marginTop: 18,
      color: colors.textOnPrimary,
      fontSize: 34,
      fontWeight: '900',
      letterSpacing: 0.2,
    },
    heroSub: {
      marginTop: 6,
      color: withAlpha(colors.textOnPrimary, 0.85),
      fontSize: 14,
      fontWeight: '700',
    },

    hillLayer: {
      position: 'absolute',
      left: -20,
      right: -20,
      bottom: -34,
      height: 160,
    },
    hill1: {
      position: 'absolute',
      left: 30,
      right: 120,
      bottom: 0,
      height: 120,
      borderTopLeftRadius: 90,
      borderTopRightRadius: 120,
      backgroundColor: withAlpha(colors.primaryDark, isDark ? 0.32 : 0.24),
    },
    hill2: {
      position: 'absolute',
      left: 90,
      right: 10,
      bottom: -12,
      height: 130,
      borderTopLeftRadius: 120,
      borderTopRightRadius: 90,
      backgroundColor: withAlpha(colors.primaryDark, isDark ? 0.46 : 0.32),
    },

    profileCard: {
      marginHorizontal: 18,
      marginTop: 2,
      backgroundColor: colors.surface,
      borderRadius: 22,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOpacity: 1,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 8 },
      elevation: 4,
    },
    profileLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 999,
      backgroundColor: withAlpha(overlayBase, 0.08),
      alignItems: 'center',
      justifyContent: 'center',
    },
    profileName: { color: colors.text, fontWeight: '900', fontSize: 16 },
    profileEmail: { color: colors.textMuted, fontWeight: '700', marginTop: 2 },

    editProfileBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 999,
      backgroundColor: withAlpha(colors.primary, isDark ? 0.2 : 0.12),
    },
    editProfileText: { color: colors.text, fontWeight: '900' },

    sectionTitle: {
      marginHorizontal: 22,
      marginBottom: 10,
      marginTop: 6,
      color: colors.textMuted,
      fontWeight: '900',
      fontSize: 16,
    },
    sectionCard: {
      marginHorizontal: 18,
      backgroundColor: colors.surface,
      borderRadius: 22,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOpacity: 1,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 8 },
      elevation: 2,
    },

    row: {
      paddingHorizontal: 14,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    rowIcon: {
      width: 34,
      height: 34,
      borderRadius: 12,
      backgroundColor: colors.primarySoft2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowLabel: {
      color: colors.text,
      fontWeight: '900',
      fontSize: 15,
    },
    rowRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    rowRightWide: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
      justifyContent: 'flex-end',
    },

    languageToggle: {
      marginHorizontal: 14,
      marginBottom: 12,
      flexDirection: 'row',
      gap: 10,
      padding: 6,
      borderRadius: 16,
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.border,
    },
    languageOption: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 12,
      alignItems: 'center',
    },
    languageOptionActive: {
      backgroundColor: withAlpha(colors.primary, isDark ? 0.3 : 0.18),
      borderWidth: 1,
      borderColor: withAlpha(colors.primary, 0.45),
    },
    languageText: {
      color: colors.textMuted,
      fontWeight: '800',
      fontSize: 14,
    },
    languageTextActive: {
      color: colors.primary,
    },

    divider: {
      height: 1,
      backgroundColor: colors.divider,
      marginHorizontal: 14,
    },

    pickerContainer: {
      marginHorizontal: 14,
      marginBottom: 8,
      paddingVertical: 6,
      paddingHorizontal: 6,
      borderRadius: 16,
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.border,
    },

    valueText: {
      color: colors.textMuted,
      fontWeight: '900',
    },

    expandBox: {
      marginHorizontal: 14,
      marginBottom: 12,
      marginTop: 8,
      backgroundColor: colors.surface2,
      borderRadius: 18,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    expandHint: { color: colors.textMuted, fontWeight: '700' },

    input: {
      width: '100%',
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: Platform.OS === 'ios' ? 14 : 12,
      fontSize: 15,
      color: colors.text,
      fontWeight: '800',
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.border,
    },

    primaryBtn: {
      marginTop: 14,
      borderRadius: 16,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
    },
    primaryBtnText: { color: colors.textOnPrimary, fontWeight: '900', fontSize: 15 },

    crisisContent: {
      paddingHorizontal: 14,
      paddingTop: 10,
      paddingBottom: 14,
      gap: 10,
    },
    crisisLabel: {
      color: colors.text,
      fontWeight: '900',
      fontSize: 15,
    },
    crisisHint: {
      color: colors.textMuted,
      fontWeight: '700',
      fontSize: 12,
    },
    crisisSaveBtn: {
      marginTop: 4,
      backgroundColor: colors.danger,
    },

    volumeTrack: {
      height: 8,
      borderRadius: 999,
      backgroundColor: withAlpha(colors.primary, isDark ? 0.24 : 0.18),
      width: 150,
      position: 'relative',
      overflow: 'hidden',
    },
    volumeFill: {
      height: 8,
      borderRadius: 999,
      backgroundColor: colors.primary,
    },
    volumeKnob: {
      position: 'absolute',
      top: -5,
      width: 18,
      height: 18,
      borderRadius: 999,
      backgroundColor: colors.surface,
      marginLeft: -9,
    },
  });
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

const formatReminderTime = (date: Date) =>
  date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

const parseReminderTime = (value: string) => {
  const [hourPart, minutePart] = value.split(':');
  const hour = Number(hourPart);
  const minute = Number(minutePart);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  return new Date(0, 0, 0, hour, minute, 0);
};

const formatSessionLength = (minutes: number) => {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (remaining === 0) return `${hours} hr`;
  return `${hours} hr ${remaining} min`;
};
