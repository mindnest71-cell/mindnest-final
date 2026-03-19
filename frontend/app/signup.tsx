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
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../utils/api';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../context/theme-context';

const STRINGS = {
  en: {
    title: 'Create Account',
    step1: 'Personal Info',
    step2: 'Account Details',
    step3: 'Security',
    firstName: 'First name',
    lastName: 'Last name',
    email: 'Email',
    password: 'Password',
    confirm: 'Confirm password',
    next: 'Next',
    back: 'Back',
    signup: 'Complete Setup',
    signingUp: 'Creating Account...',
    haveAccount: 'Already have an account?',
    login: 'Log in',
    fillAll: 'Please fill in all fields.',
    pwNotMatch: 'Passwords do not match.',
    pwShort: 'Password must be at least 6 characters.',
    errorTitle: 'Error',
    errorSignup: 'Sign up failed.',
    langLabel: 'TH / EN',
    q1Label: 'Security Question 1',
    a1Label: 'Answer 1',
    q2Label: 'Security Question 2',
    a2Label: 'Answer 2',
    selectQuestion: 'Select a Question',
    welcome: 'Welcome to MindNest,',
    subtitle: 'Let’s set up your account.',
    cancel: 'Cancel',
    missingInfo: 'Missing Info',
  },
  th: {
    title: 'สร้างบัญชี',
    step1: 'ข้อมูลส่วนตัว',
    step2: 'ข้อมูลบัญชี',
    step3: 'ความปลอดภัย',
    firstName: 'ชื่อ',
    lastName: 'นามสกุล',
    email: 'อีเมล',
    password: 'รหัสผ่าน',
    confirm: 'ยืนยันรหัสผ่าน',
    next: 'ถัดไป',
    back: 'ย้อนกลับ',
    signup: 'เสร็จสิ้น',
    signingUp: 'กำลังสร้างบัญชี...',
    haveAccount: 'มีบัญชีอยู่แล้ว?',
    login: 'เข้าสู่ระบบ',
    fillAll: 'กรุณากรอกข้อมูลให้ครบถ้วน',
    pwNotMatch: 'รหัสผ่านไม่ตรงกัน',
    pwShort: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร',
    errorTitle: 'เกิดข้อผิดพลาด',
    errorSignup: 'สมัครสมาชิกไม่สำเร็จ',
    langLabel: 'TH / EN',
    q1Label: 'คำถามความปลอดภัย 1',
    a1Label: 'คำตอบ 1',
    q2Label: 'คำถามความปลอดภัย 2',
    a2Label: 'คำตอบ 2',
    selectQuestion: 'เลือกคำถาม',
    welcome: 'ยินดีต้อนรับสู่ MindNest,',
    subtitle: 'มาเริ่มตั้งค่าบัญชีของคุณกัน',
    cancel: 'ยกเลิก',
    missingInfo: 'ข้อมูลไม่ครบ',
  },
};

const QUESTIONS = [
  "What is your mother's maiden name?",
  "What was the name of your first pet?",
  "What was the name of your first school?",
  "What is your favorite food?",
  "What city were you born in?",
];

