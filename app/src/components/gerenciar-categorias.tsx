import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button } from '@/components/button';
import { Confirmacao } from '@/components/confirmacao';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useCategorias } from '@/hooks/use-categorias';
import { useTheme } from '@/hooks/use-theme';
import { LIMITE_DO_NOME_DA_CATEGORIA, type Categoria } from '@/services/categorias';

/**
 * As categorias do Laço em Ajustes (ADR 038): tocar numa abre para renomear ou excluir. Excluir
 * tira a categoria dos desejos e experiências, que continuam existindo. Os dois podem.
 */
export function GerenciarCategorias() {
  const theme = useTheme();
  const { categorias, renomear, excluir } = useCategorias();
  const [aberta, setAberta] = useState<Categoria | null>(null);

  return (
    <View style={{ gap: Spacing.two }}>
      <ThemedText type="subtitle" accessibilityRole="header" style={{ fontSize: 22, lineHeight: 30 }}>
        Categorias
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Toque numa categoria para mudar o nome ou excluir. Valem para os dois.
      </ThemedText>
      <View style={{ borderTopWidth: 1, borderTopColor: theme.border }}>
        {categorias.map((c) =>
          aberta?.id === c.id ? (
            <Edicao
              key={c.id}
              categoria={c}
              onRenomear={renomear}
              onExcluir={excluir}
              onFechar={() => setAberta(null)}
            />
          ) : (
            <Pressable
              key={c.id}
              accessibilityRole="button"
              accessibilityLabel={`Editar a categoria ${c.nome}`}
              onPress={() => setAberta(c)}
              style={({ pressed }) => ({
                minHeight: 52,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottomWidth: 1,
                borderBottomColor: theme.border,
                backgroundColor: pressed ? theme.backgroundSelected : 'transparent',
              })}>
              <ThemedText>{c.nome}</ThemedText>
              <ThemedText themeColor="textSecondary">›</ThemedText>
            </Pressable>
          )
        )}
      </View>
    </View>
  );
}

type EdicaoProps = {
  categoria: Categoria;
  onRenomear: (id: string, nome: string) => Promise<{ ok: boolean; mensagem?: string }>;
  onExcluir: (id: string) => Promise<{ ok: boolean; mensagem?: string }>;
  onFechar: () => void;
};

function Edicao({ categoria, onRenomear, onExcluir, onFechar }: EdicaoProps) {
  const theme = useTheme();
  const [nome, setNome] = useState(categoria.nome);
  const [erro, setErro] = useState<string>();
  const [salvando, setSalvando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erroExclusao, setErroExclusao] = useState<string>();

  async function guardar() {
    setSalvando(true);
    setErro(undefined);
    const r = await onRenomear(categoria.id, nome);
    setSalvando(false);
    if (r.ok) onFechar();
    else setErro(r.mensagem);
  }

  async function excluir() {
    setExcluindo(true);
    setErroExclusao(undefined);
    const r = await onExcluir(categoria.id);
    setExcluindo(false);
    if (r.ok) {
      setConfirmando(false);
      onFechar();
    } else {
      setErroExclusao(r.mensagem);
    }
  }

  return (
    <View style={{ gap: Spacing.two, paddingVertical: Spacing.three, borderBottomWidth: 1, borderBottomColor: theme.border }}>
      <TextField
        label="Nome da categoria"
        value={nome}
        onChangeText={(t) => {
          setNome(t);
          setErro(undefined);
        }}
        error={erro}
        maxLength={LIMITE_DO_NOME_DA_CATEGORIA}
        autoFocus
      />
      <Button label="Salvar categoria" loading={salvando} disabled={excluindo} onPress={guardar} />
      <Button
        label="Excluir categoria"
        variant="destructive"
        disabled={salvando}
        onPress={() => {
          setErroExclusao(undefined);
          setConfirmando(true);
        }}
      />
      <Button label="Cancelar" variant="text" disabled={salvando} onPress={onFechar} />
      <Confirmacao
        visible={confirmando}
        title={`Excluir a categoria ${categoria.nome}?`}
        description="Ela sai dos desejos e das experiências que a usam, para os dois. Eles continuam existindo."
        confirmLabel="Sim, excluir categoria"
        destructive
        loading={excluindo}
        error={erroExclusao}
        onConfirm={excluir}
        onCancel={() => setConfirmando(false)}
      />
    </View>
  );
}
