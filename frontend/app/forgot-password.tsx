import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import api from '../utils/api';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '../context/theme-context';

const STRINGS = {
  en: {
    title: 'MindNest',
    header: 'Reset password',
    desc: 'Enter your email to find your account.',
    email: 'Email',
    next: 'Next',
    reset: 'Reset Password',
    sending: 'Processing...',
    back: 'Back to login',
    langLabel: 'TH / EN',
    fillEmail: 'Please enter your email.',
    fillAll: 'Please fill in all fields.',
    successTitle: 'Success',
    successMsg: 'Password has been reset. Login now.',
    errorTitle: 'Error',
    errorMsg: 'Request failed.',
    newPassword: 'New Password',
    ans1: 'Answer 1',
    ans2: 'Answer 2',
    step1: 'Find your account',
    step2: 'Verify & set new password',
    cancel: 'Cancel',
  },
  th: {
    title: 'MindNest',
    header: 'รีเซ็ตรหัสผ่าน',
    desc: 'กรอกอีเมลเพื่อค้นหาบัญชีของคุณ',
    email: 'อีเมล',
    next: 'ถัดไป',
    reset: 'รีเซ็ตรหัสผ่าน',
    sending: 'กำลังดำเนินการ...',
    back: 'กลับไปหน้าเข้าสู่ระบบ',
    langLabel: 'TH / EN',
    fillEmail: 'กรุณากรอกอีเมล',
    fillAll: 'กรุณากรอกข้อมูลให้ครบถ้วน',
    successTitle: 'สำเร็จ',
    successMsg: 'รีเซ็ตรหัสผ่านเรียบร้อยแล้ว',
    errorTitle: 'เกิดข้อผิดพลาด',
    errorMsg: 'ทำรายการไม่สำเร็จ',
    newPassword: 'รหัสผ่านใหม่',
    ans1: 'คำตอบ 1',
    ans2: 'คำตอบ 2',
    step1: 'ค้นหาบัญชีของคุณ',
    step2: 'ยืนยันตัวตนและตั้งรหัสใหม่',
    cancel: 'ยกเลิก',
  },
};

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [lang, setLang] = useState<'en' | 'th'>('en');
  const t = STRINGS[lang];

  // Step 1: Email
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [questions, setQuestions] = useState({ q1: '', q2: '' });

  // Step 2: Answers & New Password
  const [a1, setA1] = useState('');
  const [a2, setA2] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [secureNew, setSecureNew] = useState(true);

  const [loading, setLoading] = useState(false);
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

  const toggleLang = () => setLang((p) => (p === 'en' ? 'th' : 'en'));

  // Step 1: Find User & Get Questions
  const handleFindAccount = async () => {
    if (!email.trim()) {
      Alert.alert(t.fillEmail);
      return;
    }
    try {
      setLoading(true);
      const res = await api.post('/auth/security-questions', { email });
      setQuestions({
        q1: res.data.question_1,
        q2: res.data.question_2,
      });
      setStep(2);
    } catch (e: any) {
      console.log(e?.response || e);
      const msg = e?.response?.data?.detail || t.errorMsg;
      Alert.alert(t.errorTitle, msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify Answers & Reset
  const handleReset = async () => {
    if (!a1.trim() || !a2.trim() || !newPassword) {
      Alert.alert(t.fillAll);
      return;
    }
    try {
      setLoading(true);
      await api.post('/auth/reset-password', {
        email,
        security_answer_1: a1,
        security_answer_2: a2,
        new_password: newPassword,
      });
      Alert.alert(t.successTitle, t.successMsg, [
        { text: 'OK', onPress: () => router.replace('/login') },
      ]);
    } catch (e: any) {
      console.log(e?.response || e);
      const msg = e?.response?.data?.detail || t.errorMsg;
      Alert.alert(t.errorTitle, msg);
    } finally {
      setLoading(false);
    }
  };

  const stepLabel = step === 1 ? t.step1 : t.step2;

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>

          {/* HERO HEADER (เข้าธีมรูป) */}
          <LinearGradient
            colors={heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroTopRow}>
              <View style={styles.brandRow}>
                <View style={styles.logoWrap}>
                  <Image
                    source={require('../assets/images/mindnest-logo.png')}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.brandName}>{t.title}</Text>
              </View>

              <TouchableOpacity onPress={toggleLang} activeOpacity={0.85} style={styles.langPill}>
                <Text style={styles.langText}>{lang === 'en' ? 'TH' : 'EN'}</Text>
                <MaterialCommunityIcons name="translate" size={18} color={withAlpha(colors.textOnPrimary, 0.9)} />
              </TouchableOpacity>
            </View>

            <Text style={styles.heroGreeting}>{t.header}</Text>
            <Text style={styles.heroTitle}>{stepLabel}</Text>
            <Text style={styles.heroSub}>{t.desc}</Text>

            {/* hill overlay */}
            <View style={styles.hillLayer}>
              <View style={styles.hill1} />
              <View style={styles.hill2} />
            </View>
          </LinearGradient>

          {/* CONTENT */}
          <ScrollView
            style={styles.contentScroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.card}>
              {step === 1 && (
                <>
                  <Text style={styles.sectionTitle}>
                    {lang === 'en' ? 'Email' : 'อีเมล'}
                  </Text>

                  <View style={styles.inputWrap}>
                    <MaterialCommunityIcons name="email-outline" size={20} color={colors.iconMuted} />
                    <TextInput
                      placeholder={t.email}
                      placeholderTextColor={colors.textMuted}
                      style={styles.input}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.primaryButton, loading && { opacity: 0.7 }]}
                    activeOpacity={0.9}
                    onPress={handleFindAccount}
                    disabled={loading}
                  >
                    <LinearGradient
                      colors={[colors.primaryDark, colors.primary]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.primaryBtnGrad}
                    >
                      <Text style={styles.primaryButtonText}>
                        {loading ? t.sending : t.next}
                      </Text>
                      {!loading && (
                        <MaterialCommunityIcons name="arrow-right" size={20} color={colors.textOnPrimary} />
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}

              {step === 2 && (
                <>
                  {/* Q1 */}
                  <Text style={styles.questionLabel}>{questions.q1}</Text>
                  <View style={styles.inputWrap}>
                    <MaterialCommunityIcons name="form-textbox" size={20} color={colors.iconMuted} />
                    <TextInput
                      placeholder={t.ans1}
                      placeholderTextColor={colors.textMuted}
                      style={styles.input}
                      value={a1}
                      onChangeText={setA1}
                    />
                  </View>

                  {/* Q2 */}
                  <Text style={[styles.questionLabel, { marginTop: 12 }]}>{questions.q2}</Text>
                  <View style={styles.inputWrap}>
                    <MaterialCommunityIcons name="form-textbox" size={20} color={colors.iconMuted} />
                    <TextInput
                      placeholder={t.ans2}
                      placeholderTextColor={colors.textMuted}
                      style={styles.input}
                      value={a2}
                      onChangeText={setA2}
                    />
                  </View>

                  {/* NEW PASSWORD */}
                  <Text style={[styles.questionLabel, { marginTop: 12 }]}>
                    {t.newPassword}
                  </Text>
                  <View style={styles.inputWrap}>
                    <MaterialCommunityIcons name="lock-outline" size={20} color={colors.iconMuted} />
                    <TextInput
                      placeholder={t.newPassword}
                      placeholderTextColor={colors.textMuted}
                      style={styles.input}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry={secureNew}
                    />
                    <TouchableOpacity
                      onPress={() => setSecureNew((s) => !s)}
                      activeOpacity={0.8}
                      style={styles.eyeBtn}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <MaterialCommunityIcons
                        name={secureNew ? 'eye-outline' : 'eye-off-outline'}
                        size={20}
                        color={withAlpha(colors.textMuted, 0.9)}
                      />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={[styles.primaryButton, loading && { opacity: 0.7 }]}
                    activeOpacity={0.9}
                    onPress={handleReset}
                    disabled={loading}
                  >
                    <LinearGradient
                      colors={[colors.primaryDark, colors.primary]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.primaryBtnGrad}
                    >
                      <Text style={styles.primaryButtonText}>
                        {loading ? t.sending : t.reset}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* back to step1 (optional, ช่วย UX) */}
                  <TouchableOpacity
                    onPress={() => setStep(1)}
                    style={{ marginTop: 14, alignItems: 'center' }}
                    activeOpacity={0.85}
                    disabled={loading}
                  >
                    <Text style={{ color: colors.textMuted, fontWeight: '800' }}>
                      {lang === 'en' ? 'Change email' : 'เปลี่ยนอีเมล'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* Back to login */}
            <TouchableOpacity
              style={styles.backWrapper}
              onPress={() => router.replace('/login')}
              activeOpacity={0.85}
              disabled={loading}
            >
              <Text style={styles.backText}>{t.back}</Text>
            </TouchableOpacity>

            <View style={{ height: 28 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type ThemeColors = ReturnType<typeof useTheme>['colors'];

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1, backgroundColor: colors.background },

    hero: {
      margin: 18,
      borderRadius: 28,
      padding: 18,
      paddingBottom: 22,
      overflow: 'hidden',
    },
    heroTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },

    brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    logoWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: withAlpha(colors.textOnPrimary, 0.22),
      justifyContent: 'center',
      alignItems: 'center',
    },
    logoImage: { width: 28, height: 28 },
    brandName: {
      color: colors.textOnPrimary,
      fontWeight: '900',
      fontSize: 16,
      letterSpacing: 0.2,
    },

    langPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: withAlpha(colors.textOnPrimary, 0.18),
    },
    langText: { color: withAlpha(colors.textOnPrimary, 0.9), fontWeight: '800', fontSize: 13 },

    heroGreeting: {
      marginTop: 16,
      color: withAlpha(colors.textOnPrimary, 0.8),
      fontSize: 14,
      fontWeight: '800',
    },
    heroTitle: {
      marginTop: 2,
      color: colors.textOnPrimary,
      fontSize: 26,
      fontWeight: '900',
      letterSpacing: 0.2,
    },
    heroSub: {
      marginTop: 6,
      color: withAlpha(colors.textOnPrimary, 0.8),
      fontSize: 13,
      fontWeight: '600',
      lineHeight: 18,
      maxWidth: 320,
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
      backgroundColor: withAlpha(colors.primaryDark, isDark ? 0.35 : 0.25),
    },
    hill2: {
      position: 'absolute',
      left: 90,
      right: 10,
      bottom: -12,
      height: 130,
      borderTopLeftRadius: 120,
      borderTopRightRadius: 90,
      backgroundColor: withAlpha(colors.primaryDark, isDark ? 0.5 : 0.35),
    },

    contentScroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 18, paddingBottom: 30 },

    card: {
      backgroundColor: colors.surface,
      borderRadius: 22,
      padding: 18,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 1,
      shadowRadius: 18,
      elevation: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },

    sectionTitle: {
      color: colors.textMuted,
      fontWeight: '900',
      fontSize: 13,
      marginBottom: 8,
    },

    questionLabel: {
      fontSize: 13,
      fontWeight: '900',
      color: colors.textMuted,
      marginBottom: 6,
      marginTop: 4,
    },

    inputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.surface2,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: Platform.OS === 'ios' ? 14 : 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
      fontWeight: '700',
    },
    eyeBtn: {
      paddingHorizontal: 6,
      paddingVertical: 6,
      borderRadius: 10,
    },

    primaryButton: {
      borderRadius: 16,
      overflow: 'hidden',
      marginTop: 14,
    },
    primaryBtnGrad: {
      paddingVertical: 14,
      paddingHorizontal: 14,
      borderRadius: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    primaryButtonText: {
      color: colors.textOnPrimary,
      fontSize: 15,
      fontWeight: '900',
      letterSpacing: 0.2,
    },

    backWrapper: { marginTop: 16, alignItems: 'center' },
    backText: { fontSize: 14, color: colors.textMuted, fontWeight: '800' },
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
