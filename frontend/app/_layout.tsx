/**
 * _layout.tsx — Root Layout (Provider Wrapper)
 *
 * ห่อทุกหน้าในแอปด้วย:
 *   - LanguageProvider  → จัดการภาษา EN/TH (ดูที่ context/language-context.tsx)
 *   - ThemeProvider     → จัดการ Light/Dark mode (ดูที่ context/theme-context.tsx)
 *   - SafeAreaProvider  → จัดการ safe area (notch, home bar)
 *
 * notification handler ที่นี่ทำให้ notification แสดงได้ทุกหน้า
 * หากต้องการเพิ่มหน้าใหม่ → เพิ่ม <Stack.Screen name="ชื่อหน้า" /> ในนี้
 */
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { ThemeProvider, useTheme } from '@/context/theme-context';
import { LanguageProvider } from '@/context/language-context';

// Set handler at app level so notifications show on ALL screens
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

function RootLayoutContent() {
  const { colorScheme } = useTheme();

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <RootLayoutContent />
      </ThemeProvider>
    </LanguageProvider>
  );
}
