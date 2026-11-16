import type { GameState } from '@solar-shield/contracts';
import { clasificarConAtajos } from './atajos.js';
import { pedidoAlModelo, turno, validarClasificacion, type EntradaConversacion, type MemoriaConversacion, type OpcionesTurno, type RespuestaConversacion } from './conversacion.js';

export interface OpcionesConversacionRed extends Omit<OpcionesTurno, 'clasificacion'> {
  fetch?: typeof fetch;
  /** Endpoint propio del juego, nunca la API del proveedor ni una clave. */
  endpoint?: string;
  timeoutMs?: number;
}

/** Texto y transcripción comparten el camino. No recibe ni almacena audio. Sin red quedan los botones. */
export async function conversarConRed(entrada: EntradaConversacion, estado: GameState, memoria: MemoriaConversacion, o: OpcionesConversacionRed): Promise<RespuestaConversacion> {
  const pedido = pedidoAlModelo(entrada);
  if (!pedido || clasificarConAtajos(pedido.texto)) return turno(entrada, estado, memoria, o);
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), o.timeoutMs ?? 3500);
  try {
    const r = await (o.fetch ?? fetch)(o.endpoint ?? '/api/clasificar', {
      method: 'POST', headers: {'content-type':'application/json'},
      body: JSON.stringify(pedido), signal: ctl.signal,
    });
    if (!r.ok) return turno(entrada, estado, memoria, o);
    const clasificacion = validarClasificacion(await r.json());
    return turno(entrada, estado, memoria, {...o, clasificacion});
  } catch {
    return turno(entrada, estado, memoria, o);
  } finally {
    clearTimeout(timer);
  }
}
