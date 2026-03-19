import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import api from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '../context/theme-context';

const STRINGS = {
  en: {
    email: 'Email',
    password: 'Password',
    login: 'Log in',
    loggingIn: 'Logging in...',
    forgot: 'Forgot password?',
    signup: 'Sign up',
    langLabel: 'TH / EN',
    fillBoth: 'Please fill in both email and password.',
    loginFailed: 'Login failed. Please try again.',
    welcomeBack: 'Welcome back,',
    subtitle: 'Let’s take care of your mind today.',
  },
  th: {
    email: 'อีเมล',
    password: 'รหัสผ่าน',
    login: 'เข้าสู่ระบบ',
    loggingIn: 'กำลังเข้าสู่ระบบ...',
    forgot: 'ลืมรหัสผ่าน?',
    signup: 'สมัครสมาชิก',
    langLabel: 'TH / EN',
    fillBoth: 'กรุณากรอกอีเมลและรหัสผ่าน',
    loginFailed: 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง',
    welcomeBack: 'ยินดีต้อนรับกลับ,',
    subtitle: 'วันนี้มาดูแลใจตัวเองกันนะ',
  },
};

export default function LoginScreen() {
  const router = useRouter();
  const [lang, setLang] = useState<'en' | 'th'>('en');
  const t = STRINGS[lang];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);
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

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert(t.fillBoth);
      return;
    }

    try {
      setLoading(true);

      const res = await api.post('/auth/login', { email, password });

      if (res.data.user_id) {
        await AsyncStorage.setItem('user_id', res.data.user_id);
        if (res.data.name) await AsyncStorage.setItem('user_name', res.data.name);
        router.replace('/home');
      } else {
        Alert.alert('Error', 'No user ID received');
      }
    } catch (e: any) {
      console.log(e?.response || e);
      const msg = e?.response?.data?.detail || e?.message || t.loginFailed;
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.root}>

          {/* HERO (เหมือนรูป: gradient + ภูเขา) */}
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
                    style={styles.logo}
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

            <Text style={styles.heroGreeting}>{t.welcomeBack}</Text>
            <Text style={styles.heroTitle}>{lang === 'en' ? 'Sign in' : 'เข้าสู่ระบบ'}</Text>
            <Text style={styles.heroSub}>{t.subtitle}</Text>

            {/* hill overlay */}
            <View style={styles.hillLayer}>
              <View style={styles.hill1} />
              <View style={styles.hill2} />
            </View>
          </LinearGradient>

          {/* FORM CARD */}
          <View style={styles.formArea}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{lang === 'en' ? 'Account' : 'บัญชีผู้ใช้'}</Text>

              <View style={styles.inputWrap}>
                <MaterialCommunityIcons name="email-outline" size={20} color={colors.iconMuted} />
                <TextInput
                  style={styles.input}
                  placeholder={t.email}
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputWrap}>
                <MaterialCommunityIcons name="lock-outline" size={20} color={colors.iconMuted} />
                <TextInput
                  style={styles.input}
                  placeholder={t.password}
                  placeholderTextColor={colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={secure}
                />

                <TouchableOpacity
                  onPress={() => setSecure((s) => !s)}
                  activeOpacity={0.8}
                  style={styles.eyeBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialCommunityIcons
                    name={secure ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color={withAlpha(colors.textMuted, 0.9)}
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.loginBtn, loading && { opacity: 0.7 }]}
                activeOpacity={0.9}
                onPress={handleLogin}
                disabled={loading}
              >
                <LinearGradient
                  colors={[colors.primaryDark, colors.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.loginBtnGrad}
                >
                  <Text style={styles.loginBtnText}>{loading ? t.loggingIn : t.login}</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.forgotRow}
                onPress={() => router.push('/forgot-password')}
                activeOpacity={0.8}
              >
                <Text style={styles.forgotText}>{t.forgot}</Text>
              </TouchableOpacity>
            </View>

            {/* FOOTER LINKS */}
          <View style={styles.footer}>
            <Text style={styles.footerHint}>
              {lang === 'en' ? "Don't have an account?" : 'ยังไม่มีบัญชีใช่ไหม?'}
            </Text>

              <TouchableOpacity onPress={() => router.push('/signup')} activeOpacity={0.85}>
                <Text style={styles.footerLink}>{t.signup}</Text>
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type ThemeColors = ReturnType<typeof useTheme>['colors'];

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    root: { flex: 1, backgroundColor: colors.background },

    hero: {
      margin: 18,
      borderRadius: 28,
      padding: 18,
      paddingBottom: 26,
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
    logo: { width: 28, height: 28 },
    brandName: {
      color: colors.textOnPrimary,
      fontWeight: '800',
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
      fontSize: 34,
      fontWeight: '900',
      letterSpacing: 0.2,
    },
    heroSub: {
      marginTop: 6,
      color: withAlpha(colors.textOnPrimary, 0.8),
      fontSize: 14,
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

    formArea: {
      flex: 1,
      paddingHorizontal: 18,
      paddingTop: 6,
      justifyContent: 'center',
    },

    card: {
      backgroundColor: colors.surface,
      borderRadius: 22,
      padding: 18,
      shadowColor: colors.shadow,
      shadowOpacity: 1,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },

    cardTitle: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: '700',
      marginBottom: 12,
    },

    inputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.surface2,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: Platform.OS === 'ios' ? 14 : 10,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },

    input: {
      flex: 1,
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
    },

    eyeBtn: {
      paddingHorizontal: 6,
      paddingVertical: 6,
      borderRadius: 10,
    },

    loginBtn: {
      borderRadius: 16,
      overflow: 'hidden',
      marginTop: 8,
    },
    loginBtnGrad: {
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loginBtnText: {
      color: colors.textOnPrimary,
      fontSize: 16,
      fontWeight: '900',
      letterSpacing: 0.2,
    },

    forgotRow: {
      marginTop: 14,
      alignItems: 'center',
    },
    forgotText: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: '700',
    },

    footer: {
      marginTop: 18,
      alignItems: 'center',
      gap: 8,
    },
    footerHint: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '600',
    },
    footerLink: {
      color: colors.primary,
      fontSize: 15,
      fontWeight: '900',
      textDecorationLine: 'underline',
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
