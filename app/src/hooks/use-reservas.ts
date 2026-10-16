import { useCallback, useState } from 'react';

import {
  criarReserva,
  editarReserva,
  excluirReserva,
  listarReservas,
  ordenarReservas,
  type CamposDaReserva,
  type Reserva,
} from '@/services/reservas';

/** Reservas de uma experiência, em ordem de dia. Só mudam na lista depois que o servidor confirmou. */
export function useReservas(experienciaId: string) {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [erro, setErro] = useState<string>();
  // Já houve resposta do servidor: antes disso, "nenhuma reserva" ainda não é certo.
  const [carregado, setCarregado] = useState(false);

  const carregar = useCallback(async () => {
    const r = await listarReservas(experienciaId);
    setCarregado(true);
    if (r.ok) {
      setReservas(r.reservas);
      setErro(undefined);
    } else {
      setErro(r.mensagem);
    }
  }, [experienciaId]);

  const criar = useCallback(
    async (campos: CamposDaReserva) => {
      const r = await criarReserva(experienciaId, campos);
      if (r.ok) setReservas((atuais) => ordenarReservas([...atuais, r.reserva]));
      return r;
    },
    [experienciaId]
  );

  const editar = useCallback(async (id: string, campos: CamposDaReserva) => {
    const r = await editarReserva(id, campos);
    if (r.ok) setReservas((atuais) => ordenarReservas(atuais.map((x) => (x.id === id ? r.reserva : x))));
    // A outra pessoa já excluiu: some da lista.
    else if (r.codigo === 'reserva_inexistente') setReservas((atuais) => atuais.filter((x) => x.id !== id));
    return r;
  }, []);

  const excluir = useCallback(async (id: string) => {
    const r = await excluirReserva(id);
    if (r.ok) setReservas((atuais) => atuais.filter((x) => x.id !== id));
    return r;
  }, []);

  return { reservas, erro, carregado, carregar, criar, editar, excluir };
}
