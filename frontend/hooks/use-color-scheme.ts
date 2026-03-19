import { useColorScheme as useRNColorScheme } from 'react-native';

import { useTheme } from '@/context/theme-context';

export function useColorScheme() {
  const { colorScheme } = useTheme();
  return colorScheme ?? useRNColorScheme() ?? 'light';
}
