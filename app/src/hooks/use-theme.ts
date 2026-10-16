import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

/** As cores do tema do sistema: claro ou escuro (ADR 037). */
export function useTheme() {
  return useColorScheme() === 'dark' ? Colors.dark : Colors.light;
}
