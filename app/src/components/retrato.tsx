import { Image } from 'expo-image';
import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { FontFamily } from '@/constants/theme';
import { useSessao } from '@/hooks/use-sessao';
import { useTheme } from '@/hooks/use-theme';
import { useUrlAssinada } from '@/hooks/use-url-assinada';

type Props = {
  /** De quem é o retrato: o próprio membro ou o da outra pessoa do Laço. Sem autor, nada aparece. */
  membroId?: string | null;
  /** Sem o id à mão (o perfil não traz o da outra pessoa): "eu" ou "outra". */
  pessoa?: 'eu' | 'outra';
  /** Diâmetro em pontos. Pequeno de propósito: acompanha o nome, não disputa com a foto. */
  tamanho?: number;
};

/**
 * A foto de perfil de uma pessoa do casal (ADR 043), redonda e discreta, ao lado de onde a autoria
 * importa. Sem foto, a inicial do nome no papel. É só um complemento do nome, que sempre aparece
 * por perto: o leitor de tela não o anuncia.
 */
export function Retrato({ membroId, pessoa, tamanho = 22 }: Props) {
  const theme = useTheme();
  const { perfil } = useSessao();
  const meu = pessoa ? pessoa === 'eu' : membroId === perfil?.membro_id;
  const conhecido = Boolean(perfil && (pessoa || membroId));
  const caminho = !conhecido || !perfil ? null : meu ? (perfil.foto_caminho ?? null) : (perfil.companheiro_foto_caminho ?? null);
  const nome = meu ? perfil?.nome : perfil?.companheiro_nome;
  const url = useUrlAssinada(caminho);
  if (!conhecido) return null;

  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={{
        width: tamanho,
        height: tamanho,
        borderRadius: tamanho / 2,
        overflow: 'hidden',
        backgroundColor: theme.papel,
        borderWidth: 1,
        borderColor: theme.papelBorda,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      {url && caminho ? (
        <Image source={{ uri: url, cacheKey: caminho }} contentFit="cover" style={{ width: tamanho, height: tamanho }} />
      ) : (
        <ThemedText
          themeColor="textSecondary"
          style={{ fontFamily: FontFamily.display, fontSize: tamanho * 0.5, lineHeight: tamanho * 0.62 }}>
          {(nome ?? '?').trim().charAt(0).toUpperCase()}
        </ThemedText>
      )}
    </View>
  );
}
