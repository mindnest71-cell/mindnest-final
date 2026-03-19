/**
 * resources.tsx — หน้าแหล่งช่วยเหลือฉุกเฉิน (Crisis Resources)
 *
 * API endpoint: GET /resources/?language=en|th
 *   → โหลดจาก backend ก่อน ถ้า fail จะใช้ FALLBACK_RESOURCES แทน
 *
 * แก้ชื่อหัวข้อหน้า → แก้ที่ <Text style={styles.headerTitle}>Crisis Resources</Text>
 * แก้ปุ่มภาษา (English / ภาษาไทย) → แก้ใน <Text> ใน languageToggle section
 *
 * ResourceItem fields ที่แสดง:
 *   name, description, phone (ถ้ามี), website (ถ้ามี)
 *   → ปุ่ม Call / Website จะปรากฏเฉพาะเมื่อมีข้อมูล
 */
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '@/utils/api';

import { useTheme } from '@/context/theme-context';

type ResourceItem = {
  id?: string;
  name: string;
  description: string;
  phone?: string | null;
  website?: string;
  available_hours?: string;
};

const FALLBACK_RESOURCES: Record<'en' | 'th', ResourceItem[]> = {
  en: [
    { name: 'Department of Mental Health Hotline (1323)', phone: '1323', website: 'https://www.dmh.go.th', description: 'The official government mental health hotline providing free, 24/7 consultation for stress, depression, and mental health issues.', available_hours: '24/7' },
    { name: 'Medical Emergency Hotline (1669)', phone: '1669', website: 'https://www.niems.go.th', description: 'The national emergency number for ambulance and medical rescue services in life-threatening situations.', available_hours: '24/7' },
    { name: 'Social Assistance Center (1300)', phone: '1300', website: 'https://www.m-society.go.th', description: 'Operated by the Ministry of Social Development and Human Security, this hotline helps with domestic violence, human trafficking, and child protection issues.', available_hours: '24/7' },
    { name: 'Depress We Care', phone: '081-932-0000', website: 'https://www.facebook.com/DepressWeCare', description: 'A specialized service by the Police General Hospital providing support for depression and mental health issues.', available_hours: '24/7' },
    { name: 'Childline Thailand', phone: '1387', website: 'https://childlinethailand.org', description: 'A dedicated hotline for children and youth under 18 to discuss family problems, abuse, or mental health concerns safely and confidentially.', available_hours: '24/7' },
    { name: 'Manarom Hospital Crisis Center', phone: '02-725-9595', website: 'https://www.manarom.com', description: 'A private specialized mental health hospital offering comprehensive psychiatric care and emergency services.', available_hours: '24/7 (Emergency Services)' },
    { name: 'Samaritans of Thailand', phone: '02-113-6789', website: 'https://www.facebook.com/Samaritans.Thailand', description: 'A non-profit organization providing anonymous, confidential emotional support for those feeling depressed, lonely, or suicidal.', available_hours: '12:00 PM - 10:00 PM (Daily)' },
    { name: 'Sati App', phone: null, website: 'https://www.satiapp.co', description: 'An on-demand listening service app that connects users with trained empathetic listeners for anonymous emotional support.', available_hours: '24/7' },
    { name: 'Bumrungrad Behavioral Health Center', phone: '02-011-4090', website: 'https://www.bumrungrad.com/en/centers/behavioral-health-center', description: 'A premium medical center providing holistic mental health care, counselling, and psychiatric treatment for adults and children.', available_hours: '08:00 AM - 08:00 PM' },
    { name: 'Bangkok Counselling Service', phone: '02-286-1352', website: 'https://bangkokcounsellingservice.com', description: 'Provides psychological counseling and psychotherapy for individuals, couples, and families.', available_hours: 'By Appointment' },
  ],
  th: [
    { name: 'สายด่วนสุขภาพจิต (1323)', phone: '1323', website: 'https://www.dmh.go.th', description: 'สายด่วนสุขภาพจิตอย่างเป็นทางการของกรมสุขภาพจิต ให้บริการปรึกษาปัญหาความเครียด ภาวะซึมเศร้า และสุขภาพจิตทุกประเภทฟรีตลอด 24 ชั่วโมง', available_hours: '24/7' },
    { name: 'สายด่วนฉุกเฉินทางการแพทย์ (1669)', phone: '1669', website: 'https://www.niems.go.th', description: 'หมายเลขฉุกเฉินระดับชาติสำหรับรถพยาบาลและบริการกู้ภัยทางการแพทย์ในสถานการณ์ที่เป็นอันตรายถึงชีวิต', available_hours: '24/7' },
    { name: 'สายด่วนช่วยเหลือสังคม (1300)', phone: '1300', website: 'https://www.m-society.go.th', description: 'ดำเนินการโดยกระทรวงการพัฒนาสังคมและความมั่นคงของมนุษย์ ให้ความช่วยเหลือด้านความรุนแรงในครอบครัว การค้ามนุษย์ และการคุ้มครองเด็ก', available_hours: '24/7' },
    { name: 'Depress We Care', phone: '081-932-0000', website: 'https://www.facebook.com/DepressWeCare', description: 'บริการเฉพาะทางของโรงพยาบาลตำรวจ ให้การสนับสนุนด้านภาวะซึมเศร้าและปัญหาสุขภาพจิต', available_hours: '24/7' },
    { name: 'ChildLine Thailand (1387)', phone: '1387', website: 'https://childlinethailand.org', description: 'สายด่วนเฉพาะสำหรับเด็กและเยาวชนอายุต่ำกว่า 18 ปี เพื่อพูดคุยเรื่องปัญหาครอบครัวหรือความกังวลด้านสุขภาพจิตอย่างปลอดภัย', available_hours: '24/7' },
    { name: 'โรงพยาบาลมนารมย์ ศูนย์วิกฤต', phone: '02-725-9595', website: 'https://www.manarom.com', description: 'โรงพยาบาลเฉพาะทางด้านสุขภาพจิตเอกชนที่ให้บริการจิตเวชครบวงจรและบริการฉุกเฉิน', available_hours: '24/7 (บริการฉุกเฉิน)' },
    { name: 'Samaritans of Thailand', phone: '02-113-6789', website: 'https://www.facebook.com/Samaritans.Thailand', description: 'องค์กรไม่แสวงหากำไรที่ให้การสนับสนุนทางอารมณ์แบบไม่ระบุชื่อและเป็นความลับสำหรับผู้ที่รู้สึกหดหู่ โดดเดี่ยว หรือมีความคิดอยากทำร้ายตนเอง', available_hours: '12:00 - 22:00 (ทุกวัน)' },
    { name: 'Sati App', phone: null, website: 'https://www.satiapp.co', description: 'แอปพลิเคชันบริการรับฟังออนดีมานด์ที่เชื่อมต่อผู้ใช้กับนักฟังที่ผ่านการฝึกอบรมเพื่อสนับสนุนทางอารมณ์แบบไม่ระบุชื่อ', available_hours: '24/7' },
    { name: 'ศูนย์สุขภาพจิตโรงพยาบาลบำรุงราษฎร์', phone: '02-011-4090', website: 'https://www.bumrungrad.com/en/centers/behavioral-health-center', description: 'ศูนย์การแพทย์ชั้นนำที่ให้บริการดูแลสุขภาพจิตแบบองค์รวม การให้คำปรึกษา และการรักษาทางจิตเวช', available_hours: '08:00 - 20:00' },
    { name: 'Bangkok Counselling Service', phone: '02-286-1352', website: 'https://bangkokcounsellingservice.com', description: 'ให้บริการคำปรึกษาทางจิตวิทยาและจิตบำบัดสำหรับบุคคล คู่รัก และครอบครัว', available_hours: 'นัดหมายล่วงหน้า' },
  ],
};

