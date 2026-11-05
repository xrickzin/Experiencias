import { ligacao, type NoCeu } from '@/components/ceu-de-desejos';

// x em % da largura, y em pontos; o texto de cada estrela fica à direita dela.
const no = (x: number, y: number, texto: NoCeu['texto']): NoCeu => ({ x, y, texto });

describe('o fio do céu contorna os textos', () => {
  it('da esquerda para a direita, passa abaixo do próprio texto e sobe pelo vão', () => {
    const d = ligacao(no(5, 40, { direita: 40, topo: 31, base: 90 }), no(55, 70, { direita: 90, topo: 61, base: 100 }));
    // Corre na altura de baixo do texto (90 + 6), sem passar do vão entre as colunas.
    expect(d).toContain(' 96');
    const xs = [...d.matchAll(/[CLQ ,]\s?(-?[\d.]+) (-?[\d.]+)/g)].map((m) => Number(m[1]));
    expect(Math.max(...xs)).toBeLessThanOrEqual(55);
  });

  it('da direita para a esquerda, corre por cima do título de destino', () => {
    const d = ligacao(no(55, 40, { direita: 90, topo: 31, base: 70 }), no(5, 130, { direita: 40, topo: 121, base: 160 }));
    expect(d).toContain(' 115'); // 121 − 6
  });

  it('na mesma coluna, a curva fica à esquerda das estrelas', () => {
    expect(ligacao(no(5, 40, null), no(6, 130, null))).toBe(' C0.5 40, 0.5 130, 6 130');
  });
});
