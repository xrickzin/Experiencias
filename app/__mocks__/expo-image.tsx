// O componente nativo do expo-image não existe no Jest: nos testes, a imagem vira uma View simples.
import { View, type ViewProps } from 'react-native';

export function Image({ accessibilityLabel, style, testID }: ViewProps & { source?: unknown }) {
  return <View accessibilityLabel={accessibilityLabel} style={style} testID={testID} />;
}
