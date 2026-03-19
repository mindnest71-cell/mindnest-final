/**
 * journal.tsx — หน้าบันทึก (Journal)
 *
 * ข้อมูลเก็บใน AsyncStorage (ไม่ sync กับ server):
 *   key: 'journal_entries' → array ของ JournalEntry[]
 *   จำกัดสูงสุด MAX_STORED_ENTRIES = 500 รายการ
 *
 * แก้ข้อความ → แก้ใน STRINGS.en / STRINGS.th (บรรทัด ~27)
 * แก้ความยาวสูงสุดของเนื้อหา → แก้ maxLength={3000} ใน TextInput
 * แก้จำนวนรายการสูงสุด → แก้ MAX_STORED_ENTRIES (บรรทัด ~25)
 *
 * Entry จะแสดง "Read more" เมื่อเนื้อหายาวกว่า 150 ตัวอักษร
 *   → แก้ค่านี้ได้ที่: const longContent = entry.content.length > 150
 */
import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '@/context/theme-context';
import { useLanguage } from '@/context/language-context';

// -------------------- Constants --------------------

const STORAGE_KEY = 'journal_entries';
const MAX_STORED_ENTRIES = 500;

const STRINGS = {
  en: {
    title: 'Journal',
    newEntry: 'New Entry',
    titlePlaceholder: 'Title (optional)',
    contentPlaceholder: "What's on your mind today?\nWrite freely — this is your space.",
    save: 'Save Entry',
    saved: 'Entry saved!',
    noContent: 'Please write something before saving.',
    history: 'Past Entries',
    noHistory: 'No journal entries yet.\nStart writing — it helps.',
    untitled: 'Untitled',
    deleteTitle: 'Delete Entry',
    deleteMsg: 'Are you sure you want to delete this entry?',
    cancel: 'Cancel',
    delete: 'Delete',
    readLess: 'Show less',
    readMore: 'Read more',
  },
  th: {
    title: 'บันทึก',
    newEntry: 'เขียนบันทึกใหม่',
    titlePlaceholder: 'หัวข้อ (ไม่บังคับ)',
    contentPlaceholder: 'วันนี้มีอะไรอยู่ในใจบ้าง?\nเขียนได้เลย — ที่นี่เป็นพื้นที่ของคุณ',
    save: 'บันทึก',
    saved: 'บันทึกเรียบร้อย!',
    noContent: 'กรุณาเขียนบางอย่างก่อนบันทึก',
    history: 'รายการที่ผ่านมา',
    noHistory: 'ยังไม่มีบันทึก\nลองเริ่มเขียนดูนะ มันช่วยได้',
    untitled: 'ไม่มีหัวข้อ',
    deleteTitle: 'ลบรายการ',
    deleteMsg: 'แน่ใจหรือไม่ว่าต้องการลบรายการนี้?',
    cancel: 'ยกเลิก',
    delete: 'ลบ',
    readLess: 'ย่อ',
    readMore: 'อ่านต่อ',
  },
};

// -------------------- Types --------------------

interface JournalEntry {
  id: string;        // ISO timestamp as unique key
  date: string;      // "YYYY-MM-DD"
  title: string;
  content: string;
  timestamp: string; // ISO
}

// -------------------- Helpers --------------------

const todayStr = () => new Date().toISOString().slice(0, 10);

// Group entries by date, sorted newest first
const groupByDate = (entries: JournalEntry[]): { date: string; items: JournalEntry[] }[] => {
  const map: Record<string, JournalEntry[]> = {};
  entries.forEach(e => {
    if (!map[e.date]) map[e.date] = [];
    map[e.date].push(e);
  });
  return Object.keys(map)
    .sort((a, b) => b.localeCompare(a))
    .map(date => ({ date, items: map[date].sort((a, b) => b.timestamp.localeCompare(a.timestamp)) }));
};

// -------------------- Component --------------------

