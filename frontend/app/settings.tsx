/**
 * settings.tsx — หน้าตั้งค่า
 *
 * แก้ข้อความทุกส่วน → แก้ใน STRINGS.en / STRINGS.th (บรรทัด ~30)
 *
 * AsyncStorage keys ที่ใช้ในหน้านี้:
 *   'user_name'                → ชื่อผู้ใช้
 *   'user_email'               → อีเมล
 *   'daily_reminder_enabled'   → เปิด/ปิดการแจ้งเตือน (true/false)
 *   'daily_reminder_time'      → เวลาแจ้งเตือน (HH:MM)
 *   'emergency_contact_number' → เบอร์โทรฉุกเฉิน
 *
 * Sections (กลุ่มการตั้งค่า):
 *   - Preferences  → reminder, ภาษา, dark mode
 *   - Sound        → background sound, volume
 *   - Emergency    → emergency contact number
 *   - Security     → change password, logout, delete account
 *   - About        → privacy, terms, app version
 *
 * Bottom Bar — tab ที่ active คือ Settings (cog icon, สว่างเต็ม)
 */
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
  Linking,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import api from '@/utils/api';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/context/theme-context';
import { useLanguage } from '@/context/language-context';

const STRINGS = {
  en: {
    title: 'Settings',
    titleSub: 'Make this space feel right for you',
    editProfile: 'Edit Profile',
    // sections
    secPreferences: 'Preferences',
    secSound: 'Sound & Mood',
    secEmergency: 'Emergency Contact',
    secSecurity: 'Security',
    secAbout: 'About',
    // preferences
    dailyReminder: 'Daily Reminder',
    reminderTime: 'Reminder Time',
    language: 'Language',
    // sound
    bgSound: 'Background Sound',
    volume: 'Volume',
    darkMode: 'Dark Mode',
    // emergency
    emergencyNumber: 'Emergency Contact',
    emergencyHint: 'Enter the phone number to call in an emergency',
    emergencyPlaceholder: 'e.g. 1323 or 0812345678',
    saveNumber: 'Save Number',
    callEmergency: 'Call Emergency Contact',
    // security
    changePassword: 'Change Password',
    pwHint: 'Enter your current password and new password',
    pwCurrent: 'Current password',
    pwNew: 'New password',
    pwConfirm: 'Confirm new password',
    pwUpdate: 'Update Password',
    logout: 'Log out',
    deleteHistory: 'Delete Chat History',
    deleteAccount: 'Delete Account',
    // about
    privacyPolicy: 'Privacy Policy',
    terms: 'Terms & Conditions',
    appVersion: 'App Version',
    // alerts - change password
    pwErrFill: 'Please fill in all fields',
    pwErrMatch: 'New passwords do not match',
    pwErrLength: 'New password must be at least 6 characters',
    pwSuccess: 'Password changed successfully',
    // alerts - delete history
    deleteHistoryTitle: 'Delete Chat History',
    deleteHistoryMsg: 'Are you sure you want to delete all your chat history? This cannot be undone.',
    deleteHistorySuccess: 'Chat history deleted.',
    deleteHistoryFail: 'Failed to delete history.',
    // alerts - delete account
    deleteAccountTitle: 'Delete Account',
    deleteAccountMsg: 'Are you sure you want to permanently delete your account and all data? This action CANNOT be undone.',
    deleteAccountBtn: 'Delete My Account',
    deleteAccountSuccess: 'Account Deleted',
    deleteAccountSuccessMsg: 'Your account has been deleted.',
    deleteAccountFail: 'Failed to delete account.',
    // alerts - logout
    logoutTitle: 'Log out',
    logoutMsg: 'Are you sure you want to log out?',
    // alerts - emergency
    emergencyErrEmpty: 'Please enter a phone number',
    emergencySavedMsg: (n: string) => `Emergency contact saved: ${n}`,
    emergencyNoContact: 'Please set an emergency contact number first.',
    // alerts - notification
    notifWebUnsupported: 'Notification is not supported on web',
    notifScheduleFail: 'Failed to schedule reminder',
    notifTitle: 'MindNest Reminder',
    notifBody: "Time to check in on how you're feeling 💙",
    notifPermDenied: 'Notification permission was denied. Please enable it in your device settings.',
    setReminderBtn: 'Set Reminder',
    reminderSetSuccess: (time: string) => `Reminder set for ${time} every day 🔔`,
    cancel: 'Cancel',
    delete: 'Delete',
    ok: 'OK',
    error: 'Error',
    saved: 'Saved',
    success: 'Success',
  },
  th: {
    title: 'ตั้งค่า',
    titleSub: 'ปรับแต่งให้เหมาะกับตัวคุณ',
    editProfile: 'แก้ไขโปรไฟล์',
    // sections
    secPreferences: 'การตั้งค่า',
    secSound: 'เสียง & บรรยากาศ',
    secEmergency: 'ผู้ติดต่อฉุกเฉิน',
    secSecurity: 'ความปลอดภัย',
    secAbout: 'เกี่ยวกับ',
    // preferences
    dailyReminder: 'การแจ้งเตือนประจำวัน',
    reminderTime: 'เวลาแจ้งเตือน',
    language: 'ภาษา',
    // sound
    bgSound: 'เสียงพื้นหลัง',
    volume: 'ระดับเสียง',
    darkMode: 'โหมดมืด',
    // emergency
    emergencyNumber: 'เบอร์ฉุกเฉิน',
    emergencyHint: 'กรอกเบอร์โทรที่ต้องการโทรเมื่อฉุกเฉิน',
    emergencyPlaceholder: 'เช่น 1323 หรือ 0812345678',
    saveNumber: 'บันทึกเบอร์',
    callEmergency: 'โทรหาผู้ติดต่อฉุกเฉิน',
    // security
    changePassword: 'เปลี่ยนรหัสผ่าน',
    pwHint: 'กรอกรหัสผ่านปัจจุบันและรหัสผ่านใหม่',
    pwCurrent: 'รหัสผ่านปัจจุบัน',
    pwNew: 'รหัสผ่านใหม่',
    pwConfirm: 'ยืนยันรหัสผ่านใหม่',
    pwUpdate: 'อัปเดตรหัสผ่าน',
    logout: 'ออกจากระบบ',
    deleteHistory: 'ลบประวัติแชท',
    deleteAccount: 'ลบบัญชี',
    // about
    privacyPolicy: 'นโยบายความเป็นส่วนตัว',
    terms: 'ข้อกำหนดและเงื่อนไข',
    appVersion: 'เวอร์ชันแอป',
    // alerts - change password
    pwErrFill: 'กรุณากรอกข้อมูลให้ครบ',
    pwErrMatch: 'รหัสผ่านใหม่ไม่ตรงกัน',
    pwErrLength: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร',
    pwSuccess: 'เปลี่ยนรหัสผ่านสำเร็จ',
    // alerts - delete history
    deleteHistoryTitle: 'ลบประวัติแชท',
    deleteHistoryMsg: 'คุณแน่ใจหรือไม่ว่าต้องการลบประวัติแชททั้งหมด? ไม่สามารถกู้คืนได้',
    deleteHistorySuccess: 'ลบประวัติแชทเรียบร้อยแล้ว',
    deleteHistoryFail: 'ลบประวัติแชทไม่สำเร็จ',
    // alerts - delete account
    deleteAccountTitle: 'ลบบัญชี',
    deleteAccountMsg: 'คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีและข้อมูลทั้งหมดอย่างถาวร? การกระทำนี้ไม่สามารถยกเลิกได้',
    deleteAccountBtn: 'ลบบัญชีของฉัน',
    deleteAccountSuccess: 'ลบบัญชีแล้ว',
    deleteAccountSuccessMsg: 'บัญชีของคุณถูกลบแล้ว',
    deleteAccountFail: 'ลบบัญชีไม่สำเร็จ',
    // alerts - logout
    logoutTitle: 'ออกจากระบบ',
    logoutMsg: 'คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบ?',
    // alerts - emergency
    emergencyErrEmpty: 'กรุณากรอกเบอร์โทรศัพท์',
    emergencySavedMsg: (n: string) => `บันทึกผู้ติดต่อฉุกเฉิน: ${n}`,
    emergencyNoContact: 'กรุณาตั้งเบอร์ผู้ติดต่อฉุกเฉินในหน้าตั้งค่าก่อน',
    // alerts - notification
    notifWebUnsupported: 'ไม่รองรับการแจ้งเตือนบนเว็บ',
    notifScheduleFail: 'ตั้งเวลาแจ้งเตือนไม่สำเร็จ',
    notifTitle: 'MindNest Reminder',
    notifBody: 'ได้เวลาเช็คอินความรู้สึกแล้วนะ 💙',
    notifPermDenied: 'ไม่ได้รับอนุญาตให้แจ้งเตือน กรุณาเปิดในการตั้งค่าอุปกรณ์',
    setReminderBtn: 'ตั้งเวลาแจ้งเตือน',
    reminderSetSuccess: (time: string) => `ตั้งแจ้งเตือนเวลา ${time} ทุกวันเรียบร้อยแล้ว 🔔`,
    cancel: 'ยกเลิก',
    delete: 'ลบ',
    ok: 'ตกลง',
    error: 'ข้อผิดพลาด',
    saved: 'บันทึกแล้ว',
    success: 'สำเร็จ',
  },
};

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
  const [bgSound, setBgSound] = useState(true);
  const [volume, setVolume] = useState(0.6);

  // Emergency contact
  const [emergencyNumber, setEmergencyNumber] = useState('');
  const [emergencyInput, setEmergencyInput] = useState('');
  const [showEmergencyInput, setShowEmergencyInput] = useState(false);

  // Expand panels
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Change password form
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const name = await AsyncStorage.getItem('user_name');
        const email = await AsyncStorage.getItem('user_email');
        const storedReminderEnabled = await AsyncStorage.getItem('daily_reminder_enabled');
        const storedReminderTime = await AsyncStorage.getItem('daily_reminder_time');
        const storedEmergency = await AsyncStorage.getItem('emergency_contact_number');
        if (name) setUserName(name);
        if (email) setUserEmail(email);
        if (storedReminderEnabled !== null) {
          setDailyReminder(storedReminderEnabled === 'true');
        }
        if (storedReminderTime) {
          const parsed = parseReminderTime(storedReminderTime);
          if (parsed) {
            setReminderTimeDate(parsed);
          }
        }
        if (storedEmergency) {
          setEmergencyNumber(storedEmergency);
          setEmergencyInput(storedEmergency);
        }
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  useEffect(() => {
    const requestNotificationPermissions = async () => {
      if (Platform.OS === 'web') return;
      const { status: existing } = await Notifications.getPermissionsAsync();
      if (existing === 'granted') return;
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        // Turn off the toggle if permission denied
        setDailyReminder(false);
        await AsyncStorage.setItem('daily_reminder_enabled', 'false');
        Alert.alert(t.error, t.notifPermDenied);
      }
    };

    requestNotificationPermissions();
  }, []);

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert(t.error, t.pwErrFill);
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(t.error, t.pwErrMatch);
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert(t.error, t.pwErrLength);
      return;
    }

    setLoading(true);
    try {
      const userId = await AsyncStorage.getItem('user_id');
      if (!userId) {
        Alert.alert(t.error, 'User ID not found. Please log in again.');
        router.replace('/');
        return;
      }

      const response = await api.post('/auth/change-password', {
        user_id: userId,
        old_password: oldPassword,
        new_password: newPassword,
      });

      if (response.status === 200) {
        Alert.alert(t.success, t.pwSuccess, [
          {
            text: t.ok,
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
      t.deleteHistoryTitle,
      t.deleteHistoryMsg,
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.delete,
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            let remoteDeleteFailed = false;
            try {
              await api.delete('/chat/history');
            } catch (error) {
              remoteDeleteFailed = true;
              console.log('Delete History Error:', error);
            }

            try {
              await AsyncStorage.removeItem('chat_history');
              Alert.alert(
                t.success,
                remoteDeleteFailed ? `${t.deleteHistorySuccess} (Local cache cleared)` : t.deleteHistorySuccess
              );
            } catch (localError) {
              console.log('Delete Local History Error:', localError);
              Alert.alert(t.error, t.deleteHistoryFail);
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
      t.deleteAccountTitle,
      t.deleteAccountMsg,
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.deleteAccountBtn,
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const response = await api.delete('/auth/me');
              if (response.status === 200) {
                await AsyncStorage.multiRemove(['user_id', 'user_name', 'user_email']);
                Alert.alert(t.deleteAccountSuccess, t.deleteAccountSuccessMsg);
                router.replace('/');
              }
            } catch (error) {
              console.log('Delete Account Error:', error);
              Alert.alert(t.error, t.deleteAccountFail);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert(t.logoutTitle, t.logoutMsg, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.logout,
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
      Alert.alert('Reminder', t.notifWebUnsupported);
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
          title: t.notifTitle,
          body: t.notifBody,
        },
        trigger,
      });

      await AsyncStorage.setItem('daily_reminder_notification_id', id);
    } catch (error) {
      console.log('Error scheduling daily reminder:', error);
      Alert.alert(t.error, t.notifScheduleFail);
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

  const handleReminderPickerChange = (
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
  };

  const handleSetReminder = async () => {
    await AsyncStorage.setItem('daily_reminder_time', formatReminderTime(reminderTimeDate));
    if (dailyReminder) {
      await scheduleDailyReminder(reminderTimeDate);
    }
    setShowReminderPicker(false);
    Alert.alert(t.success, t.reminderSetSuccess(formatReminderTime(reminderTimeDate)));
  };

  const handleSaveEmergencyNumber = async () => {
    const trimmed = emergencyInput.trim();
    if (!trimmed) {
      Alert.alert(t.error, t.emergencyErrEmpty);
      return;
    }
    await AsyncStorage.setItem('emergency_contact_number', trimmed);
    setEmergencyNumber(trimmed);
    setShowEmergencyInput(false);
    Alert.alert(t.saved, t.emergencySavedMsg(trimmed));
  };

  const handleCallEmergency = () => {
    if (!emergencyNumber) {
      Alert.alert(t.secEmergency, t.emergencyNoContact);
      return;
    }
    Linking.openURL(`tel:${emergencyNumber}`);
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
  const { lang, setLang } = useLanguage();
  const t = STRINGS[lang];
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
      <View style={styles.container}>
      <ScrollView
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

          <Text style={styles.heroTitle}>{t.title}</Text>
          <Text style={styles.heroSub}>{t.titleSub}</Text>

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
            <Text style={styles.editProfileText}>{t.editProfile}</Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={withAlpha(colors.text, 0.6)}
            />
          </TouchableOpacity>
        </View>

        {/* Preferences */}
        <Section title={t.secPreferences}>
          <Row
            icon="bell-outline"
            label={t.dailyReminder}
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
            label={t.reminderTime}
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
              <TouchableOpacity
                style={styles.setReminderBtn}
                onPress={handleSetReminder}
                activeOpacity={0.9}
                disabled={!dailyReminder}
              >
                <MaterialCommunityIcons name="bell-check-outline" size={18} color={colors.textOnPrimary} />
                <Text style={styles.setReminderBtnText}>{t.setReminderBtn}</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          <View style={styles.divider} />

          <Row
            icon="translate"
            label={t.language}
            right={
              <View style={styles.langToggleWrap}>
                <TouchableOpacity
                  onPress={() => setLang('th')}
                  style={[styles.langChip, lang === 'th' && styles.langChipActive]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.langChipText, lang === 'th' && styles.langChipTextActive]}>TH</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setLang('en')}
                  style={[styles.langChip, lang === 'en' && styles.langChipActive]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.langChipText, lang === 'en' && styles.langChipTextActive]}>EN</Text>
                </TouchableOpacity>
              </View>
            }
          />
        </Section>

        {/* Sound & Mood */}
        <Section title={t.secSound}>
          <Row
            icon="music-note-outline"
            label={t.bgSound}
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
              <Text style={styles.rowLabel}>{t.volume}</Text>
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
              label={t.darkMode}
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

        {/* Emergency Contact */}
        <Section title={t.secEmergency}>
          <Row
            icon="phone-alert"
            label={t.emergencyNumber}
            onPress={() => setShowEmergencyInput((s) => !s)}
            right={
              emergencyNumber ? (
                <Text style={styles.valueText}>{emergencyNumber}</Text>
              ) : undefined
            }
          />

          {showEmergencyInput && (
            <View style={styles.expandBox}>
              <Text style={styles.expandHint}>{t.emergencyHint}</Text>
              <View style={{ height: 10 }} />
              <TextInput
                style={styles.input}
                value={emergencyInput}
                onChangeText={setEmergencyInput}
                placeholder={t.emergencyPlaceholder}
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
              />
              <TouchableOpacity
                style={[styles.primaryBtn, { marginTop: 14 }]}
                onPress={handleSaveEmergencyNumber}
                activeOpacity={0.9}
              >
                <Text style={styles.primaryBtnText}>{t.saveNumber}</Text>
              </TouchableOpacity>
            </View>
          )}

          {emergencyNumber ? (
            <>
              <View style={styles.divider} />
              <TouchableOpacity
                onPress={handleCallEmergency}
                activeOpacity={0.9}
                style={styles.emergencyCallBtn}
              >
                <View style={[styles.rowIcon, { backgroundColor: withAlpha(colors.danger, 0.12) }]}>
                  <MaterialCommunityIcons name="phone" size={20} color={colors.danger} />
                </View>
                <Text style={[styles.rowLabel, { color: colors.danger }]}>{t.callEmergency}</Text>
              </TouchableOpacity>
            </>
          ) : null}
        </Section>

        {/* Security */}
        <Section title={t.secSecurity}>
          <Row
            icon="lock-outline"
            label={t.changePassword}
            onPress={() => setShowChangePassword((s) => !s)}
          />

          {/* Expand panel (ฟอร์มเดิมของคุณ แต่ theme ใหม่) */}
          {showChangePassword && (
            <View style={styles.expandBox}>
              <Text style={styles.expandHint}>{t.pwHint}</Text>

              <View style={{ height: 10 }} />

              <TextInput
                style={styles.input}
                value={oldPassword}
                onChangeText={setOldPassword}
                secureTextEntry
                placeholder={t.pwCurrent}
                placeholderTextColor={colors.textMuted}
              />
              <View style={{ height: 12 }} />
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                placeholder={t.pwNew}
                placeholderTextColor={colors.textMuted}
              />
              <View style={{ height: 12 }} />
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholder={t.pwConfirm}
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
                  <Text style={styles.primaryBtnText}>{t.pwUpdate}</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.divider} />

          <Row icon="logout" label={t.logout} danger onPress={handleLogout} />
          <View style={styles.divider} />
          <Row icon="delete-clock" label={t.deleteHistory} danger onPress={handleDeleteHistory} />
          <View style={styles.divider} />
          <Row icon="account-remove" label={t.deleteAccount} danger onPress={handleDeleteAccount} />
        </Section>

        {/* About */}
        <Section title={t.secAbout}>
          <Row
            icon="file-document-outline"
            label={t.privacyPolicy}
            onPress={() => Alert.alert('Privacy Policy', 'คุณสามารถลิงก์ไปหน้า Privacy ได้ครับ')}
          />
          <View style={styles.divider} />
          <Row
            icon="file-certificate-outline"
            label={t.terms}
            onPress={() => Alert.alert('Terms & Conditions', 'คุณสามารถลิงก์ไปหน้า Terms ได้ครับ')}
            right={<Text style={styles.valueText}>{appVersion}</Text>}
          />
          <View style={styles.divider} />
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={styles.rowIcon}>
                <MaterialCommunityIcons name="information-outline" size={20} color={colors.icon} />
              </View>
              <Text style={styles.rowLabel}>{t.appVersion}</Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={styles.valueText}>{appVersion}</Text>
            </View>
          </View>
        </Section>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity onPress={() => router.replace('/home' as any)} style={styles.tabBtn} activeOpacity={0.8}>
          <MaterialCommunityIcons name="home-variant" size={24} color={withAlpha(colors.textOnPrimary, 0.65)} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/chat' as any)} style={styles.tabBtn} activeOpacity={0.8}>
          <MaterialCommunityIcons name="chat-processing" size={24} color={withAlpha(colors.textOnPrimary, 0.65)} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/resources' as any)} style={styles.tabBtn} activeOpacity={0.8}>
          <MaterialCommunityIcons name="phone" size={24} color={withAlpha(colors.textOnPrimary, 0.65)} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabBtn} activeOpacity={0.8}>
          <MaterialCommunityIcons name="cog" size={24} color={colors.textOnPrimary} />
        </TouchableOpacity>
      </View>

      </View>
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

    langToggleWrap: {
      flexDirection: 'row' as const,
      gap: 6,
    },
    langChip: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: withAlpha(colors.textMuted, 0.12),
    },
    langChipActive: {
      backgroundColor: colors.primary,
    },
    langChipText: {
      fontWeight: '800' as const,
      fontSize: 13,
      color: colors.textMuted,
    },
    langChipTextActive: {
      color: colors.textOnPrimary,
    },

    emergencyCallBtn: {
      paddingHorizontal: 14,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },

    setReminderBtn: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: 8,
      marginTop: 10,
      marginHorizontal: 6,
      marginBottom: 4,
      paddingVertical: 12,
      borderRadius: 14,
      backgroundColor: colors.primary,
    },
    setReminderBtnText: {
      color: colors.textOnPrimary,
      fontWeight: '900' as const,
      fontSize: 15,
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

    bottomBar: {
      position: 'absolute',
      left: 18,
      right: 18,
      bottom: 18,
      height: 64,
      borderRadius: 22,
      backgroundColor: colors.primaryDark,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      shadowColor: colors.shadow,
      shadowOpacity: 1,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 10 },
      elevation: 10,
      paddingHorizontal: 8,
    },
    tabBtn: {
      width: 52,
      height: 52,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
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

