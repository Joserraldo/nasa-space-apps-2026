/**
 * Punto de entrada de @solar-shield/data. Los consumidores (motor, agentes, ui) usan:
 *   import { tormentasMock, eventosMock, aConvenio } from "@solar-shield/data";
 * Los textos visibles están en data/i18n/{es,en}.json (claves `fuente.*` y `datos.*`).
 */
import fuerte from "../mock/mock-tormenta-fuerte.json";
import soloFlr from "../mock/mock-solo-fulguracion.json";
import marte from "../mock/mock-tormenta-marte.json";
import { aConvenio } from "./convenio";
import { TormentaSchema, type Tormenta } from "./tormenta";

export * from "./contrato-espejo";
export * from "./tormenta";
export * from "./intensidad";
export { aConvenio, magnitud } from "./convenio";

/** Mocks validados al cargarse: si alguien rompe un JSON, falla aquí y no en la pantalla. */
export const tormentasMock: Tormenta[] = [fuerte, soloFlr, marte].map((t) => TormentaSchema.parse(t));
export const eventosMock = tormentasMock.map(aConvenio);
