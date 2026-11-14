/**
 * Punto de entrada de @solar-shield/data. Los consumidores (motor, agentes, ui) usan:
 *   import { tormentasMock, eventosMock, aConvenio } from "@solar-shield/data";
 * Los textos visibles están en data/i18n/{es,en}.json (claves `fuente.*` y `datos.*`).
 */
import fuerte from "../mock/mock-tormenta-fuerte.json";
import soloFlr from "../mock/mock-solo-fulguracion.json";
import marte from "../mock/mock-tormenta-marte.json";
import c_2024_05_20_marte from "../curated/2024-05-20-marte.json";
import c_2024_05_11_x58 from "../curated/2024-05-11-x58.json";
import c_2024_05_10_gannon from "../curated/2024-05-10-gannon.json";
import c_2024_05_14_x87 from "../curated/2024-05-14-x87.json";
import c_2024_10_03_x90 from "../curated/2024-10-03-x90.json";
import c_2024_10_10_g4 from "../curated/2024-10-10-g4.json";
import c_2017_09_06_x93 from "../curated/2017-09-06-x93.json";
import c_2017_09_10_x82 from "../curated/2017-09-10-x82.json";
import indiceCurado from "../curated/index.json";
import jezeroJson from "../terreno/jezero/jezero.json";
import radiacionJson from "../ciencia/radiacion.json";
import osdrJson from "../ciencia/osdr.json";
import artemisJson from "../ciencia/artemis.json";
import { ArtemisSchema, FUENTE_DOSIS, OsdrSchema, RadiacionSchema, type Artemis, type Osdr, type Radiacion } from "./ciencia";
import type { SourceCard } from "./contrato";
import { TerrenoSchema, type Terreno } from "./terreno";
import { aConvenio } from "./convenio";
import { TormentaSchema, type Tormenta } from "./tormenta";

export * from "./contrato";
export * from "./tormenta";
export * from "./intensidad";
export * from "./terreno";
export * from "./radlab";
export * from "./ciencia";
export * from "./region";
export { aConvenio, magnitud } from "./convenio";

/** Mocks validados al cargarse: si alguien rompe un JSON, falla aquí y no en la pantalla. */
export const tormentasMock: Tormenta[] = [fuerte, soloFlr, marte].map((t) => TormentaSchema.parse(t));
export const eventosMock = tormentasMock.map(aConvenio);

/** Tormentas reales curadas de DONKI (no en vivo), en el orden fijo de curated/index.json. */
export const tormentasCuradas: Tormenta[] = [c_2024_05_20_marte, c_2024_05_11_x58, c_2024_05_10_gannon, c_2024_05_14_x87, c_2024_10_03_x90, c_2024_10_10_g4, c_2017_09_06_x93, c_2017_09_10_x82].map((t) => TormentaSchema.parse(t));
export const eventosCurados = tormentasCuradas.map(aConvenio);
/** Tormenta fija de la semilla dorada (demo y e2e). */
export const ID_RUTA_DORADA: string = indiceCurado.rutaDorada;
export const eventoRutaDorada = eventosCurados.find((e) => e.id === ID_RUTA_DORADA)!;

/**
 * Jezero (Mars Trek). Las rutas de `dem.archivo` e `imagenes` son relativas a data/terreno/jezero/:
 * la UI las sirve como estáticos. Elevación = medida; pendiente, luz y blindaje = derivados.
 */
export const terrenoJezero: Terreno = TerrenoSchema.parse(jezeroJson);

/** Dosis de referencia (mSv/día, dosis equivalente) con cita completa. */
export const radiacion: Radiacion = RadiacionSchema.parse(radiacionJson);
/** Tarjetas de ciencia con ID real de estudio de OSDR. */
export const tarjetasOsdr: Osdr = OsdrSchema.parse(osdrJson);

/** Artemis I: dosis absorbida dentro de Orion (HERA, vía RadLab). µGy/h, nunca mSv. */
export const artemis: Artemis = ArtemisSchema.parse(artemisJson);

/**
 * Referencia de dosis lista para agentes (ReferenciaDosis): valor en mSv/día + SourceCard del contrato.
 * Uso: responder(salida, vista, { dosisMarte: referenciaDosis("marte-superficie") }).
 */
export function referenciaDosis(id: string): { valor: number; unidad: "mSv/día"; fuente: SourceCard } {
  const r = radiacion.referencias.find((x) => x.id === id);
  if (!r) throw new Error(`referencia de dosis desconocida: ${id}`);
  const nombreKey = FUENTE_DOSIS[r.id];
  if (!nombreKey) throw new Error(`sin clave de fuente para ${id}`);
  return {
    valor: r.valor,
    unidad: r.unidad,
    fuente: { nombreKey, url: r.url, idFuente: r.id, consultadoEl: radiacion.consultadoEl, dueno: r.dueno, estadoDato: "curado" },
  };
}
