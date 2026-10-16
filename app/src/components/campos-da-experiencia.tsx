import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, View } from 'react-native';

import { Button } from '@/components/button';
import { Chip, Grupo, Opcoes } from '@/components/opcoes';
import { ReferenciaTemporalCampo } from '@/components/referencia-temporal-campo';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useCategorias } from '@/hooks/use-categorias';
import { LIMITE_DO_NOME_DA_CATEGORIA } from '@/services/categorias';
import type { Experiencia } from '@/services/experiencias';
import { enderecoNoMapa } from '@/services/links';
import { TAMANHOS, type Tamanho } from '@/services/tamanho';
import { camposDaReferencia, SEM_DATA, type CamposDaReferencia } from '@/services/referencia-temporal';

export type ValoresDaExperiencia = {
  titulo: string;
  local: string;
  observacoes: string;
  referencia: CamposDaReferencia;
  tamanho: Tamanho | null;
  /** Ids das categorias marcadas. */
  categorias: string[];
};

export const valoresVazios = (): ValoresDaExperiencia => ({
  titulo: '',
  local: '',
  observacoes: '',
  referencia: camposDaReferencia(SEM_DATA),
  tamanho: null,
  categorias: [],
});

export const valoresDe = (e: Experiencia): ValoresDaExperiencia => ({
  titulo: e.titulo,
  local: e.local ?? '',
  observacoes: e.observacoes ?? '',
  referencia: camposDaReferencia(e.referencia),
  tamanho: e.tamanho,
  categorias: e.categorias,
});

type CamposDaExperienciaProps = {
  valores: ValoresDaExperiencia;
  erroTitulo?: string;
  erroReferencia?: string;
  onChange: (valores: ValoresDaExperiencia) => void;
  autoFocus?: boolean;
  /** Memória: a referência temporal é obrigatória. */
  exigirData?: boolean;
};

// "Sem tamanho" é uma opção visível: tamanho é opcional e dá para tirar.
const SEM_TAMANHO = 'sem';
const OPCOES_DE_TAMANHO = [{ valor: SEM_TAMANHO, rotulo: 'Sem tamanho' }, ...TAMANHOS];

/**
 * Título (obrigatório), quando, tamanho, categorias, local e observações. Os mesmos ao criar e ao
 * editar, em qualquer estado. Tudo além do título é opcional (ADR 025 e 038).
 */
export function CamposDaExperiencia({
  valores,
  erroTitulo,
  erroReferencia,
  onChange,
  autoFocus,
  exigirData,
}: CamposDaExperienciaProps) {
  return (
    <View style={{ gap: Spacing.three }}>
      <TextField
        label="Título"
        required
        placeholder="Ex.: Ver o nascer do sol juntos"
        value={valores.titulo}
        onChangeText={(titulo) => onChange({ ...valores, titulo })}
        error={erroTitulo}
        maxLength={120}
        autoFocus={autoFocus}
      />
      <ReferenciaTemporalCampo
        campos={valores.referencia}
        erro={erroReferencia}
        obrigatoria={exigirData}
        onChange={(referencia) => onChange({ ...valores, referencia })}
      />
      <View style={{ gap: Spacing.two }}>
        <ThemedText type="smallBold">Tamanho</ThemedText>
        <Opcoes<string>
          rotulo="Tamanho"
          opcoes={OPCOES_DE_TAMANHO}
          atual={valores.tamanho ?? SEM_TAMANHO}
          onChange={(v) => onChange({ ...valores, tamanho: v === SEM_TAMANHO ? null : (v as Tamanho) })}
        />
      </View>
      <Categorias
        marcadas={valores.categorias}
        onChange={(categorias) => onChange({ ...valores, categorias })}
      />
      <TextField
        label="Local"
        placeholder="Ex.: Campos do Jordão"
        value={valores.local}
        onChangeText={(local) => onChange({ ...valores, local })}
        maxLength={120}
        // Pesquisa o texto no Google Maps (ADR 039); sem chave de API, nada fica guardado.
        action={
          valores.local.trim()
            ? { label: 'Abrir no mapa', onPress: () => void Linking.openURL(enderecoNoMapa(valores.local)).catch(() => {}) }
            : undefined
        }
      />
      <TextField
        label="Observações"
        placeholder="Algo que queiram lembrar"
        value={valores.observacoes}
        onChangeText={(observacoes) => onChange({ ...valores, observacoes })}
        maxLength={2000}
        multiline
      />
    </View>
  );
}

/** Marcar várias categorias e criar uma nova, que já entra marcada. */
function Categorias({ marcadas, onChange }: { marcadas: string[]; onChange: (ids: string[]) => void }) {
  const { categorias, criar } = useCategorias();
  const [criando, setCriando] = useState(false);
  const [nome, setNome] = useState('');
  const [erro, setErro] = useState<string>();
  const [salvando, setSalvando] = useState(false);

  async function guardar() {
    setSalvando(true);
    setErro(undefined);
    const r = await criar(nome);
    setSalvando(false);
    if (!r.ok) return setErro(r.mensagem);
    onChange([...marcadas, r.categoria.id]);
    setNome('');
    setCriando(false);
  }

  return (
    <View style={{ gap: Spacing.two }}>
      <ThemedText type="smallBold">Categorias</ThemedText>
      <Grupo rotulo="Categorias" papel="list">
        {categorias.map((c) => {
          const marcada = marcadas.includes(c.id);
          return (
            <Chip
              key={c.id}
              texto={c.nome}
              escolhida={marcada}
              papel="checkbox"
              onPress={() => onChange(marcada ? marcadas.filter((id) => id !== c.id) : [...marcadas, c.id])}
            />
          );
        })}
        {criando ? null : <Chip texto="+ Nova categoria" escolhida={false} papel="checkbox" onPress={() => setCriando(true)} />}
      </Grupo>
      {criando ? null : (
        <View style={{ alignItems: 'flex-start' }}>
          <Button label="Editar categorias" variant="text" onPress={() => router.push('/ajustes')} />
        </View>
      )}
      {criando ? (
        <View style={{ gap: Spacing.two }}>
          <TextField
            label="Nome da categoria"
            placeholder="Ex.: Coisas nerds"
            value={nome}
            onChangeText={(t) => {
              setNome(t);
              setErro(undefined);
            }}
            error={erro}
            maxLength={LIMITE_DO_NOME_DA_CATEGORIA}
            autoFocus
          />
          <Button label="Criar categoria" variant="secondary" loading={salvando} onPress={guardar} />
          <Button label="Cancelar" variant="text" disabled={salvando} onPress={() => setCriando(false)} />
        </View>
      ) : null}
    </View>
  );
}
