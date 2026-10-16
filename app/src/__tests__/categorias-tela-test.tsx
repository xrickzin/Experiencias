// Gerenciar as categorias em Ajustes (ADR 038): renomear, nome repetido, excluir com confirmação.
import { act, fireEvent, screen } from 'expo-router/testing-library';

import * as categorias from '@/services/categorias';
import * as experiencias from '@/services/experiencias';

import { abrir, esperar } from './apoio/abrir';
import { definirSessao, reiniciarSessao } from './apoio/sessao-falsa';

jest.mock('@/hooks/use-sessao', () => jest.requireActual('./apoio/sessao-falsa').modulo);
jest.mock('@/services/laco');
jest.mock('@/services/experiencias');
jest.mock('@/services/categorias');
jest.mock('expo-font', () => ({ useFonts: () => [true, null] }));

const cat = jest.mocked(categorias);

async function tocar(rotulo: string) {
  await act(async () => {
    await fireEvent.press(screen.getByRole('button', { name: rotulo }));
  });
  await esperar();
}

beforeEach(() => {
  reiniciarSessao();
  jest.resetAllMocks();
  jest.mocked(experiencias.listarExperiencias).mockResolvedValue({ ok: true, experiencias: [] });
  cat.listarCategorias.mockResolvedValue({
    ok: true,
    categorias: [
      { id: 'c1', nome: 'Filme' },
      { id: 'c2', nome: 'Show' },
    ],
  });
  definirSessao({
    estado: 'com-laco',
    usuarioId: 'u1',
    perfil: { membro_id: 'm1', nome: 'Ana', laco_id: 'l1', companheiro_vinculado: true, companheiro_nome: 'Bia' },
  });
});

describe('categorias em Ajustes', () => {
  it('renomear: nome repetido avisa; nome novo aparece na lista', async () => {
    cat.renomearCategoria
      .mockResolvedValueOnce({ ok: false, codigo: 'categoria_repetida', mensagem: 'Já existe uma categoria com esse nome.' })
      .mockResolvedValueOnce({ ok: true, categoria: { id: 'c1', nome: 'Cinema' } });
    await abrir('/ajustes');
    await screen.findByRole('button', { name: 'Editar a categoria Filme' });

    await tocar('Editar a categoria Filme');
    expect(screen.getByLabelText('Nome da categoria').props.value).toBe('Filme');
    await act(async () => {
      await fireEvent.changeText(screen.getByLabelText('Nome da categoria'), 'Show');
    });
    await tocar('Salvar categoria');
    expect(screen.getByText('Já existe uma categoria com esse nome.')).toBeTruthy();

    await act(async () => {
      await fireEvent.changeText(screen.getByLabelText('Nome da categoria'), 'Cinema');
    });
    await tocar('Salvar categoria');
    expect(cat.renomearCategoria).toHaveBeenLastCalledWith('c1', 'Cinema');
    expect(screen.getByRole('button', { name: 'Editar a categoria Cinema' })).toBeTruthy();
  });

  it('excluir pede confirmação, explica o efeito e tira da lista', async () => {
    cat.excluirCategoria.mockResolvedValue({ ok: true });
    await abrir('/ajustes');
    await screen.findByRole('button', { name: 'Editar a categoria Show' });

    await tocar('Editar a categoria Show');
    await tocar('Excluir categoria');
    expect(screen.getByText(/Eles continuam existindo/)).toBeTruthy();
    await tocar('Sim, excluir categoria');

    expect(cat.excluirCategoria).toHaveBeenCalledWith('c2');
    expect(screen.queryByRole('button', { name: 'Editar a categoria Show' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Editar a categoria Filme' })).toBeTruthy();
  });
});
