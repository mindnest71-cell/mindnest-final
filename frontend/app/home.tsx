/**
 * home.tsx — หน้าหลัก (Home Screen)
 *
 * แก้ข้อความ → แก้ใน STRINGS.en / STRINGS.th
 *
 * AsyncStorage keys ที่โหลดตอนเปิดหน้า:
 *   'user_name'                → ชื่อที่แสดงใน greeting
 *   'emergency_contact_number' → เบอร์โทรฉุกเฉิน (ตั้งค่าใน Settings)
 *
 * Bottom Bar — tab ที่ active (สว่างเต็ม) คือ Home (home-variant icon)
 *   ต้องการเปลี่ยน icon → แก้ name="..." ใน <MaterialCommunityIcons>
 *
 * Feature cards:
 *   Mood Tracker → goMood()   → /moodtracker
 *   Journal      → goJournal()→ /journal
 *   Breathing    → goBreathing() → /breathing
 *   Emergency    → handleEmergencyCall() → Linking.openURL('tel:...')
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/context/theme-context';
import { useLanguage } from '@/context/language-context';

const STRINGS = {
  en: {
    greeting: "Good afternoon,",
    friend: "Friend",
    signOut: "Sign Out",
    signOutConfirm: "Are you sure you want to sign out?",
    cancel: "Cancel",
    howFeeling: "How are you feeling?",
    recently: "Feature",
    favorites: "More",
    express: "Express your feelings",
    resources: "Crisis Resources",
    settings: "Settings",
    moodTracker: "Mood Tracker",
    moodTrackerSub: "Log & track your daily mood",
    journal: "Journal",
    journalSub: "Write your thoughts & feelings",
    breathing: "Breathing",
    breathingSub: "Calm your mind with guided breathing",
    langLabel: "EN",
    emergencyCall: "Emergency Call",
    emergencyCallSub: "Call your emergency contact",
    emergencyNoNumber: "No emergency contact set",
    emergencyNoNumberMsg: "Please set an emergency contact number in Settings first.",
  },
  th: {
    greeting: "สวัสดีตอนบ่าย,",
    friend: "เพื่อน",
    signOut: "ออกจากระบบ",
    signOutConfirm: "คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบ?",
    cancel: "ยกเลิก",
    howFeeling: "วันนี้รู้สึกยังไงบ้าง?",
    recently: "เมนูแนะนำ",
    favorites: "เมนูเพิ่มเติม",
    express: "ระบายความในใจ",
    resources: "แหล่งช่วยเหลือฉุกเฉิน",
    settings: "การตั้งค่า",
    moodTracker: "ติดตาม Mood",
    moodTrackerSub: "บันทึกและดู mood รายวัน",
    journal: "บันทึก",
    journalSub: "เขียนความคิดและความรู้สึก",
    breathing: "หายใจผ่อนคลาย",
    breathingSub: "ผ่อนคลายกับการฝึกหายใจ",
    langLabel: "TH",
    emergencyCall: "โทรฉุกเฉิน",
    emergencyCallSub: "โทรหาผู้ติดต่อฉุกเฉินของคุณ",
    emergencyNoNumber: "ยังไม่ได้ตั้งเบอร์ฉุกเฉิน",
    emergencyNoNumberMsg: "กรุณาตั้งเบอร์ผู้ติดต่อฉุกเฉินในหน้าตั้งค่าก่อน",
  }
};

export default function Home() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [emergencyNumber, setEmergencyNumber] = useState('');
  const { lang } = useLanguage();
  const t = STRINGS[lang];
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

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const name = await AsyncStorage.getItem('user_name');
        const emergency = await AsyncStorage.getItem('emergency_contact_number');
        if (name) setUserName(name);
        if (emergency) setEmergencyNumber(emergency);
      } catch (error) {
        console.log('Error loading user data:', error);
      }
    };
    loadUserData();
  }, []);

  const handleSignOut = async () => {
    Alert.alert(
      t.signOut,
      t.signOutConfirm,
      [
        { text: t.cancel, style: "cancel" },
        {
          text: t.signOut,
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove(['user_id', 'user_name', 'user_email']);
              router.replace('/');
            } catch (error) {
              console.log('Error signing out:', error);
            }
          }
        }
      ]
    );
  };

  const goChat = () => router.push('/chat' as any);
  const goResources = () => router.push('/resources' as any);
  const goSettings = () => router.push('/settings' as any);
  const goMood = () => router.push('/moodtracker' as any);
  const goJournal = () => router.push('/journal' as any);
  const goBreathing = () => router.push('/breathing' as any);

  const handleEmergencyCall = () => {
    if (!emergencyNumber) {
      Alert.alert(t.emergencyNoNumber, t.emergencyNoNumberMsg);
      return;
    }
    Linking.openURL(`tel:${emergencyNumber}`);
  };

  const displayName = userName?.trim() ? userName : t.friend;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* HERO HEADER (เหมือนรูป) */}
          <LinearGradient
            colors={heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            {/* top row */}
            <View style={styles.heroTopRow}>
              <View style={styles.avatarWrap}>
                <Image
                  source={{ uri: 'https://i.pravatar.cc/120?img=32' }} // เปลี่ยนเป็นรูปผู้ใช้ได้ภายหลัง
                  style={styles.avatar}
                />
              </View>

              <View style={styles.heroRightBtns}>
                <TouchableOpacity onPress={handleSignOut} activeOpacity={0.8} style={styles.iconBtn}>
                  <MaterialCommunityIcons name="logout" size={20} color={withAlpha(colors.textOnPrimary, 0.9)} />
                </TouchableOpacity>
              </View>
            </View>

            {/* greeting */}
            <Text style={styles.heroGreeting}>{t.greeting}</Text>
            <Text style={styles.heroName}>{displayName}</Text>

            {/* hill overlay */}
            <View style={styles.hillLayer}>
              <View style={styles.hill1} />
              <View style={styles.hill2} />
            </View>
          </LinearGradient>

          {/* MAIN QUESTION PILL -> CHAT */}
          <TouchableOpacity onPress={goChat} activeOpacity={0.9} style={styles.feelPill}>
            <View style={styles.feelEmoji}>
              <Text style={styles.feelEmojiText}>💬</Text>
            </View>
            <Text style={styles.feelText}>{t.howFeeling}</Text>
          </TouchableOpacity>

          {/* Emergency Call Button */}
          <TouchableOpacity onPress={handleEmergencyCall} activeOpacity={0.9} style={styles.emergencyBtn}>
            <View style={styles.emergencyIconWrap}>
              <MaterialCommunityIcons name="phone-alert" size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.emergencyTitle}>{t.emergencyCall}</Text>
              <Text style={styles.emergencySub}>
                {emergencyNumber ? emergencyNumber : t.emergencyCallSub}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>

          {/* SECTION: Quick actions (การ์ด 2 ใบเหมือนรูป) */}
          <Text style={styles.sectionTitle}>{t.recently}</Text>

          {/* Mood Tracker card */}
          <TouchableOpacity onPress={goMood} activeOpacity={0.88} style={styles.journalCard}>
            <View style={[styles.journalIconWrap, { backgroundColor: 'rgba(34,197,94,0.18)' }]}>
              <MaterialCommunityIcons name="emoticon-happy-outline" size={24} color="#22C55E" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.journalCardTitle}>{t.moodTracker}</Text>
              <Text style={styles.journalCardSub}>{t.moodTrackerSub}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color="rgba(34,197,94,0.7)" />
          </TouchableOpacity>

          {/* Journal card */}
          <TouchableOpacity onPress={goJournal} activeOpacity={0.88} style={styles.journalCard}>
            <View style={[styles.journalIconWrap, { backgroundColor: 'rgba(108,99,255,0.18)' }]}>
              <MaterialCommunityIcons name="notebook-edit-outline" size={24} color="#6C63FF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.journalCardTitle}>{t.journal}</Text>
              <Text style={styles.journalCardSub}>{t.journalSub}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color="rgba(108,99,255,0.7)" />
          </TouchableOpacity>

          {/* Breathing card */}
          <TouchableOpacity onPress={goBreathing} activeOpacity={0.88} style={styles.journalCard}>
            <View style={[styles.journalIconWrap, { backgroundColor: 'rgba(6,182,212,0.18)' }]}>
              <MaterialCommunityIcons name="weather-windy" size={24} color="#06B6D4" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.journalCardTitle}>{t.breathing}</Text>
              <Text style={styles.journalCardSub}>{t.breathingSub}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color="rgba(6,182,212,0.7)" />
          </TouchableOpacity>

          {/* OPTIONAL: เมนูเพิ่มเติม (ถ้าต้องการเพิ่มภายหลัง) */}
          <Text style={[styles.sectionTitle, { marginTop: 22 }]}>{t.favorites}</Text>

          <View style={styles.smallList}>
            <TouchableOpacity onPress={goChat} activeOpacity={0.9} style={styles.smallItem}>
            <View style={[styles.smallIcon, { backgroundColor: withAlpha(colors.primary, 0.18) }]}>
              <MaterialCommunityIcons name="chat-processing" size={18} color={colors.primary} />
            </View>
            <Text style={styles.smallText}>{t.express}</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={withAlpha(colors.textMuted, 0.8)} />
          </TouchableOpacity>

          <TouchableOpacity onPress={goResources} activeOpacity={0.9} style={styles.smallItem}>
            <View style={[styles.smallIcon, { backgroundColor: withAlpha(colors.danger, 0.18) }]}>
              <MaterialCommunityIcons name="shield-alert" size={18} color={colors.danger} />
            </View>
            <Text style={styles.smallText}>{t.resources}</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={withAlpha(colors.textMuted, 0.8)} />
          </TouchableOpacity>

          <TouchableOpacity onPress={goSettings} activeOpacity={0.9} style={styles.smallItem}>
            <View style={[styles.smallIcon, { backgroundColor: withAlpha(colors.iconMuted, 0.18) }]}>
              <MaterialCommunityIcons name="cog" size={18} color={colors.iconMuted} />
            </View>
            <Text style={styles.smallText}>{t.settings}</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={withAlpha(colors.textMuted, 0.8)} />
          </TouchableOpacity>
        </View>

          <View style={{ height: 28 }} />
        </ScrollView>

        {/* Bottom Bar (ทำให้เหมือนรูป) */}
        <View style={styles.bottomBar}>
          <TouchableOpacity onPress={() => router.replace('/home' as any)} style={styles.tabBtn} activeOpacity={0.8}>
            <MaterialCommunityIcons name="home-variant" size={24} color={colors.textOnPrimary} />
          </TouchableOpacity>

          <TouchableOpacity onPress={goChat} style={styles.tabBtn} activeOpacity={0.8}>
            <MaterialCommunityIcons name="chat-processing" size={24} color={withAlpha(colors.textOnPrimary, 0.65)} />
          </TouchableOpacity>

          <TouchableOpacity onPress={goResources} style={styles.tabBtn} activeOpacity={0.8}>
            <MaterialCommunityIcons name="phone" size={24} color={withAlpha(colors.textOnPrimary, 0.65)} />
          </TouchableOpacity>

          <TouchableOpacity onPress={goSettings} style={styles.tabBtn} activeOpacity={0.8}>
            <MaterialCommunityIcons name="cog" size={24} color={withAlpha(colors.textOnPrimary, 0.65)} />
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

