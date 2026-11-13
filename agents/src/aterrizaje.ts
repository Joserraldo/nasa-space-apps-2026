import type { Dialogo } from "./dialogo.js";

/**
 * Paso 3 de la ruta dorada: elegir sitio con 3 criterios (plano, luz, blindaje natural).
 * Cada voz defiende SU criterio y recomienda el sitio que mejor lo cumple, así que suelen
 * discrepar: ningún sitio es perfecto. Los puntajes los calcula datos/motor; aquí solo se comparan.
 */
export type Criterio = "plano" | "luz" | "blindaje";

/** Forma mínima de un candidato (estructural con `CandidatoSitio` del motor y `data/terreno`). */
export interface SitioCandidato {
  id: string;
  nombreKey: string;
  puntajes: Record<Criterio, number>;
}

const QUIEN: { experto: Dialogo["experto"]; criterio: Criterio }[] = [
  { experto: "ingeniera", criterio: "luz" },
  { experto: "doctora", criterio: "blindaje" },
  { experto: "ia_base", criterio: "plano" },
];

/** El mejor sitio en un criterio; empate por id para que sea estable. */
function mejor(sitios: readonly SitioCandidato[], c: Criterio): SitioCandidato | undefined {
  return [...sitios].sort((a, b) => b.puntajes[c] - a.puntajes[c] || a.id.localeCompare(b.id))[0];
}

export function consejosAterrizaje(sitios: readonly SitioCandidato[]): Dialogo[] {
  if (sitios.length === 0) return [];
  const dialogos: Dialogo[] = QUIEN.map(({ experto, criterio }) => {
    const s = mejor(sitios, criterio)!;
    return {
      experto,
      prioridad: "consejo",
      lineas: [{ clave: `agentes.aterrizaje.${experto}.${criterio}`, vars: { sitioKey: s.nombreKey } }],
    };
  });
  const elegidos = new Set(QUIEN.map(({ criterio }) => mejor(sitios, criterio)!.id));
  dialogos.push({
    experto: "ia_base",
    prioridad: "charla",
    lineas: [{ clave: elegidos.size > 1 ? "agentes.aterrizaje.cierre.discrepan" : "agentes.aterrizaje.cierre.coinciden" }],
  });
  return dialogos;
}