export default function Journal() {
  const router = useRouter();
  const { colors, colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const { lang } = useLanguage();
  const t = STRINGS[lang];
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const [titleInput, setTitleInput] = useState('');
  const [contentInput, setContentInput] = useState('');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const loadEntries = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const data: JournalEntry[] = raw ? JSON.parse(raw) : [];
      setEntries(data.sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
    } catch (e) {
      console.log('Error loading journal entries:', e);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadEntries(); }, [loadEntries]));

  const handleSave = async () => {
    const content = contentInput.trim();
    if (!content) {
      Alert.alert('', t.noContent);
      return;
    }
    const now = new Date();
    const entry: JournalEntry = {
      id: now.toISOString(),
      date: todayStr(),
      title: titleInput.trim(),
      content,
      timestamp: now.toISOString(),
    };
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      let all: JournalEntry[] = raw ? JSON.parse(raw) : [];
      all.unshift(entry);
      if (all.length > MAX_STORED_ENTRIES) all = all.slice(0, MAX_STORED_ENTRIES);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      setTitleInput('');
      setContentInput('');
      Alert.alert('', t.saved);
      loadEntries();
    } catch (e) {
      console.log('Error saving journal entry:', e);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(t.deleteTitle, t.deleteMsg, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.delete,
        style: 'destructive',
        onPress: async () => {
          try {
            const raw = await AsyncStorage.getItem(STORAGE_KEY);
            let all: JournalEntry[] = raw ? JSON.parse(raw) : [];
            all = all.filter(e => e.id !== id);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(all));
            loadEntries();
          } catch (e) {
            console.log('Error deleting entry:', e);
          }
        },
      },
    ]);
  };

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const grouped = useMemo(() => groupByDate(entries), [entries]);

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

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* New Entry Card */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>{t.newEntry}</Text>

            {/* Title Input */}
            <TextInput
              style={styles.titleInput}
              placeholder={t.titlePlaceholder}
              placeholderTextColor={colors.textMuted}
              value={titleInput}
              onChangeText={setTitleInput}
              maxLength={100}
            />

            {/* Content Input */}
            <TextInput
              style={styles.contentInput}
              placeholder={t.contentPlaceholder}
              placeholderTextColor={colors.textMuted}
              value={contentInput}
              onChangeText={setContentInput}
              multiline
              textAlignVertical="top"
              maxLength={3000}
            />

            {/* Char count */}
            <Text style={styles.charCount}>{contentInput.length} / 3000</Text>

            {/* Save button */}
            <TouchableOpacity
              onPress={handleSave}
              style={[styles.saveBtn, !contentInput.trim() && styles.saveBtnDisabled]}
              activeOpacity={0.85}
              disabled={!contentInput.trim()}
            >
              <MaterialCommunityIcons name="content-save-outline" size={18} color="#fff" />
              <Text style={styles.saveBtnText}>{t.save}</Text>
            </TouchableOpacity>
          </View>

          {/* History */}
          <Text style={styles.historyTitle}>{t.history}</Text>

          {grouped.length === 0 ? (
            <Text style={styles.emptyText}>{t.noHistory}</Text>
          ) : (
            grouped.map(({ date, items }) => {
              const dateObj = new Date(date + 'T12:00:00');
              const dateLabel = dateObj.toLocaleDateString(
                lang === 'th' ? 'th-TH' : 'en-US',
                { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
              );
              const isToday = date === todayStr();
              return (
                <View key={date}>
                  {/* Date header */}
                  <View style={styles.dateHeader}>
                    {isToday && <View style={styles.todayDot} />}
                    <Text style={[styles.dateHeaderText, isToday && { color: colors.primary }]}>
                      {dateLabel}
                    </Text>
                  </View>

                  {items.map(entry => {
                    const isExpanded = expandedIds.has(entry.id);
                    const timeLabel = new Date(entry.timestamp).toLocaleTimeString(
                      lang === 'th' ? 'th-TH' : 'en-US',
                      { hour: '2-digit', minute: '2-digit' }
                    );
                    const longContent = entry.content.length > 150;
                    return (
                      <View key={entry.id} style={styles.entryCard}>
                        {/* Entry header row */}
                        <View style={styles.entryHeader}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.entryTitle} numberOfLines={1}>
                              {entry.title || t.untitled}
                            </Text>
                            <Text style={styles.entryTime}>{timeLabel}</Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => handleDelete(entry.id)}
                            style={styles.deleteBtn}
                            activeOpacity={0.7}
                          >
                            <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.textMuted} />
                          </TouchableOpacity>
                        </View>

                        {/* Content */}
                        <Text
                          style={styles.entryContent}
                          numberOfLines={isExpanded ? undefined : 3}
                        >
                          {entry.content}
                        </Text>

                        {/* Read more/less */}
                        {longContent && (
                          <TouchableOpacity onPress={() => toggleExpand(entry.id)} activeOpacity={0.7}>
                            <Text style={[styles.readMoreText, { color: colors.primary }]}>
                              {isExpanded ? t.readLess : t.readMore}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </View>
              );
            })
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// -------------------- Styles --------------------

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
      width: 40,
      height: 40,
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
      padding: 18,
    },

    card: {
      backgroundColor: colors.surface,
      borderRadius: 22,
      padding: 18,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOpacity: 1,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    sectionLabel: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 14,
    },

    titleInput: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '700',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingVertical: 8,
      marginBottom: 12,
    },
    contentInput: {
      color: colors.text,
      fontSize: 14,
      lineHeight: 22,
      minHeight: 140,
      paddingVertical: 8,
    },
    charCount: {
      color: colors.textMuted,
      fontSize: 11,
      textAlign: 'right',
      marginBottom: 14,
    },

    saveBtn: {
      backgroundColor: colors.primary,
      borderRadius: 16,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    saveBtnDisabled: { opacity: 0.4 },
    saveBtnText: {
      color: '#fff',
      fontSize: 15,
      fontWeight: '700',
    },

    historyTitle: {
      color: colors.textMuted,
      fontSize: 15,
      fontWeight: '700',
      marginBottom: 12,
    },
    emptyText: {
      color: colors.textMuted,
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 22,
      marginTop: 24,
    },

    dateHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 10,
      marginTop: 4,
    },
    todayDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
    dateHeaderText: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '700',
    },

    entryCard: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 16,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    entryHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    entryTitle: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '700',
    },
    entryTime: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '500',
      marginTop: 2,
    },
    deleteBtn: {
      padding: 4,
      marginLeft: 8,
    },
    entryContent: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 21,
    },
    readMoreText: {
      fontSize: 13,
      fontWeight: '600',
      marginTop: 6,
    },
  });
