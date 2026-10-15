import { sair } from '@/services/laco';

const mockSignOut = jest.fn();
const mockApagarSessaoLocal = jest.fn(async () => {});

jest.mock('@/services/supabase', () => ({
  supabase: { auth: { signOut: (...args: unknown[]) => mockSignOut(...args) } },
  apagarSessaoLocal: () => mockApagarSessaoLocal(),
}));

beforeEach(() => {
  jest.useFakeTimers();
  mockSignOut.mockReset();
  mockApagarSessaoLocal.mockClear();
});

afterEach(() => jest.useRealTimers());

describe('sair (serviço)', () => {
  it('com o servidor respondendo, usa só o signOut', async () => {
    mockSignOut.mockResolvedValue({ error: null });
    await sair();
    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(mockApagarSessaoLocal).not.toHaveBeenCalled();
  });

  it('se o signOut falhar, apaga a sessão deste aparelho', async () => {
    mockSignOut.mockRejectedValue(new Error('sem rede'));
    await sair();
    expect(mockApagarSessaoLocal).toHaveBeenCalledTimes(1);
  });

  it('se o signOut travar, apaga a sessão deste aparelho depois do limite', async () => {
    mockSignOut.mockReturnValue(new Promise(() => {}));
    const saida = sair();
    await jest.advanceTimersByTimeAsync(5000);
    await saida;
    expect(mockApagarSessaoLocal).toHaveBeenCalledTimes(1);
  });
});
