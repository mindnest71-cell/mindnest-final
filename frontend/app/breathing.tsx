/**
 * breathing.tsx — หน้าฝึกหายใจ (Breathing Exercises)
 *
 * เทคนิคที่มี (แก้ได้ใน TECHNIQUES object บรรทัด ~29):
 *   '478' → 4-7-8 Breathing: หายใจเข้า 4วิ / กลั้น 7วิ / หายใจออก 8วิ
 *   'box' → Box Breathing:   หายใจเข้า 4วิ / กลั้น 4วิ / หายใจออก 4วิ / พัก 4วิ
 *
 * ต้องการเพิ่มเทคนิคใหม่:
 *   1. เพิ่ม key ใน TechKey type
 *   2. เพิ่ม object ใน TECHNIQUES
 *   3. เพิ่มปุ่มใน tabs section (บรรทัด ~188)
 *
 * แก้ข้อความ → แก้ใน STRINGS.en / STRINGS.th (บรรทัด ~59)
 * แก้สีวงกลม → แก้ color ใน phases[] ของแต่ละเทคนิค
 * แก้ขนาดวงกลม → แก้ CIRCLE_SIZE (บรรทัด ~78)
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '@/context/theme-context';
import { useLanguage } from '@/context/language-context';

// ─── Types & Constants ────────────────────────────────────────────────────────

type TechKey = '478' | 'box';

interface Phase {
  labelEn: string;
  labelTh: string;
  duration: number;
  scale: number;
  color: string;
}

const TECHNIQUES: Record<TechKey, {
  nameEn: string; nameTh: string;
  descEn: string; descTh: string;
  phases: Phase[];
}> = {
  '478': {
    nameEn: '4-7-8',
    nameTh: '4-7-8',
    descEn: 'Inhale 4s · Hold 7s · Exhale 8s\nHelps reduce anxiety & improve sleep',
    descTh: 'หายใจเข้า 4วิ · กลั้น 7วิ · หายใจออก 8วิ\nช่วยลดความวิตกกังวลและนอนหลับดีขึ้น',
    phases: [
      { labelEn: 'Inhale',  labelTh: 'หายใจเข้า',  duration: 4, scale: 1.45, color: '#6C63FF' },
      { labelEn: 'Hold',    labelTh: 'กลั้นหายใจ', duration: 7, scale: 1.45, color: '#F59E0B' },
      { labelEn: 'Exhale',  labelTh: 'หายใจออก',   duration: 8, scale: 1.0,  color: '#22C55E' },
    ],
  },
  box: {
    nameEn: 'Box',
    nameTh: 'Box',
    descEn: 'Inhale 4s · Hold 4s · Exhale 4s · Hold 4s\nBuilds focus and inner calm',
    descTh: 'หายใจเข้า 4วิ · กลั้น 4วิ · หายใจออก 4วิ · พัก 4วิ\nช่วยสร้างสมาธิและความสงบ',
    phases: [
      { labelEn: 'Inhale',  labelTh: 'หายใจเข้า',  duration: 4, scale: 1.45, color: '#6C63FF' },
      { labelEn: 'Hold',    labelTh: 'กลั้นหายใจ', duration: 4, scale: 1.45, color: '#F59E0B' },
      { labelEn: 'Exhale',  labelTh: 'หายใจออก',   duration: 4, scale: 1.0,  color: '#22C55E' },
      { labelEn: 'Hold',    labelTh: 'พักหายใจ',   duration: 4, scale: 1.0,  color: '#64748B' },
    ],
  },
};

const STRINGS = {
  en: {
    title: 'Breathing',
    start: 'Start',
    stop: 'Stop',
    round: 'Round',
    ready: 'Ready',
    tapToStart: 'Tap Start to begin',
  },
  th: {
    title: 'หายใจผ่อนคลาย',
    start: 'เริ่ม',
    stop: 'หยุด',
    round: 'รอบที่',
    ready: 'พร้อม',
    tapToStart: 'กด เริ่ม เพื่อเริ่มต้น',
  },
};

const CIRCLE_SIZE = 180;

// ─── Component ───────────────────────────────────────────────────────────────

export default function Breathing() {
  const router = useRouter();
  const { colors, colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const { lang } = useLanguage();
  const t = STRINGS[lang];
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const [techKey, setTechKey] = useState<TechKey>('478');
  const [isRunning, setIsRunning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [round, setRound] = useState(1);

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const phases = TECHNIQUES[techKey].phases;
  const tech = TECHNIQUES[techKey];
  const currentPhase = phases[phaseIdx];

  // Drive animation + countdown for each phase
  useEffect(() => {
    if (!isRunning) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }).start();
      return;
    }

    const phase = currentPhase;
    const ms = phase.duration * 1000;

    // Animate circle
    Animated.timing(scaleAnim, {
      toValue: phase.scale,
      duration: ms,
      easing: phase.scale > 1 ? Easing.out(Easing.sin) : Easing.in(Easing.sin),
      useNativeDriver: true,
    }).start();

    // Countdown tick
    setCountdown(phase.duration);
    const interval = setInterval(() => {
      setCountdown(c => Math.max(0, c - 1));
    }, 1000);

    // Advance phase
    const timeout = setTimeout(() => {
      setPhaseIdx(prev => {
        const next = (prev + 1) % phases.length;
        if (next === 0) setRound(r => r + 1);
        return next;
      });
    }, ms);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      scaleAnim.stopAnimation();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, phaseIdx, phases]);

  const handleStart = () => {
    setPhaseIdx(0);
    setRound(1);
    setCountdown(0);
    setIsRunning(true);
  };

  const handleStop = () => {
    setIsRunning(false);
    setPhaseIdx(0);
    setRound(1);
    setCountdown(0);
  };

  const handleTechChange = (key: TechKey) => {
    if (isRunning) handleStop();
    setTechKey(key);
  };

  const phaseColor = isRunning ? currentPhase.color : colors.primary;
  const phaseLabel = isRunning
    ? (lang === 'th' ? currentPhase.labelTh : currentPhase.labelEn)
    : t.ready;

  const maxDuration = Math.max(...phases.map(p => p.duration));

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

      <View style={styles.content}>

        {/* Technique Tabs */}
        <View style={styles.tabs}>
          {(['478', 'box'] as TechKey[]).map(key => (
            <TouchableOpacity
              key={key}
              onPress={() => handleTechChange(key)}
              style={[styles.tab, techKey === key && { backgroundColor: colors.primary }]}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, techKey === key && styles.tabTextActive]}>
                {lang === 'th' ? TECHNIQUES[key].nameTh : TECHNIQUES[key].nameEn}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Description */}
        <Text style={styles.desc}>
          {lang === 'th' ? tech.descTh : tech.descEn}
        </Text>

        {/* Animated Circle */}
        <View style={styles.circleWrap}>
          {/* Outer glow ring */}
          <Animated.View
            style={[
              styles.outerRing,
              { borderColor: phaseColor, transform: [{ scale: scaleAnim }] },
            ]}
          />
          {/* Main circle */}
          <Animated.View
            style={[
              styles.circle,
              { backgroundColor: phaseColor, transform: [{ scale: scaleAnim }] },
            ]}
          >
            {isRunning ? (
              <>
                <Text style={styles.countdownNum}>{countdown}</Text>
                <Text style={styles.circleLabel}>{phaseLabel}</Text>
              </>
            ) : (
              <>
                <MaterialCommunityIcons name="weather-windy" size={38} color="#fff" style={{ marginBottom: 6 }} />
                <Text style={styles.circleLabel}>{t.ready}</Text>
                <Text style={styles.circleSub}>{t.tapToStart}</Text>
              </>
            )}
          </Animated.View>
        </View>

        {/* Round counter */}
        <View style={styles.roundRow}>
          {isRunning && (
            <Text style={styles.roundText}>{t.round} {round}</Text>
          )}
        </View>

        {/* Phase dots */}
        <View style={styles.phaseDots}>
          {phases.map((p, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  width: isRunning && i === phaseIdx ? 20 : 8,
                  backgroundColor: isRunning && i === phaseIdx ? p.color : colors.border,
                },
              ]}
            />
          ))}
        </View>

        {/* Phase guide bars */}
        <View style={styles.phaseGuide}>
          {phases.map((p, i) => {
            const isActive = isRunning && i === phaseIdx;
            const barH = Math.round((p.duration / maxDuration) * 48) + 8;
            return (
              <View
                key={i}
                style={[
                  styles.phaseGuideItem,
                  isActive && { backgroundColor: `${p.color}18`, borderRadius: 12 },
                ]}
              >
                <View style={styles.phaseGuideBarWrap}>
                  <View
                    style={[
                      styles.phaseBar,
                      { height: barH, backgroundColor: isActive ? p.color : `${p.color}55` },
                    ]}
                  />
                </View>
                <Text style={[styles.phaseGuideName, { color: isActive ? p.color : colors.textMuted }]}>
                  {lang === 'th' ? p.labelTh : p.labelEn}
                </Text>
                <Text style={[styles.phaseGuideSec, { color: isActive ? p.color : colors.textMuted }]}>
                  {p.duration}s
                </Text>
              </View>
            );
          })}
        </View>

        {/* Start / Stop button */}
        <TouchableOpacity
          onPress={isRunning ? handleStop : handleStart}
          style={[styles.mainBtn, { backgroundColor: isRunning ? '#EF4444' : colors.primary }]}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons
            name={isRunning ? 'stop-circle-outline' : 'play-circle-outline'}
            size={24}
            color="#fff"
          />
          <Text style={styles.mainBtnText}>
            {isRunning ? t.stop : t.start}
          </Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

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
      width: 40, height: 40,
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
      flex: 1,
      paddingHorizontal: 24,
      paddingTop: 20,
      alignItems: 'center',
    },

    // Tabs
    tabs: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 4,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 14,
    },
    tab: {
      paddingHorizontal: 32,
      paddingVertical: 10,
      borderRadius: 13,
    },
    tabText: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: '700',
    },
    tabTextActive: {
      color: '#fff',
    },

    // Description
    desc: {
      color: colors.textMuted,
      fontSize: 13,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 20,
    },

    // Circle
    circleWrap: {
      width: CIRCLE_SIZE * 1.8,
      height: CIRCLE_SIZE * 1.8,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    outerRing: {
      position: 'absolute',
      width: CIRCLE_SIZE + 44,
      height: CIRCLE_SIZE + 44,
      borderRadius: (CIRCLE_SIZE + 44) / 2,
      borderWidth: 1.5,
      opacity: 0.28,
    },
    circle: {
      width: CIRCLE_SIZE,
      height: CIRCLE_SIZE,
      borderRadius: CIRCLE_SIZE / 2,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.22,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 5 },
      elevation: 10,
    },
    countdownNum: {
      color: '#fff',
      fontSize: 54,
      fontWeight: '900',
      lineHeight: 62,
    },
    circleLabel: {
      color: '#fff',
      fontSize: 15,
      fontWeight: '700',
      textAlign: 'center',
    },
    circleSub: {
      color: 'rgba(255,255,255,0.72)',
      fontSize: 11,
      marginTop: 4,
      textAlign: 'center',
    },

    // Round + dots
    roundRow: {
      height: 22,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 6,
    },
    roundText: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '600',
    },
    phaseDots: {
      flexDirection: 'row',
      gap: 6,
      alignItems: 'center',
      marginBottom: 18,
    },
    dot: {
      height: 8,
      borderRadius: 4,
    },

    // Phase guide
    phaseGuide: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 10,
      marginBottom: 22,
      width: '100%',
    },
    phaseGuideItem: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 2,
    },
    phaseGuideBarWrap: {
      height: 60,
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    phaseBar: {
      width: 14,
      borderRadius: 7,
    },
    phaseGuideName: {
      fontSize: 10,
      fontWeight: '600',
      marginTop: 6,
      textAlign: 'center',
    },
    phaseGuideSec: {
      fontSize: 12,
      fontWeight: '800',
      marginTop: 2,
    },

    // Button
    mainBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      width: '100%',
      paddingVertical: 16,
      borderRadius: 20,
    },
    mainBtnText: {
      color: '#fff',
      fontSize: 17,
      fontWeight: '800',
    },
  });
