/**
 * Fuentes de NASA fuera de la lista oficial del reto, aprobadas por Daniel el 2026-11-14 (#91, #93).
 * Cada una respalda UNA afirmación de las tarjetas de Jezero o de los expertos; qué dice exactamente
 * cada fuente está en docs/science/tarjetas-mision1.md. Son páginas de noticias: dato estático, nunca "en vivo".
 */
import type { SourceCard } from "./contrato";

const CONSULTADO = "2026-11-14";

export const FUENTES_APROBADAS = {
  /** InSight se quedó sin energía por el polvo en sus paneles (dic 2022). Tarjeta `panel_polvo` y escena del polvo. */
  insight: {
    nombreKey: "fuente.jpl.insight",
    url: "https://www.jpl.nasa.gov/news/nasa-retires-insight-mars-lander-mission-after-years-of-science/",
    idFuente: "jpl-2022-12-21-insight",
    consultadoEl: CONSULTADO,
    dueno: "NASA JPL",
    estadoDato: "curado",
  },
  /** La Estación recupera el 98 % del agua (jun 2023). Tarjeta `agua_reciclada`. */
  aguaIss: {
    nombreKey: "fuente.nasa.agua",
    url: "https://www.nasa.gov/missions/station/iss-research/nasa-achieves-water-recovery-milestone-on-international-space-station/",
    idFuente: "nasa-2023-06-20-eclss-agua",
    consultadoEl: CONSULTADO,
    dueno: "NASA",
    estadoDato: "curado",
  },
  /** Las partículas de una tormenta de radiación solar pueden cambiar un bit en un chip (jul 2024). Pregunta final. */
  bitFlip: {
    nombreKey: "fuente.nasa.bitflip",
    url: "https://www.earthdata.nasa.gov/news/feature-articles/its-always-sunny-space-thats-problem-satellite-teams",
    idFuente: "earthdata-2024-07-02-bit-flip",
    consultadoEl: CONSULTADO,
    dueno: "NASA Earthdata",
    estadoDato: "curado",
  },
} as const satisfies Record<string, SourceCard>;

export type IdFuenteAprobada = keyof typeof FUENTES_APROBADAS;

/** SourceCard lista para agentes o ui. Uso: escenaPolvo(vista, { insight: fuenteAprobada("insight") }). */
export function fuenteAprobada(id: IdFuenteAprobada): SourceCard {
  return { ...FUENTES_APROBADAS[id] };
}
