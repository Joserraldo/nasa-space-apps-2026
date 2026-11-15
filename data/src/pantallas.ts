/**
 * Funciones puras para que ui pinte las pantallas con un `.map` y su `t()`, sin lógica de datos.
 * Las claves son i18n (inglés base, español segundo). Ver data/README.md, sección "Para ui".
 */
import type { SourceCard } from "./contrato";
import { DATOS_USADOS_KEYS, tarjetaTormenta, type TarjetaFuente } from "./tarjeta";
import { tarjetasCsa, tarjetasOsdr, tormentasCuradas } from "./index";

/** "Qué datos de NASA usamos y por qué": título + una línea por dataset. */
export function datosUsados(): { tituloKey: string; lineas: { clave: string }[] } {
  const [tituloKey, ...resto] = DATOS_USADOS_KEYS;
  return { tituloKey, lineas: resto.map((clave) => ({ clave })) };
}

export interface TarjetaCienciaFinal {
  id: string;
  tituloKey: string;
  textoKey: string;
  fuente: SourceCard;
  /** Solo CSA: "© Canadian Space Agency" (obligatorio mostrarlo). */
  creditoKey?: string;
}

/** Tarjetas de ciencia (OSDR primero, luego CSA, en el orden de los JSON). `temas` filtra; `max` recorta. */
export function tarjetasCienciaFinal(opciones: { temas?: string[]; max?: number } = {}): TarjetaCienciaFinal[] {
  const osdr: TarjetaCienciaFinal[] = tarjetasOsdr.tarjetas.map((c) => ({
    id: c.id,
    tema: c.tema,
    tituloKey: c.tituloKey,
    textoKey: c.textoKey,
    fuente: { nombreKey: "fuente.osdr", url: c.url, idFuente: c.id, consultadoEl: c.consultadoEl ?? tarjetasOsdr.consultadoEl, dueno: c.dueno, estadoDato: "curado" as const },
  })) as (TarjetaCienciaFinal & { tema: string })[];
  const csa = tarjetasCsa.tarjetas.map((c) => ({
    id: c.id,
    tema: c.tema,
    tituloKey: c.tituloKey,
    textoKey: c.textoKey,
    fuente: { nombreKey: "fuente.csa", url: c.url, idFuente: c.id, consultadoEl: tarjetasCsa.consultadoEl, dueno: tarjetasCsa.dueno, estadoDato: "curado" as const },
    creditoKey: "datos.credito.csa",
  }));
  let todas = [...osdr, ...csa] as (TarjetaCienciaFinal & { tema: string })[];
  if (opciones.temas) todas = todas.filter((c) => opciones.temas!.includes(c.tema));
  if (opciones.max !== undefined) todas = todas.slice(0, Math.max(0, opciones.max));
  return todas.map(({ tema: _tema, ...resto }) => resto);
}

/** Tarjeta de fuente de una tormenta curada por id (estado.tormenta.id), o null si no existe. */
export function tarjetaTormentaPorEvento(eventoId: string): TarjetaFuente | null {
  const t = tormentasCuradas.find((x) => x.id === eventoId);
  return t ? tarjetaTormenta(t) : null;
}
