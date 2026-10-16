import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { ExperienciasProvider, useExperiencias } from '@/hooks/use-experiencias';
import * as servico from '@/services/experiencias';
import * as fotos from '@/services/fotos';
import type { Experiencia } from '@/services/experiencias';

import { experiencia } from './apoio/experiencia';
import { definirSessao, reiniciarSessao } from './apoio/sessao-falsa';

jest.mock('@/hooks/use-sessao', () => jest.requireActual('./apoio/sessao-falsa').modulo);
jest.mock('@/services/experiencias');
jest.mock('@/services/fotos');
jest.mock('expo-image-picker');

const mock = jest.mocked(servico);

const desejo = (id: string, titulo: string) => experiencia(id, titulo);

const perfil = (lacoId: string) => ({
  membro_id: 'm1',
  nome: 'Ana',
  laco_id: lacoId,
  companheiro_vinculado: true,
  companheiro_nome: 'Bia',
});

const envolver = ({ children }: { children: ReactNode }) => <ExperienciasProvider>{children}</ExperienciasProvider>;

async function montar() {
  const montado = await renderHook(() => useExperiencias(), { wrapper: envolver });
  await waitFor(() => expect(montado.result.current).not.toBeNull());
  return montado;
}

beforeEach(() => {
  reiniciarSessao();
  jest.resetAllMocks();
  jest.mocked(fotos.listarFotos).mockResolvedValue({ ok: true, fotos: [] });
  jest.mocked(fotos.removerFotosDaExperiencia).mockResolvedValue({ ok: true });
  definirSessao({ estado: 'com-laco', usuarioId: 'u1', perfil: perfil('laco-1') });
});

describe('use-experiencias', () => {
  it('começa carregando e passa a mostrar o que o servidor devolveu', async () => {
    mock.listarExperiencias.mockResolvedValue({ ok: true, experiencias: [desejo('1', 'A')] });
    const { result } = await montar();

    expect(result.current.carregando).toBe(true);
    await act(async () => {
      await result.current.recarregar();
    });

    expect(result.current.carregando).toBe(false);
    expect(result.current.desejos.map((d) => d.titulo)).toEqual(['A']);
    expect(result.current.erro).toBeUndefined();
  });

  it('chamadas simultâneas viram uma só ida ao servidor', async () => {
    let liberar: (v: { ok: true; experiencias: Experiencia[] }) => void = () => {};
    mock.listarExperiencias.mockReturnValue(new Promise((ok) => (liberar = ok)));
    const { result } = await montar();

    await act(async () => {
      const a = result.current.recarregar();
      const b = result.current.recarregar();
      liberar({ ok: true, experiencias: [] });
      await Promise.all([a, b]);
    });

    expect(mock.listarExperiencias).toHaveBeenCalledTimes(1);
  });

  it('falha ao carregar guarda a mensagem; uma carga boa a limpa', async () => {
    mock.listarExperiencias
      .mockResolvedValueOnce({ ok: false, codigo: 'rede', mensagem: 'Sem conexão.' })
      .mockResolvedValueOnce({ ok: true, experiencias: [desejo('1', 'A')] });
    const { result } = await montar();

    await act(async () => {
      await result.current.recarregar();
    });
    expect(result.current.erro).toBe('Sem conexão.');
    expect(result.current.desejos).toEqual([]);

    await act(async () => {
      await result.current.recarregar();
    });
    expect(result.current.erro).toBeUndefined();
    expect(result.current.desejos).toHaveLength(1);
  });

  it('criar coloca o desejo no topo só se o servidor confirmou', async () => {
    mock.listarExperiencias.mockResolvedValue({ ok: true, experiencias: [desejo('1', 'A')] });
    const { result } = await montar();
    await act(async () => {
      await result.current.recarregar();
    });

    mock.criarDesejo.mockResolvedValueOnce({ ok: false, codigo: 'rede', mensagem: 'Sem conexão.' });
    await act(async () => {
      await result.current.adicionarDesejo({ titulo: 'B' });
    });
    expect(result.current.desejos.map((d) => d.titulo)).toEqual(['A']);

    mock.criarDesejo.mockResolvedValueOnce({ ok: true, desejo: desejo('2', 'B') });
    await act(async () => {
      await result.current.adicionarDesejo({ titulo: 'B' });
    });
    expect(result.current.desejos.map((d) => d.titulo)).toEqual(['B', 'A']);
  });

  it('editar troca o desejo; se a outra pessoa excluiu, ele sai da lista', async () => {
    mock.listarExperiencias.mockResolvedValue({ ok: true, experiencias: [desejo('1', 'A'), desejo('2', 'B')] });
    const { result } = await montar();
    await act(async () => {
      await result.current.recarregar();
    });

    mock.atualizarExperiencia.mockResolvedValueOnce({ ok: true, experiencia: desejo('1', 'A2') });
    await act(async () => {
      await result.current.atualizarExperiencia('1', { titulo: 'A2' });
    });
    expect(result.current.desejos.map((d) => d.titulo)).toEqual(['A2', 'B']);

    mock.atualizarExperiencia.mockResolvedValueOnce({
      ok: false,
      codigo: 'desejo_inexistente',
      mensagem: 'Esse desejo não existe mais.',
    });
    await act(async () => {
      await result.current.atualizarExperiencia('2', { titulo: 'B2' });
    });
    expect(result.current.desejos.map((d) => d.id)).toEqual(['1']);
  });

  it('excluir tira da lista só com a confirmação do servidor', async () => {
    mock.listarExperiencias.mockResolvedValue({ ok: true, experiencias: [desejo('1', 'A')] });
    const { result } = await montar();
    await act(async () => {
      await result.current.recarregar();
    });

    mock.excluirExperiencia.mockResolvedValueOnce({ ok: false, codigo: 'rede', mensagem: 'Sem conexão.' });
    await act(async () => {
      await result.current.excluirExperiencia('1');
    });
    expect(result.current.desejos).toHaveLength(1);

    mock.excluirExperiencia.mockResolvedValueOnce({ ok: true });
    await act(async () => {
      await result.current.excluirExperiencia('1');
    });
    expect(result.current.desejos).toHaveLength(0);
  });

  it('ao trocar de conta (outro Laço), não mostra os desejos da anterior', async () => {
    mock.listarExperiencias.mockResolvedValue({ ok: true, experiencias: [desejo('1', 'Da Ana')] });
    const { result } = await montar();
    await act(async () => {
      await result.current.recarregar();
    });
    expect(result.current.desejos).toHaveLength(1);

    mock.listarExperiencias.mockResolvedValue({ ok: true, experiencias: [] });
    await act(async () => {
      definirSessao({ perfil: perfil('laco-2') });
    });

    expect(result.current.desejos).toEqual([]);
    expect(result.current.carregando).toBe(true);
    await act(async () => {
      await result.current.recarregar();
    });
    await waitFor(() => expect(result.current.carregando).toBe(false));
    expect(result.current.desejos).toEqual([]);
  });

  it('sem Laço, não consulta o servidor', async () => {
    definirSessao({ estado: 'sem-sessao', usuarioId: null, perfil: null });
    const { result } = await montar();

    await act(async () => {
      await result.current.recarregar();
    });

    expect(mock.listarExperiencias).not.toHaveBeenCalled();
    expect(result.current.carregando).toBe(false);
  });
});