export default function SignupScreen() {
  const router = useRouter();
  const [lang, setLang] = useState<'en' | 'th'>('en');
  const t = STRINGS[lang];

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form Data
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [secure1, setSecure1] = useState(true);
  const [secure2, setSecure2] = useState(true);

  // Security Questions
  const [q1, setQ1] = useState('');
  const [a1, setA1] = useState('');
  const [q2, setQ2] = useState('');
  const [a2, setA2] = useState('');
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

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [activeQField, setActiveQField] = useState<1 | 2 | null>(null);

  const toggleLang = () => setLang((p) => (p === 'en' ? 'th' : 'en'));

  const handleNext = () => {
    if (step === 1) {
      if (!firstName.trim() || !lastName.trim()) {
        Alert.alert(t.missingInfo, t.fillAll);
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!email.trim() || !password || !confirm) {
        Alert.alert(t.missingInfo, t.fillAll);
        return;
      }
      if (password !== confirm) {
        Alert.alert(t.errorTitle, t.pwNotMatch);
        return;
      }
      if (password.length < 6) {
        Alert.alert(t.errorTitle, t.pwShort);
        return;
      }
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSignup = async () => {
    if (!q1 || !a1 || !q2 || !a2) {
      Alert.alert(t.missingInfo, t.fillAll);
      return;
    }

    try {
      setLoading(true);
      await api.post('/auth/register', {
        name: `${firstName.trim()} ${lastName.trim()}`,
        email,
        password,
        security_question_1: q1,
        security_answer_1: a1,
        security_question_2: q2,
        security_answer_2: a2,
      });

      Alert.alert('✅', lang === 'en' ? 'Welcome to MindNest!' : 'ยินดีต้อนรับสู่ MindNest!');
      router.replace('/login');

    } catch (e: any) {
      console.log(e?.response || e);
      const msg = e?.response?.data?.detail || t.errorSignup;
      Alert.alert(t.errorTitle, msg);
    } finally {
      setLoading(false);
    }
  };

  const openPicker = (field: 1 | 2) => {
    setActiveQField(field);
    setShowModal(true);
  };

  const selectQuestion = (q: string) => {
    if (activeQField === 1) setQ1(q);
    if (activeQField === 2) setQ2(q);
    setShowModal(false);
    setActiveQField(null);
  };

  // Step indicator dots (ธีมใหม่)
  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={[styles.progressDot, step >= 1 && styles.activeDot]} />
      <View style={[styles.progressLine, step >= 2 && styles.activeLine]} />
      <View style={[styles.progressDot, step >= 2 && styles.activeDot]} />
      <View style={[styles.progressLine, step >= 3 && styles.activeLine]} />
      <View style={[styles.progressDot, step >= 3 && styles.activeDot]} />
    </View>
  );

  const stepLabel = step === 1 ? t.step1 : step === 2 ? t.step2 : t.step3;

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* ✅ เปลี่ยนจาก View -> ScrollView เพื่อจัดกลางทั้งหน้า */}
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.centerContent}   // ✅ จุดสำคัญ
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* HERO HEADER (โทนเดียวกับรูป) */}
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
                <Text style={styles.brandName}>MindNest</Text>
              </View>

              <TouchableOpacity onPress={toggleLang} activeOpacity={0.85} style={styles.langPill}>
                <Text style={styles.langText}>{lang === 'en' ? 'TH' : 'EN'}</Text>
                <MaterialCommunityIcons name="translate" size={18} color={withAlpha(colors.textOnPrimary, 0.9)} />
              </TouchableOpacity>
            </View>

            <Text style={styles.heroGreeting}>{t.welcome}</Text>
            <Text style={styles.heroTitle}>{stepLabel}</Text>
            <Text style={styles.heroSub}>{t.subtitle}</Text>

            <View style={{ marginTop: 14 }}>
              {renderProgressBar()}
            </View>

            {/* hill overlay */}
            <View style={styles.hillLayer}>
              <View style={styles.hill1} />
              <View style={styles.hill2} />
            </View>
          </LinearGradient>

          {/* CONTENT */}
          <View style={styles.card}>
            {/* STEP 1 */}
            {step === 1 && (
              <View style={styles.formSection}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t.firstName}</Text>
                  <View style={styles.inputWrap}>
                    <MaterialCommunityIcons name="account-outline" size={20} color={colors.iconMuted} />
                    <TextInput
                      placeholder={lang === 'en' ? 'Ex. John' : 'เช่น สมชาย'}
                      placeholderTextColor={colors.textMuted}
                      style={styles.input}
                      value={firstName}
                      onChangeText={setFirstName}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t.lastName}</Text>
                  <View style={styles.inputWrap}>
                    <MaterialCommunityIcons name="account-outline" size={20} color={colors.iconMuted} />
                    <TextInput
                      placeholder={lang === 'en' ? 'Ex. Doe' : 'เช่น ใจดี'}
                      placeholderTextColor={colors.textMuted}
                      style={styles.input}
                      value={lastName}
                      onChangeText={setLastName}
                    />
                  </View>
                </View>
              </View>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <View style={styles.formSection}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t.email}</Text>
                  <View style={styles.inputWrap}>
                    <MaterialCommunityIcons name="email-outline" size={20} color={colors.iconMuted} />
                    <TextInput
                      placeholder="john@example.com"
                      placeholderTextColor={colors.textMuted}
                      style={styles.input}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t.password}</Text>
                  <View style={styles.inputWrap}>
                    <MaterialCommunityIcons name="lock-outline" size={20} color={colors.iconMuted} />
                    <TextInput
                      placeholder="******"
                      placeholderTextColor={colors.textMuted}
                      style={styles.input}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={secure1}
                    />
                    <TouchableOpacity onPress={() => setSecure1(!secure1)} style={styles.eyeBtn}>
                      <MaterialCommunityIcons
                        name={secure1 ? "eye-outline" : "eye-off-outline"}
                        size={20}
                        color={withAlpha(colors.textMuted, 0.9)}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t.confirm}</Text>
                  <View style={styles.inputWrap}>
                    <MaterialCommunityIcons name="lock-check-outline" size={20} color={colors.iconMuted} />
                    <TextInput
                      placeholder="******"
                      placeholderTextColor={colors.textMuted}
                      style={styles.input}
                      value={confirm}
                      onChangeText={setConfirm}
                      secureTextEntry={secure2}
                    />
                    <TouchableOpacity onPress={() => setSecure2(!secure2)} style={styles.eyeBtn}>
                      <MaterialCommunityIcons
                        name={secure2 ? "eye-outline" : "eye-off-outline"}
                        size={20}
                        color={withAlpha(colors.textMuted, 0.9)}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <View style={styles.formSection}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t.q1Label}</Text>
                  <TouchableOpacity style={styles.selectInput} onPress={() => openPicker(1)} activeOpacity={0.9}>
                    <Text style={{ color: q1 ? colors.text : colors.textMuted, fontWeight: '700' }}>
                      {q1 || t.selectQuestion}
                    </Text>
                    <MaterialCommunityIcons name="chevron-down" size={20} color={withAlpha(colors.textMuted, 0.8)} />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t.a1Label}</Text>
                  <View style={styles.inputWrap}>
                    <MaterialCommunityIcons name="form-textbox" size={20} color={colors.iconMuted} />
                    <TextInput
                      placeholder={lang === 'en' ? 'Answer...' : 'คำตอบ...'}
                      placeholderTextColor={colors.textMuted}
                      style={styles.input}
                      value={a1}
                      onChangeText={setA1}
                    />
                  </View>
                </View>

                <View style={{ height: 16 }} />

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t.q2Label}</Text>
                  <TouchableOpacity style={styles.selectInput} onPress={() => openPicker(2)} activeOpacity={0.9}>
                    <Text style={{ color: q2 ? colors.text : colors.textMuted, fontWeight: '700' }}>
                      {q2 || t.selectQuestion}
                    </Text>
                    <MaterialCommunityIcons name="chevron-down" size={20} color={withAlpha(colors.textMuted, 0.8)} />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t.a2Label}</Text>
                  <View style={styles.inputWrap}>
                    <MaterialCommunityIcons name="form-textbox" size={20} color={colors.iconMuted} />
                    <TextInput
                      placeholder={lang === 'en' ? 'Answer...' : 'คำตอบ...'}
                      placeholderTextColor={colors.textMuted}
                      style={styles.input}
                      value={a2}
                      onChangeText={setA2}
                    />
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Footer actions (เหมือนเดิม แต่โทนใหม่) */}
          <View style={styles.footerSection}>
            <View style={styles.btnRow}>
              {step > 1 ? (
                <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.85}>
                  <Text style={styles.backButtonText}>{t.back}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={toggleLang} style={styles.langButton} activeOpacity={0.85}>
                  <Text style={styles.langButtonText}>{lang === 'en' ? 'TH' : 'EN'}</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.nextButton, loading && { opacity: 0.7 }]}
                onPress={step === 3 ? handleSignup : handleNext}
                disabled={loading}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={[colors.primaryDark, colors.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.nextBtnGrad}
                >
                  <Text style={styles.nextButtonText}>
                    {loading ? t.signingUp : (step === 3 ? t.signup : t.next)}
                  </Text>
                  {!loading && step < 3 && (
                    <MaterialCommunityIcons name="arrow-right" size={20} color={colors.textOnPrimary} />
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={styles.loginRow}>
              <Text style={styles.helperText}>{t.haveAccount} </Text>
              <TouchableOpacity onPress={() => router.replace('/login')} activeOpacity={0.85}>
                <Text style={styles.helperLink}>{t.login}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ height: 26 }} />

          {/* Modal (ธีมใหม่) */}
          {showModal && (
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{t.selectQuestion}</Text>

                <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
                  {QUESTIONS.map((q, i) => {
                    if (activeQField === 1 && q === q2) return null;
                    if (activeQField === 2 && q === q1) return null;
                    return (
                      <TouchableOpacity key={i} style={styles.modalItem} onPress={() => selectQuestion(q)} activeOpacity={0.9}>
                        <Text style={styles.modalItemText}>{q}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <TouchableOpacity style={styles.modalClose} onPress={() => setShowModal(false)} activeOpacity={0.85}>
                  <Text style={styles.modalCloseText}>{t.cancel}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type ThemeColors = ReturnType<typeof useTheme>['colors'];

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1, backgroundColor: colors.background },
    centerContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingVertical: 18,
    },

    hero: {
      margin: 18,
      borderRadius: 28,
      padding: 18,
      paddingBottom: 24,
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
      color: withAlpha(colors.textOnPrimary, 0.75),
      fontSize: 15,
      fontWeight: '600',
    },
    heroTitle: {
      marginTop: 2,
      color: colors.textOnPrimary,
      fontSize: 28,
      fontWeight: '900',
      letterSpacing: 0.2,
    },
    heroSub: {
      marginTop: 6,
      color: withAlpha(colors.textOnPrimary, 0.8),
      fontSize: 13,
      fontWeight: '600',
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

    progressContainer: { flexDirection: 'row', alignItems: 'center' },
    progressDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: withAlpha(colors.textOnPrimary, 0.25),
    },
    activeDot: {
      backgroundColor: colors.textOnPrimary,
      transform: [{ scale: 1.2 }],
    },
    progressLine: {
      width: 42,
      height: 2,
      backgroundColor: withAlpha(colors.textOnPrimary, 0.2),
      marginHorizontal: 6,
    },
    activeLine: {
      backgroundColor: withAlpha(colors.textOnPrimary, 0.6),
    },

    card: {
      backgroundColor: colors.surface,
      borderRadius: 22,
      padding: 18,
      marginHorizontal: 18,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 1,
      shadowRadius: 18,
      elevation: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },

    formSection: { gap: 14 },
    inputGroup: { gap: 8 },

    label: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.textMuted,
      marginLeft: 4,
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

    selectInput: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.surface2,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },

    footerSection: {
      marginTop: 16,
      paddingHorizontal: 18,
    },

    btnRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
    },

    backButton: {
      paddingVertical: 14,
      paddingHorizontal: 14,
      borderRadius: 14,
      backgroundColor: colors.surface2,
    },
    backButtonText: {
      fontSize: 15,
      fontWeight: '900',
      color: colors.textMuted,
    },

    langButton: {
      paddingVertical: 14,
      paddingHorizontal: 14,
      borderRadius: 14,
      backgroundColor: colors.surface2,
    },
    langButtonText: {
      fontSize: 13,
      fontWeight: '900',
      color: colors.textMuted,
    },

    nextButton: {
      flex: 1,
      borderRadius: 16,
      overflow: 'hidden',
    },
    nextBtnGrad: {
      paddingVertical: 14,
      paddingHorizontal: 14,
      borderRadius: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    nextButtonText: {
      color: colors.textOnPrimary,
      fontSize: 15,
      fontWeight: '900',
      letterSpacing: 0.2,
    },

    loginRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 16,
    },
    helperText: { color: colors.textMuted, fontWeight: '700' },
    helperLink: { color: colors.primary, fontWeight: '900', textDecorationLine: 'underline' },

    modalOverlay: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      paddingHorizontal: 18,
    },
    modalContent: {
      width: '100%',
      maxWidth: 420,
      backgroundColor: colors.surface,
      borderRadius: 22,
      padding: 18,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 1,
      shadowRadius: 20,
      elevation: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: '900',
      color: colors.text,
      marginBottom: 12,
      textAlign: 'center',
    },
    modalItem: {
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    modalItemText: {
      fontSize: 14,
      color: colors.textMuted,
      fontWeight: '700',
    },
    modalClose: {
      marginTop: 14,
      alignItems: 'center',
      paddingVertical: 10,
      borderRadius: 14,
      backgroundColor: withAlpha(colors.danger, 0.15),
    },
    modalCloseText: { color: colors.danger, fontWeight: '900' },
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
