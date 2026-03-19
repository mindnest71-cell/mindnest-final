/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

export const LightColors = {
  background: '#F7F6FF',
  surface: '#FFFFFF',
  surface2: '#F2F1FF',
  primary: '#6C63FF',
  primaryDark: '#4E46E5',
  primarySoft: '#E7E6FF',
  primarySoft2: '#F0EFFF',
  text: '#0F172A',
  textMuted: '#64748B',
  textOnPrimary: '#FFFFFF',
  border: '#E6E4FF',
  divider: '#ECEBFF',
  icon: '#4338CA',
  iconMuted: '#7C7AAE',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  shadow: 'rgba(17, 24, 39, 0.10)',
};

export const DarkColors = {
  background: '#0B1020',
  surface: '#12172A',
  surface2: '#1A2140',
  primary: '#8B82FF',
  primaryDark: '#5B54E6',
  primarySoft: '#2A2952',
  primarySoft2: '#232146',
  text: '#E6EAF5',
  textMuted: '#9AA3B2',
  textOnPrimary: '#FFFFFF',
  border: '#242B49',
  divider: '#1F2540',
  icon: '#B9B6FF',
  iconMuted: '#8A90B5',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#F87171',
  shadow: 'rgba(0, 0, 0, 0.35)',
};

export const Colors = {
  light: {
    ...LightColors,
    tint: LightColors.primary,
    tabIconDefault: LightColors.iconMuted,
    tabIconSelected: LightColors.primary,
  },
  dark: {
    ...DarkColors,
    tint: DarkColors.primary,
    tabIconDefault: DarkColors.iconMuted,
    tabIconSelected: DarkColors.primary,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