type ThemeColors = ReturnType<typeof useTheme>['colors'];

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1, backgroundColor: colors.background },

    scrollContent: {
      padding: 18,
      paddingBottom: 90,
    },

    hero: {
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

    avatarWrap: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: withAlpha(colors.textOnPrimary, 0.22),
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
    },

    heroRightBtns: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
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
    langText: {
      color: withAlpha(colors.textOnPrimary, 0.9),
      fontWeight: '700',
      fontSize: 13,
    },

    iconBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: withAlpha(colors.textOnPrimary, 0.18),
      justifyContent: 'center',
      alignItems: 'center',
    },

    heroGreeting: {
      marginTop: 14,
      color: withAlpha(colors.textOnPrimary, 0.75),
      fontSize: 16,
      fontWeight: '500',
    },
    heroName: {
      marginTop: 2,
      color: colors.textOnPrimary,
      fontSize: 34,
      fontWeight: '800',
      letterSpacing: 0.2,
    },

    hillLayer: {
      position: 'absolute',
      left: -20,
      right: -20,
      bottom: -30,
      height: 140,
    },
    hill1: {
      position: 'absolute',
      left: 20,
      right: 120,
      bottom: 0,
      height: 110,
      borderTopLeftRadius: 90,
      borderTopRightRadius: 120,
      backgroundColor: withAlpha(colors.primaryDark, isDark ? 0.38 : 0.26),
    },
    hill2: {
      position: 'absolute',
      left: 90,
      right: 10,
      bottom: -10,
      height: 120,
      borderTopLeftRadius: 120,
      borderTopRightRadius: 90,
      backgroundColor: withAlpha(colors.primaryDark, isDark ? 0.5 : 0.34),
    },

    feelPill: {
      marginTop: 14,
      backgroundColor: colors.surface,
      borderRadius: 18,
      paddingVertical: 18,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      shadowColor: colors.shadow,
      shadowOpacity: 1,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 6,
    },
    feelEmoji: {
      width: 38,
      height: 38,
      borderRadius: 14,
      backgroundColor: colors.primarySoft,
      justifyContent: 'center',
      alignItems: 'center',
    },
    feelEmojiText: { fontSize: 18 },
    feelText: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '700',
    },

    sectionTitle: {
      marginTop: 22,
      marginBottom: 12,
      color: colors.textMuted,
      fontSize: 16,
      fontWeight: '600',
    },

    cardRow: {
      flexDirection: 'row',
      gap: 14,
    },
    bigCard: {
      flex: 1,
      borderRadius: 22,
      overflow: 'hidden',
      backgroundColor: withAlpha(colors.surface, 0.5),
    },
    bigCardImg: {
      height: 190,
      padding: 14,
      justifyContent: 'space-between',
    },
    bigCardImgRadius: { borderRadius: 22 },

    cardChip: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: 'rgba(0,0,0,0.35)',
    },
    cardChipText: {
      color: colors.textOnPrimary,
      fontSize: 12,
      fontWeight: '700',
    },

    cardBottom: {
      backgroundColor: 'rgba(0,0,0,0.28)',
      borderRadius: 16,
      padding: 12,
    },
    cardTitle: {
      color: colors.textOnPrimary,
      fontSize: 16,
      fontWeight: '800',
    },
    cardSub: {
      marginTop: 4,
      color: withAlpha(colors.textOnPrimary, 0.78),
      fontSize: 12,
      fontWeight: '600',
    },

    smallList: {
      gap: 10,
    },
    smallItem: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      paddingVertical: 14,
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    smallIcon: {
      width: 36,
      height: 36,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    smallText: {
      flex: 1,
      color: colors.text,
      fontSize: 15,
      fontWeight: '700',
    },

    emergencyBtn: {
      marginTop: 14,
      backgroundColor: '#D7263D',
      borderRadius: 18,
      paddingVertical: 16,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      shadowColor: '#D7263D',
      shadowOpacity: 0.45,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
    },
    emergencyIconWrap: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: 'rgba(255,255,255,0.22)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    emergencyTitle: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '800',
    },
    emergencySub: {
      color: 'rgba(255,255,255,0.78)',
      fontSize: 13,
      fontWeight: '600',
      marginTop: 2,
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

    journalCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 16,
      marginTop: 12,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOpacity: 1,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 3,
    },
    journalIconWrap: {
      width: 48,
      height: 48,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    journalCardTitle: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '800',
    },
    journalCardSub: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '500',
      marginTop: 2,
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
