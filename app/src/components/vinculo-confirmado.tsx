import { View } from 'react-native';

import { Button } from '@/components/button';
import { ScreenHeader } from '@/components/screen-header';
import { Spacing } from '@/constants/theme';
import type { Perfil } from '@/services/laco';

type VinculoConfirmadoProps = {
  perfil: Perfil | null;
  loading: boolean;
  onContinuar: () => void;
};

/** Confirmação breve depois de entrar no Laço de outra pessoa. */
export function VinculoConfirmado({ perfil, loading, onContinuar }: VinculoConfirmadoProps) {
  const outra = perfil?.companheiro_nome;

  return (
    <View>
      <ScreenHeader
        eyebrow="Vínculo feito"
        title="Você entrou no Laço."
        description={
          perfil
            ? `${outra ? `Agora você e ${outra} compartilham o mesmo Laço. ` : ''}Aqui você aparece como ${perfil.nome}; dá para mudar isso depois, em Ajustes.`
            : 'Agora vocês compartilham o mesmo Laço.'
        }
      />
      <View style={{ marginTop: Spacing.two }}>
        <Button label="Ir para o Início" loading={loading} onPress={onContinuar} />
      </View>
    </View>
  );
}
