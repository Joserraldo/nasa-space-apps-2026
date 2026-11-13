/**
 * Punto de entrada de @solar-shield/data. Los consumidores (motor, agentes, ui) usan:
 *   import { tormentasMock, eventosMock, aConvenio } from "@solar-shield/data";
 * Los textos visibles están en data/i18n/{es,en}.json (claves `fuente.*` y `datos.*`).
 */
import fuerte from "../mock/mock-tormenta-fuerte.json";
import soloFlr from "../mock/mock-solo-fulguracion.json";
import marte from "../mock/mock-tormenta-marte.json";
import c_2024_05_11_x58 from "../curated/2024-05-11-x58.json";
import c_2024_05_10_gannon from "../curated/2024-05-10-gannon.json";
import c_2024_05_14_x87 from "../curated/2024-05-14-x87.json";
import c_2024_10_03_x90 from "../curated/2024-10-03-x90.json";
import c_2024_10_10_g4 from "../curated/2024-10-10-g4.json";
import c_2017_09_06_x93 from "../curated/2017-09-06-x93.json";
import c_2017_09_10_x82 from "../curated/2017-09-10-x82.json";
import indiceCurado from "../curated/index.json";
import { aConvenio } from "./convenio";
import { TormentaSchema, type Tormenta } from "./tormenta";

export * from "./contrato-espejo";
export * from "./tormenta";
export * from "./intensidad";
export { aConvenio, magnitud } from "./convenio";

/** Mocks validados al cargarse: si alguien rompe un JSON, falla aquí y no en la pantalla. */
export const tormentasMock: Tormenta[] = [fuerte, soloFlr, marte].map((t) => TormentaSchema.parse(t));
export const eventosMock = tormentasMock.map(aConvenio);

/** Tormentas reales curadas de DONKI (no en vivo), en el orden fijo de curated/index.json. */
export const tormentasCuradas: Tormenta[] = [c_2024_05_11_x58, c_2024_05_10_gannon, c_2024_05_14_x87, c_2024_10_03_x90, c_2024_10_10_g4, c_2017_09_06_x93, c_2017_09_10_x82].map((t) => TormentaSchema.parse(t));
export const eventosCurados = tormentasCuradas.map(aConvenio);
/** Tormenta fija de la semilla dorada (demo y e2e). */
export const ID_RUTA_DORADA: string = indiceCurado.rutaDorada;
export const eventoRutaDorada = eventosCurados.find((e) => e.id === ID_RUTA_DORADA)!;
