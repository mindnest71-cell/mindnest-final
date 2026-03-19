import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

import api from '../utils/api';
import ChatHeader from '../components/ChatHeader';
import MessageBubble from '../components/MessageBubble';
import ChatInput from '../components/ChatInput';

import { useTheme } from '../context/theme-context';

type ChatMessage = {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
  techniques: unknown[];
  crisis_resources: unknown[];
  severity: string;
  quotes: unknown[];
  timestamp_iso?: string;
  date?: string;
  dateKey?: string;
  dateLabel?: string;
};

type CreateMessageInput = {
  id: string;
  text: string;
  isUser: boolean;
  date: Date;
  techniques?: unknown[];
  crisis_resources?: unknown[];
  severity?: string;
  quotes?: unknown[];
};

type DateListItem = {
  id: string;
  type: 'date';
  dateKey: string;
  dateLabel: string;
};

type MessageListItem = ChatMessage & {
  type: 'message';
  dateKey: string;
  dateLabel: string;
};

type ListItem = DateListItem | MessageListItem;

const formatDateLabel = (date: Date) =>
  date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

const getDateKey = (date: Date) => date.toISOString().split('T')[0];

const formatTimestamp = (date: Date) =>
  date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const createChatMessage = ({
  id,
  text,
  isUser,
  date,
  techniques = [],
  crisis_resources = [],
  severity = '',
  quotes = [],
}: CreateMessageInput): ChatMessage => ({
  id,
  text,
  isUser,
  techniques,
  crisis_resources,
  severity,
  quotes,
  timestamp: formatTimestamp(date),
  dateKey: getDateKey(date),
  dateLabel: formatDateLabel(date),
});

const normalizeMessageDate = (message: ChatMessage) => {
  if (message.dateKey && message.dateLabel) return message;
  const dateSource = message.timestamp_iso || message.date;
  const dateValue = dateSource ? new Date(dateSource) : new Date();
  const timestamp = message.timestamp || formatTimestamp(dateValue);
  return {
    ...message,
    timestamp,
    dateKey: getDateKey(dateValue),
    dateLabel: formatDateLabel(dateValue),
  };
};

const CHAT_HISTORY_KEY = 'chat_history';

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

/** Animated "Bobby is typing..." */
const TypingIndicator = ({ name = 'Bobby' }: { name?: string }) => {
  const { colors, colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const dot1 = useRef(new Animated.Value(0.25)).current;
  const dot2 = useRef(new Animated.Value(0.25)).current;
  const dot3 = useRef(new Animated.Value(0.25)).current;

  useEffect(() => {
    const pulse = (v: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(v, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.timing(v, { toValue: 0.25, duration: 350, useNativeDriver: true }),
        ])
      );

    const a1 = pulse(dot1, 0);
    const a2 = pulse(dot2, 140);
    const a3 = pulse(dot3, 280);

    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.typingRow}>
      <BlurView intensity={22} tint="dark" style={styles.typingPill}>
        <Text style={styles.typingText}>{name} is typing</Text>
        <View style={styles.dots}>
          <Animated.View style={[styles.dot, { opacity: dot1 }]} />
          <Animated.View style={[styles.dot, { opacity: dot2 }]} />
          <Animated.View style={[styles.dot, { opacity: dot3 }]} />
        </View>
      </BlurView>
    </View>
  );
};