export default function Resources() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<'en' | 'th'>('en');
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [usingFallback, setUsingFallback] = useState(false);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    fetchResources();
  }, [language]);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/resources/?language=${language}`);
      const data = Array.isArray(response.data) && response.data.length > 0 ? response.data : null;
      if (data) {
        setResources(data);
        setUsingFallback(false);
      } else {
        setResources(FALLBACK_RESOURCES[language]);
        setUsingFallback(true);
      }
    } catch {
      setResources(FALLBACK_RESOURCES[language]);
      setUsingFallback(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = (phoneNumber: string) => {
    const cleanNumber = phoneNumber.split('/')[0].replace(/[^0-9]/g, '');
    Linking.openURL(`tel:${cleanNumber}`);
  };

  const handleWebsite = (url: string) => {
    Linking.openURL(url);
  };

  const renderItem = ({ item }: { item: ResourceItem }) => (
    <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <MaterialCommunityIcons name="shield-check" size={20} color={colors.primary} />
        </View>

      <Text style={styles.cardDescription}>{item.description}</Text>

      {item.phone && <Text style={styles.contactText}>📞 {item.phone}</Text>}

      <View style={styles.cardActions}>
        {item.phone && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.callBtn]}
            onPress={() => handleCall(item.phone as string)}
          >
            <MaterialCommunityIcons name="phone" size={18} color={colors.textOnPrimary} />
            <Text style={styles.actionBtnText}>Call</Text>
          </TouchableOpacity>
        )}

        {item.website && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.webBtn]}
            onPress={() => handleWebsite(item.website as string)}
          >
            <MaterialCommunityIcons name="web" size={18} color={colors.primary} />
            <Text style={[styles.actionBtnText, { color: colors.primary }]}>Website</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.icon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Crisis Resources</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.languageToggleContainer}>
        <View style={styles.languageToggle}>
          <TouchableOpacity
            style={[styles.langBtn, language === 'en' && styles.langBtnActive]}
            onPress={() => setLanguage('en')}
          >
            <Text style={[styles.langText, language === 'en' && styles.langTextActive]}>English</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.langBtn, language === 'th' && styles.langBtnActive]}
            onPress={() => setLanguage('th')}
          >
            <Text style={[styles.langText, language === 'th' && styles.langTextActive]}>ภาษาไทย</Text>
          </TouchableOpacity>
        </View>
      </View>

      {usingFallback && !loading && (
        <View style={styles.fallbackBanner}>
          <MaterialCommunityIcons name="wifi-off" size={15} color={colors.textMuted} />
          <Text style={styles.fallbackText}>
            {language === 'th' ? 'แสดงข้อมูลสำรอง (ออฟไลน์)' : 'Showing offline data'}
          </Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={resources}
          renderItem={renderItem}
          keyExtractor={(item, index) => item.id?.toString() ?? `${item.name}-${index}`}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No resources found for this language.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

type ThemeColors = ReturnType<typeof useTheme>['colors'];

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 18,
      paddingVertical: 14,
      marginHorizontal: 18,
      marginTop: 12,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },

    headerTitle: {
      fontSize: 16,
      fontWeight: '900',
      color: colors.text,
      letterSpacing: 0.2,
    },

    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface2,
    },

    languageToggleContainer: {
      paddingHorizontal: 18,
      paddingTop: 14,
      paddingBottom: 6,
      backgroundColor: 'transparent',
    },

    languageToggle: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },

    langBtn: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      borderRadius: 12,
    },

    langBtnActive: {
      backgroundColor: withAlpha(colors.primary, 0.12),
      borderWidth: 1,
      borderColor: withAlpha(colors.primary, 0.3),
    },

    langText: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.textMuted,
    },

    langTextActive: {
      color: colors.primary,
    },

    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },

    listContent: {
      paddingHorizontal: 18,
      paddingTop: 12,
      paddingBottom: 24,
      gap: 14,
    },

    card: {
      backgroundColor: colors.surface,
      borderRadius: 22,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 1,
      shadowRadius: 18,
      elevation: 10,
    },

    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },

    cardTitle: {
      fontSize: 16,
      fontWeight: '900',
      color: colors.text,
      flex: 1,
      marginRight: 10,
    },

    cardDescription: {
      fontSize: 13,
      color: colors.textMuted,
      lineHeight: 20,
      marginBottom: 10,
    },

    contactText: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 14,
    },

    cardActions: {
      flexDirection: 'row',
      gap: 12,
    },

    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 14,
      gap: 8,
      borderWidth: 1,
    },

    callBtn: {
      backgroundColor: withAlpha(colors.primary, 0.22),
      borderColor: withAlpha(colors.primary, 0.32),
    },

    webBtn: {
      backgroundColor: colors.surface2,
      borderColor: colors.border,
    },

    actionBtnText: {
      fontWeight: '900',
      fontSize: 13,
      color: colors.textOnPrimary,
    },

    emptyText: {
      textAlign: 'center',
      marginTop: 40,
      color: colors.textMuted,
      fontSize: 15,
      fontWeight: '800',
    },

    fallbackBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginHorizontal: 18,
      marginTop: 10,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 10,
      backgroundColor: withAlpha(colors.textMuted, 0.1),
    },

    fallbackText: {
      fontSize: 12,
      color: colors.textMuted,
      fontWeight: '600',
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
