/**
 * Audios grabados (public/audio, generados con ElevenLabs). archivos.json dice cuál corresponde a cada
 * texto, efecto y tema. Si falta uno o no carga, el juego usa la voz del navegador y el sonido por código.
 */
import archivos from "./archivos.json";
import type { Idioma } from "../game/i18n";

export interface Archivos {
  voz: Record<Idioma, Record<string, string>>;
  musica: Record<string, string>;
  efectos: Record<string, string>;
}

export const ARCHIVOS: Archivos = archivos;

export const rutaDe = (archivo: string) => `/audio/${archivo}`;

/** El audio de un texto exacto en un idioma, o null si no se grabó. */
export function grabacionDe(texto: string, idioma: Idioma, lista: Archivos = ARCHIVOS): string | null {
  return Object.hasOwn(lista.voz[idioma], texto) ? lista.voz[idioma][texto]! : null;
}

export type Cargar = (ruta: string) => Promise<ArrayBuffer>;

/** Descarga y decodifica cada archivo una sola vez. */
export function crearAlmacen(ctx: BaseAudioContext, cargar: Cargar) {
  const listos = new Map<string, AudioBuffer>();
  const pendientes = new Map<string, Promise<AudioBuffer | null>>();
  return {
    /** Lo que ya está en memoria, o null. */
    ya: (archivo: string): AudioBuffer | null => listos.get(archivo) ?? null,
    pedir(archivo: string): Promise<AudioBuffer | null> {
      let pedido = pendientes.get(archivo);
      if (!pedido) {
        pedido = cargar(rutaDe(archivo))
          .then((datos) => ctx.decodeAudioData(datos))
          .then((audio) => { listos.set(archivo, audio); return audio; })
          .catch(() => { pendientes.delete(archivo); return null; });
        pendientes.set(archivo, pedido);
      }
      return pedido;
    },
  };
}

export type Almacen = ReturnType<typeof crearAlmacen>;