const ChatScreenContent = () => {
  const insets = useSafeAreaInsets();
  const { colors, colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const backgroundGradient = useMemo(
    () =>
      (isDark
        ? [colors.primaryDark, colors.primary, colors.surface2]
        : [colors.primary, colors.primarySoft2, colors.surface]) as [string, string, string],
    [colors, isDark]
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList<ListItem>>(null);
  const notificationIdRef = useRef<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

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

  const scheduleFollowUpNotification = async () => {
    if (Platform.OS === 'web') return;

    try {
      if (notificationIdRef.current) {
        await Notifications.cancelScheduledNotificationAsync(notificationIdRef.current);
      }

      const trigger: Notifications.TimeIntervalTriggerInput = {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 5 * 60,
        repeats: false,
      };

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Bobby from MindNest',
          body: 'Checking in after our chat. Need anything else?',
        },
        trigger,
      });

      notificationIdRef.current = id;
    } catch (error) {
      console.log('Error scheduling follow-up notification:', error);
    }
  };

  const loadLocalHistory = async (): Promise<ChatMessage[]> => {
    try {
      const stored = await AsyncStorage.getItem(CHAT_HISTORY_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed.map(normalizeMessageDate);
    } catch (error) {
      console.log('Error loading local history:', error);
    }
    return [];
  };

  const fetchHistory = async () => {
    try {
      const res = await api.get('/chat/history');
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setMessages(res.data.map(normalizeMessageDate));
      } else {
        const localHistory = await loadLocalHistory();
        if (localHistory.length > 0) {
          setMessages(localHistory);
          return;
        }
        const now = new Date();
        setMessages([
          createChatMessage({
            id: '1',
            text: "Hello! I'm here to provide support.\nHow are you feeling today?",
            isUser: false,
            date: now,
          }),
        ]);
      }
    } catch (e) {
      console.log('Error fetching history:', e);
      const localHistory = await loadLocalHistory();
      if (localHistory.length > 0) setMessages(localHistory);
    }
  };

  const sendMessage = async (text: string) => {
    const now = new Date();
    const baseId = Date.now();
    const userMessage = createChatMessage({
      id: baseId.toString(),
      text,
      isUser: true,
      date: now,
    });

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await api.post('/chat', { message: text });
      const botMessage = createChatMessage({
        id: (baseId + 1).toString(),
        text: response.data.response,
        techniques: response.data.techniques,
        crisis_resources: response.data.crisis_resources,
        severity: response.data.severity,
        quotes: response.data.quotes,
        isUser: false,
        date: now,
      });
      setMessages((prev) => [...prev, botMessage]);
      await scheduleFollowUpNotification();
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = createChatMessage({
        id: (baseId + 1).toString(),
        text: "I'm having trouble connecting right now. Please try again.",
        isUser: false,
        date: now,
      });
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!flatListRef.current) return;
    const t = setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 120);
    return () => clearTimeout(t);
  }, [messages]);

  useEffect(() => {
    const persistHistory = async () => {
      try {
        await AsyncStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
      } catch (error) {
        console.log('Error saving local history:', error);
      }
    };
    if (messages.length > 0) persistHistory();
  }, [messages]);

  const bottomPadding = Math.max(insets.bottom, 18) + 10;

  const listData = useMemo<ListItem[]>(() => {
    const items: ListItem[] = [];
    let lastDateKey: string | null = null;

    messages.forEach((message) => {
      const dateKey = message.dateKey || getDateKey(new Date());
      const dateLabel = message.dateLabel || formatDateLabel(new Date());

      if (dateKey !== lastDateKey) {
        items.push({ id: `date-${dateKey}`, type: 'date', dateKey, dateLabel });
        lastDateKey = dateKey;
      }

      items.push({ ...message, type: 'message', dateKey, dateLabel });
    });

    return items;
  }, [messages]);

  return (
    <View style={styles.root}>
      {/* Background gradient */}
      <LinearGradient
        colors={backgroundGradient}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Header card */}
      <View style={[styles.headerCard, { marginTop: insets.top + 6 }]}>
        <ChatHeader />
      </View>

      {/* Shadow fade under header (ทำให้กลืนกับ background) */}
      <LinearGradient
        colors={[withAlpha('#000000', 0.22), 'rgba(0,0,0,0.00)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.headerFade}
        pointerEvents="none"
      />

      <FlatList
        ref={flatListRef}
        data={listData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          if (item.type === 'date') {
            return (
              <View style={styles.dateRow}>
                <View style={styles.dateLine} />
                {/* Glass blur pill */}
                <BlurView intensity={18} tint={isDark ? 'dark' : 'light'} style={styles.datePill}>
                  <Text style={styles.dateText}>{item.dateLabel}</Text>
                </BlurView>
                <View style={styles.dateLine} />
              </View>
            );
          }

          return (
            <MessageBubble
              text={item.text}
              isUser={item.isUser}
              timestamp={item.timestamp}
              techniques={item.techniques}
              crisis_resources={item.crisis_resources}
              severity={item.severity}
              quotes={item.quotes}
            />
          );
        }}
        contentContainerStyle={styles.messagesList}
        style={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {/* Typing indicator แบบ Bobby is typing ... */}
      {loading ? <TypingIndicator name="Bobby" /> : null}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[styles.inputPanelOuter, { paddingBottom: bottomPadding }]}>
          <View style={styles.inputPanelInner}>
            <ChatInput onSend={sendMessage} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const ChatScreen = () => (
  <SafeAreaProvider>
    <ChatScreenContent />
  </SafeAreaProvider>
);

const createStyles = (colors: ReturnType<typeof useTheme>['colors'], isDark: boolean) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },

    headerCard: {
      marginHorizontal: 16,
      borderRadius: 20,
      overflow: 'hidden',
      backgroundColor: withAlpha(colors.surface, 0.88),
      borderWidth: 1,
      borderColor: withAlpha(colors.border, 0.75),
      shadowColor: colors.shadow,
      shadowOpacity: 0.45,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
      zIndex: 3,
    },

    headerFade: {
      height: 18,
      marginHorizontal: 16,
      marginTop: 6,
      borderRadius: 12,
      zIndex: 2,
    },

    list: { flex: 1, backgroundColor: 'transparent' },
    messagesList: {
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 22,
    },

    dateRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
    dateLine: { flex: 1, height: 1, backgroundColor: withAlpha(colors.textOnPrimary, 0.2) },
    datePill: {
      paddingHorizontal: 16,
      paddingVertical: 7,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: withAlpha(colors.textOnPrimary, 0.2),
      marginHorizontal: 12,
      overflow: 'hidden',
    },
    dateText: { fontSize: 13, fontWeight: '700', color: withAlpha(colors.textOnPrimary, 0.9) },

    typingRow: { paddingHorizontal: 16, marginBottom: 8 },
    typingPill: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: withAlpha(colors.textOnPrimary, 0.16),
      overflow: 'hidden',
    },
    typingText: { color: withAlpha(colors.textOnPrimary, 0.9), fontSize: 12, fontWeight: '700' },
    dots: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingTop: 2 },
    dot: {
      width: 5,
      height: 5,
      borderRadius: 99,
      backgroundColor: withAlpha(colors.textOnPrimary, 0.9),
    },

    inputPanelOuter: {
      paddingHorizontal: 16,
      paddingTop: 10,
      backgroundColor: 'transparent',
    },
    inputPanelInner: {
      borderRadius: 28,
      padding: 14,
      backgroundColor: withAlpha(colors.primaryDark, isDark ? 0.25 : 0.18),
      borderWidth: 1,
      borderColor: withAlpha(colors.textOnPrimary, 0.16),
      shadowColor: colors.shadow,
      shadowOpacity: 1,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: 12,
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

export default ChatScreen;
