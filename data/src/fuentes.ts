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
  /** Ficha de la Luna: irradiancia 1361,0 W/m², periodo sinódico 29,53 días, distancia media 384 400 km. Tarjetas lunares de luz, noche y mensajes. */
  nssdcMoon: {
    nombreKey: "fuente.nssdcMoon",
    url: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html",
    idFuente: "nssdc-moonfact",
    consultadoEl: CONSULTADO,
    dueno: "NASA NSSDC",
    estadoDato: "curado",
  },
  /** Hielo de agua en regiones lunares en sombra permanente. Tarjeta `hielo_sombra`. */
  hieloLuna: {
    nombreKey: "fuente.nasa.hieloLuna",
    url: "https://science.nasa.gov/moon/moon-water-and-ices/",
    idFuente: "nasa-science-moon-water-ices",
    consultadoEl: CONSULTADO,
    dueno: "NASA Science",
    estadoDato: "curado",
  },
  /** Orion usa la masa a bordo (bolsas con comida y agua) como refugio en una tormenta solar. Tarjeta `masa_protege`. */
  orionRefugio: {
    nombreKey: "fuente.nasa.orionRefugio",
    url: "https://www.nasa.gov/missions/artemis/orion/scientists-and-engineers-evaluate-orion-radiation-protection-plan/",
    idFuente: "nasa-orion-refugio-radiacion",
    consultadoEl: CONSULTADO,
    dueno: "NASA",
    estadoDato: "curado",
  },
  /** Orion se alimenta de cuatro alas de paneles solares. Tarjeta `panel_sol` de outpost-sorpresa. */
  orionPaneles: {
    nombreKey: "fuente.nasa.orionPaneles",
    url: "https://www.nasa.gov/humans-in-space/orion-spacecraft/european-service-module/",
    idFuente: "nasa-orion-esm-paneles",
    consultadoEl: CONSULTADO,
    dueno: "NASA",
    estadoDato: "curado",
  },
  /** El casquete residual del polo norte de Marte es sobre todo hielo de agua (PIA06858). Tarjeta `hielo_de_agua`. */
  casqueteMarte: {
    nombreKey: "fuente.jpl.casqueteMarte",
    url: "https://www.jpl.nasa.gov/images/pia06858-north-polar-cap/",
    idFuente: "jpl-pia06858-casquete-norte",
    consultadoEl: CONSULTADO,
    dueno: "NASA JPL",
    estadoDato: "curado",
  },
  /** En invierno el Sol aparece bajo y inclinar los paneles hacia él sube la energía (Spirit). Tarjeta `sol_bajo`. */
  spiritInclinacion: {
    nombreKey: "fuente.jpl.spiritInclinacion",
    url: "https://www.jpl.nasa.gov/news/nasa-mars-rover-teams-tilted-winter-strategy-works/",
    idFuente: "jpl-spirit-inclinacion-invierno",
    consultadoEl: CONSULTADO,
    dueno: "NASA JPL",
    estadoDato: "curado",
  },
  /** Phoenix cargaba sus baterías con paneles solares; en invierno polar ya no pudo (2008). Tarjeta `guardar_energia`. */
  phoenix: {
    nombreKey: "fuente.nasa.phoenix",
    url: "https://www.nasa.gov/image-article/phoenix-twilight/",
    idFuente: "nasa-phoenix-twilight",
    consultadoEl: CONSULTADO,
    dueno: "NASA",
    estadoDato: "curado",
  },
} as const satisfies Record<string, SourceCard>;

export type IdFuenteAprobada = keyof typeof FUENTES_APROBADAS;

/** SourceCard lista para agentes o ui. Uso: escenaPolvo(vista, { insight: fuenteAprobada("insight") }). */
export function fuenteAprobada(id: IdFuenteAprobada): SourceCard {
  return { ...FUENTES_APROBADAS[id] };
}
