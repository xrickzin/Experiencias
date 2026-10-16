import type { ColorValue } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

/**
 * Ícones próprios do Laço (visual-direction.md): grade de 24, traço fino de 1,75, pontas e cantos
 * arredondados, no mesmo gesto do fio. Sem preenchimento; a cor vem de quem usa.
 */
export type NomeDoIcone = 'inicio' | 'desejos' | 'historia' | 'voltar' | 'ajustes';

const TRACOS: Record<NomeDoIcone, string[]> = {
  // Casa: telhado, paredes e porta.
  inicio: ['M3.5 11 L12 4 L20.5 11', 'M6 9.5 V20 H18 V9.5', 'M10 20 V15 H14 V20'],
  // Estrela: um pedido.
  desejos: ['M12 3.6 L14.29 9.44 L20.56 9.82 L15.71 13.81 L17.29 19.88 L12 16.5 L6.71 19.88 L8.29 13.81 L3.44 9.82 L9.71 9.44 Z'],
  // Álbum aberto, com uma foto na página da direita.
  historia: [
    'M12 6.5 C10 5 6.5 4.5 3.5 5 V18.5 C6.5 18 10 18.5 12 20 C14 18.5 17.5 18 20.5 18.5 V5 C17.5 4.5 14 5 12 6.5 Z',
    'M12 6.5 V20',
    'M14.5 9 H18 V12.5 H14.5 Z',
  ],
  voltar: ['M19 12 H5', 'M11 6 L5 12 L11 18'],
  // Ajustes: dois controles deslizantes.
  ajustes: ['M4 7 H7', 'M11 7 H20', 'M4 17 H13', 'M17 17 H20'],
};

// Os botões dos controles de Ajustes são círculos, não traços.
const CIRCULOS: Partial<Record<NomeDoIcone, { cx: number; cy: number }[]>> = {
  ajustes: [
    { cx: 9, cy: 7 },
    { cx: 15, cy: 17 },
  ],
};

/** Os traços do ícone, para compor dentro de outro desenho (ex.: o laço da aba). */
export function TracosDoIcone({ nome, cor }: { nome: NomeDoIcone; cor: ColorValue }) {
  return (
    <>
      {TRACOS[nome].map((d) => (
        <Path key={d} d={d} stroke={cor} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      ))}
      {(CIRCULOS[nome] ?? []).map(({ cx, cy }) => (
        <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={2} stroke={cor} strokeWidth={1.75} fill="none" />
      ))}
    </>
  );
}

/** Ícone decorativo: o rótulo fica no botão que o contém. */
export function Icone({ nome, cor, tamanho = 24 }: { nome: NomeDoIcone; cor: ColorValue; tamanho?: number }) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24" accessible={false} importantForAccessibility="no-hide-descendants">
      <TracosDoIcone nome={nome} cor={cor} />
    </Svg>
  );
}
