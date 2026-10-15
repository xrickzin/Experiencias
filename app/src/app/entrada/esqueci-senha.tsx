import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/button';
import { MensagemErro } from '@/components/mensagem-erro';
import { Screen } from '@/components/screen';
import { ScreenHeader } from '@/components/screen-header';
import { TextField } from '@/components/text-field';
import { Spacing } from '@/constants/theme';
import { solicitarRecuperacaoDeSenha } from '@/services/laco';
import { validarEmail } from '@/services/validacao';

// O Supabase só aceita um novo pedido por e-mail a cada 60 segundos.
const ESPERA_ENTRE_PEDIDOS = 60;

export default function EsqueciSenha() {
  const { email: emailInicial } = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(typeof emailInicial === 'string' ? emailInicial : '');
  const [erro, setErro] = useState<string>();
  const [erroGeral, setErroGeral] = useState<string>();
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [espera, setEspera] = useState(0);

  useEffect(() => {
    if (espera <= 0) return;
    const tempo = setTimeout(() => setEspera((atual) => atual - 1), 1000);
    return () => clearTimeout(tempo);
  }, [espera]);

  async function enviar() {
    const invalido = validarEmail(email);
    if (invalido) return setErro(invalido);
    setEnviando(true);
    setErroGeral(undefined);
    const r = await solicitarRecuperacaoDeSenha(email);
    setEnviando(false);
    if (r.ok) {
      setEnviado(true);
      setEspera(ESPERA_ENTRE_PEDIDOS);
    } else {
      setErroGeral(r.mensagem);
    }
  }

  if (enviado) {
    return (
      <Screen edges={['top', 'bottom']}>
        <ScreenHeader
          eyebrow="Recuperar acesso"
          title="Confira seu e-mail."
          description={`Se existir uma conta com ${email.trim()}, enviamos um link para criar uma nova senha. Abra o e-mail neste aparelho e toque no link; ele vale por pouco tempo. Se pedir de novo, use só o e-mail mais recente.`}
        />
        <View style={{ gap: Spacing.three }}>
          {erroGeral ? <MensagemErro>{erroGeral}</MensagemErro> : null}
          <Button
            label={espera > 0 ? `Enviar de novo em ${espera} s` : 'Enviar de novo'}
            variant="secondary"
            loading={enviando}
            disabled={espera > 0}
            onPress={enviar}
          />
          <Button label="Voltar para a entrada" variant="text" onPress={() => router.replace('/entrada')} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <ScreenHeader
        eyebrow="Recuperar acesso"
        title="Vamos criar uma nova senha."
        description="Informe o e-mail da sua conta. Se ele estiver cadastrado, você recebe um link para escolher outra senha."
      />
      <View style={{ gap: Spacing.three }}>
        <TextField
          label="E-mail"
          value={email}
          onChangeText={(v) => {
            setEmail(v);
            if (erro) setErro(undefined);
            if (erroGeral) setErroGeral(undefined);
          }}
          error={erro}
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          placeholder="seuemail@email.com"
          returnKeyType="done"
          onSubmitEditing={enviar}
        />
        {erroGeral ? <MensagemErro>{erroGeral}</MensagemErro> : null}
      </View>
      <View style={{ gap: Spacing.two, marginTop: Spacing.four }}>
        <Button label="Enviar link" loading={enviando} onPress={enviar} />
        <Button label="Voltar" variant="text" disabled={enviando} onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
