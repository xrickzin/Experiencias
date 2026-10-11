import { Colors } from '@/constants/theme';

/**
 * O MVP tem apenas o tema claro e não acompanha o tema escuro do sistema.
 * Os tokens do escuro permanecem em `Colors.dark` para uma versão futura.
 */
export function useTheme() {
  return Colors.light;
}
