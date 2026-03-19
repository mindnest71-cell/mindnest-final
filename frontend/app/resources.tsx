import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../utils/api';

import { useTheme } from '../context/theme-context';
import { useLanguage } from '../context/language-context';

type ResourceItem = {
  id?: string;
  name: string;
  description: string;
  phone?: string;
  website?: string;
  available_hours?: string;
};

export default function Resources() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const { language } = useLanguage();
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    fetchResources();
  }, [language]);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/resources/?language=${language}`);
      const data = Array.isArray(response.data) ? response.data : [];
      setResources(data);
    } catch (error) {
      console.log('Error fetching resources:', error);
      setResources([]);
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
