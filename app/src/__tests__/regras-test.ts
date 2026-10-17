import { interpretarLinkDeRecuperacao } from '@/services/link-recuperacao';
import { tamanhoPelasDatas } from '@/services/tamanho';
import {
  validarCodigo,
  validarConfirmacao,
  validarEmail,
  validarNome,
  validarSenha,
} from '@/services/validacao';

describe('link de recuperação', () => {
  it('código válido', () => {
    expect(interpretarLinkDeRecuperacao({ code: 'abc-123_XYZ' })).toEqual({
      tipo: 'codigo',
      codigo: 'abc-123_XYZ',
    });
  });

  it('código e identificador do fluxo', () => {
    expect(interpretarLinkDeRecuperacao({ code: 'abc123', sb_flow_id: 'a1b2c3d4e5f6a7b8' })).toEqual({
      tipo: 'codigo',
      codigo: 'abc123',
      flowId: 'a1b2c3d4e5f6a7b8',
    });
  });

  it('parâmetros repetidos usam o primeiro valor', () => {
    expect(interpretarLinkDeRecuperacao({ code: ['primeiro', 'segundo'] })).toEqual({
      tipo: 'codigo',
      codigo: 'primeiro',
    });
  });

  it('link expirado ou já usado', () => {
    expect(interpretarLinkDeRecuperacao({ error: 'access_denied', error_code: 'otp_expired' })).toEqual({
      tipo: 'invalido',
      motivo: 'expirado',
    });
  });

  it('outro erro do serviço é negado, mesmo trazendo um código', () => {
    expect(interpretarLinkDeRecuperacao({ error: 'server_error', code: 'abc123' })).toEqual({
      tipo: 'invalido',
      motivo: 'negado',
    });
  });

  it('sem código nem erro', () => {
    expect(interpretarLinkDeRecuperacao({})).toEqual({ tipo: 'invalido', motivo: 'ausente' });
  });

  it.each(['', 'a b', '<script>', 'a'.repeat(513), '../../x'])('código fora do formato: %j', (code) => {
    expect(interpretarLinkDeRecuperacao({ code })).toEqual({ tipo: 'invalido', motivo: 'ausente' });
  });

  it('identificador de fluxo fora do formato é descartado', () => {
    expect(interpretarLinkDeRecuperacao({ code: 'abc123', sb_flow_id: '../x' })).toEqual({
      tipo: 'codigo',
      codigo: 'abc123',
    });
  });
});

describe('validações de formulário', () => {
  it('nome', () => {
    expect(validarNome('   ')).toBe('Escreva um nome para continuar.');
    expect(validarNome('a'.repeat(61))).toMatch(/até 60/);
    expect(validarNome(' Ana ')).toBeUndefined();
  });

  it('e-mail', () => {
    expect(validarEmail('')).toBe('Escreva seu e-mail para continuar.');
    expect(validarEmail('ana@exemplo')).toMatch(/incompleto/);
    expect(validarEmail(' ana@exemplo.com ')).toBeUndefined();
  });

  it('senha: mínimo de 8 caracteres', () => {
    expect(validarSenha('')).toBe('Escreva uma senha para continuar.');
    expect(validarSenha('1234567')).toMatch(/pelo menos 8/);
    expect(validarSenha('12345678')).toBeUndefined();
  });

  it('confirmação da senha', () => {
    expect(validarConfirmacao('12345678', '')).toBe('Confirme a senha para continuar.');
    expect(validarConfirmacao('12345678', '12345679')).toBe('As senhas não são iguais.');
    expect(validarConfirmacao('12345678', '12345678')).toBeUndefined();
  });

  it('código do casal: entre 4 e 60 caracteres', () => {
    expect(validarCodigo('  ')).toMatch(/Escreva o código/);
    expect(validarCodigo('abc')).toMatch(/pelo menos 4/);
    expect(validarCodigo('a'.repeat(61))).toMatch(/até 60/);
    expect(validarCodigo('nosso código')).toBeUndefined();
  });
});

describe('duração pelas datas (ADR 038)', () => {
  const periodo = (inicio: string, fim: string) => tamanhoPelasDatas({ precisao: 'periodo', inicio, fim });

  it('um dia só é "Um dia"', () => {
    expect(periodo('2026-12-15', '2026-12-15')).toBe('dia');
  });

  it('2 ou 3 dias entre sexta e segunda, com sábado ou domingo, é fim de semana', () => {
    expect(periodo('2026-12-11', '2026-12-13')).toBe('fim_de_semana'); // sexta a domingo
    expect(periodo('2026-12-12', '2026-12-13')).toBe('fim_de_semana'); // sábado e domingo
    expect(periodo('2026-12-12', '2026-12-14')).toBe('fim_de_semana'); // sábado a segunda
    expect(periodo('2026-12-11', '2026-12-12')).toBe('fim_de_semana'); // sexta e sábado
  });

  it('2 ou 3 dias fora disso são vários dias', () => {
    expect(periodo('2026-12-15', '2026-12-16')).toBe('viagem'); // terça e quarta
    expect(periodo('2026-12-10', '2026-12-12')).toBe('viagem'); // quinta a sábado
    expect(periodo('2026-12-13', '2026-12-15')).toBe('viagem'); // domingo a terça
  });

  it('4 dias ou mais são vários dias, mesmo cruzando o ano', () => {
    expect(periodo('2026-12-30', '2027-01-02')).toBe('viagem');
  });

  it('sem período, as datas não dizem a duração', () => {
    expect(tamanhoPelasDatas({ precisao: 'data', inicio: '2026-12-12', fim: null })).toBeNull();
    expect(tamanhoPelasDatas({ precisao: 'sem_data', inicio: null, fim: null })).toBeNull();
  });
});
