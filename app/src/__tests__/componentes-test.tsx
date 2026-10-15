import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { CamposDoDesejo } from '@/components/campos-do-desejo';
import { Confirmacao } from '@/components/confirmacao';
import { TextField } from '@/components/text-field';

describe('TextField', () => {
  it('marca o campo obrigatório com * e avisa o leitor de tela', async () => {
    await render(<TextField label="Título" required value="" onChangeText={() => {}} />);

    expect(screen.getByText('Título *')).toBeTruthy();
    expect(screen.getByLabelText('Título, obrigatório')).toBeTruthy();
  });

  it('campo sem a marca não leva asterisco nem a palavra "opcional"', async () => {
    await render(<TextField label="Local" value="" onChangeText={() => {}} />);

    expect(screen.getByText('Local')).toBeTruthy();
    expect(screen.queryByText(/\*/)).toBeNull();
    expect(screen.queryByText(/opcional/i)).toBeNull();
  });

  it('o estilo recebido se soma ao padrão em vez de substituí-lo', async () => {
    await render(<TextField label="Notas" value="" onChangeText={() => {}} style={{ minHeight: 200 }} />);

    const estilo = StyleSheet.flatten(screen.getByLabelText('Notas').props.style);
    expect(estilo.minHeight).toBe(200);
    expect(estilo.borderWidth).toBeGreaterThan(0);
    expect(estilo.borderRadius).toBeGreaterThan(0);
    expect(estilo.backgroundColor).toBeTruthy();
  });

  it('campo de várias linhas tem borda, altura própria e texto no topo', async () => {
    await render(<TextField label="Observações" multiline value="" onChangeText={() => {}} />);

    const campo = screen.getByLabelText('Observações');
    const estilo = StyleSheet.flatten(campo.props.style);
    expect(campo.props.multiline).toBe(true);
    expect(estilo.minHeight).toBeGreaterThanOrEqual(100);
    expect(estilo.textAlignVertical).toBe('top');
    expect(estilo.borderWidth).toBeGreaterThan(0);
  });

  it('mostra o erro como texto', async () => {
    await render(
      <TextField label="Título" error="Escreva um título para continuar." value="" onChangeText={() => {}} />
    );
    expect(screen.getByText('Escreva um título para continuar.')).toBeTruthy();
  });
});

describe('CamposDoDesejo', () => {
  const vazio = { titulo: '', local: '', observacoes: '' };

  it('título obrigatório, local e observações no mesmo padrão dos demais campos', async () => {
    const onChange = jest.fn();
    await render(<CamposDoDesejo valores={vazio} onChange={onChange} />);

    expect(screen.getByLabelText('Título, obrigatório')).toBeTruthy();
    const observacoes = screen.getByLabelText('Observações');
    expect(observacoes.props.multiline).toBe(true);
    expect(StyleSheet.flatten(observacoes.props.style).borderRadius).toBeGreaterThan(0);

    await fireEvent.changeText(screen.getByLabelText('Local'), 'Praia');
    expect(onChange).toHaveBeenCalledWith({ titulo: '', local: 'Praia', observacoes: '' });
  });

  it('respeita os limites de tamanho do banco', async () => {
    await render(<CamposDoDesejo valores={vazio} onChange={() => {}} />);

    expect(screen.getByLabelText('Título, obrigatório').props.maxLength).toBe(120);
    expect(screen.getByLabelText('Local').props.maxLength).toBe(120);
    expect(screen.getByLabelText('Observações').props.maxLength).toBe(2000);
  });

  it('não repete que algo é opcional', async () => {
    await render(<CamposDoDesejo valores={vazio} onChange={() => {}} />);
    expect(screen.queryByText(/opcional/i)).toBeNull();
  });
});

describe('Confirmacao (pop-up)', () => {
  const onConfirm = jest.fn();
  const onCancel = jest.fn();
  const base = {
    title: 'Excluir este desejo?',
    description: 'Essa ação é definitiva.',
    confirmLabel: 'Sim, excluir desejo',
    onConfirm,
    onCancel,
  };

  beforeEach(() => jest.clearAllMocks());

  it('fechado, não mostra nada', async () => {
    await render(<Confirmacao {...base} visible={false} />);
    expect(screen.queryByText('Excluir este desejo?')).toBeNull();
  });

  it('aberto, mostra o título, o aviso de definitivo e os dois botões', async () => {
    await render(<Confirmacao {...base} visible destructive />);

    expect(screen.getByText('Excluir este desejo?')).toBeTruthy();
    expect(screen.getByText('Essa ação é definitiva.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Sim, excluir desejo' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeTruthy();
  });

  it('confirmar e cancelar chamam cada ação', async () => {
    await render(<Confirmacao {...base} visible />);

    await fireEvent.press(screen.getByRole('button', { name: 'Sim, excluir desejo' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    await fireEvent.press(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('o botão voltar do Android cancela', async () => {
    await render(<Confirmacao {...base} visible />);

    screen.getByTestId('confirmacao').props.onRequestClose();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('enquanto executa, não deixa cancelar nem fechar', async () => {
    await render(<Confirmacao {...base} visible loading />);

    expect(screen.getByTestId('confirmacao').props.onRequestClose).toBeUndefined();
    await fireEvent.press(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Sim, excluir desejo' }).props.accessibilityState.busy).toBe(true);
  });

  it('mostra o erro dentro do pop-up e continua aberto', async () => {
    await render(<Confirmacao {...base} visible error="Não foi possível conectar." />);

    expect(screen.getByText('Não foi possível conectar.')).toBeTruthy();
    expect(screen.getByText('Excluir este desejo?')).toBeTruthy();
  });
});
