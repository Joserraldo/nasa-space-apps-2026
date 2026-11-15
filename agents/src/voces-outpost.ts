import type { SourceCard } from "@solar-shield/contracts";
import type { Dialogo } from "./dialogo.js";
import { escenaTormenta, type EscenaTormenta, type MedicionCitada, type OpcionDilemaVista } from "./escenas.js";
import type { VistaAgente } from "./expertos.js";

/**
 * Voces de la misión "outpost sorpresa" (propuesta de datos en #99; plan en docs/ideas/voces-misiones-datos.md §3):
 * no hay suelo, el puesto es una nave camino a la Luna. Depende de que diseño apruebe la misión.
 * Reglas: CRaTER midió en órbita lunar, NO en la nave; el Kp 9 es de la Tierra; µGy/h nunca se mezcla con mSv.
 * El micrometeorito (4b) reutiliza `escenaMicrometeorito` de la misión Luna polo sur.
 */
export type ZonaNave = "cabina" | "centro" | "fondo";

// TODO: de #99 de datos — tormenta principal de la misión (Gannon: SEP y Kp 9; CRaTER ×206 con fondo tranquilo, #95).
export const TORMENTA_OUTPOST = "2024-05-10-gannon";

const zonaKey = (z: ZonaNave) => `agentes.outpost.zona.${z}`;

/**
 * Paso 1, la sorpresa. Con `fuenteOrion` ({ ...artemis.fuente, idFuente: artemis.instrumento } de data),
 * Iris cuenta que Orion llevó un medidor en 2022 y que casi todos los días fueron tranquilos (HERA, RadLab).
 */
export function sorpresaOutpost(fuenteOrion?: SourceCard): Dialogo[] {
  const sorpresa: Dialogo = {
    experto: "ia_base",
    prioridad: "alerta",
    lineas: [{ clave: "agentes.outpost.sorpresa" }, { clave: "agentes.outpost.leccion" }],
  };
  return fuenteOrion
    ? [sorpresa, { experto: "ia_base", prioridad: "charla", fuente: fuenteOrion, lineas: [{ clave: "agentes.outpost.orion" }] }]
    : [sorpresa];
}

/** Paso 3: ¿dónde vive la tripulación? Ninguna zona gana en todo (valores de juego, sin cifras). */
export function consejosZonasNave(): Dialogo[] {
  return [
    { experto: "doctora", prioridad: "consejo", lineas: [{ clave: "agentes.outpost.zonas.doctora", vars: { zonaKey: zonaKey("centro") } }] },
    { experto: "ingeniera", prioridad: "consejo", lineas: [{ clave: "agentes.outpost.zonas.ingeniera", vars: { zonaKey: zonaKey("cabina") } }] },
    { experto: "ia_base", prioridad: "charla", lineas: [{ clave: "agentes.outpost.zonas.iris", vars: { zonaKey: zonaKey("fondo") } }] },
  ];
}

/**
 * Paso 6, dilema del refugio con provisiones.
 * @param crater `MedicionCitada` de CRaTER (`lugar: "orbita_luna"`, con `fondoTranquilo`). Sin ella, la Doctora no da cifra.
 */
export function escenaTormentaOutpost(v: VistaAgente, dilema?: readonly OpcionDilemaVista[], crater?: MedicionCitada): EscenaTormenta | null {
  const e = escenaTormenta(v, dilema, crater);
  if (!e || !v.tormenta) return null;
  const sep = v.tormenta.fases?.some((f) => f.tipo === "SEP");
  const conFactor = crater && crater.fondoTranquilo !== false && crater.factor >= 1.5;
  const dialogos = e.dialogos.map((d): Dialogo => {
    if (d.experto === "meteorologa" && sep) return { ...d, lineas: [...d.lineas, { clave: "agentes.outpost.tormenta.particulas" }] };
    if (d.experto === "doctora")
      return {
        ...d,
        lineas: [
          conFactor
            ? { clave: "agentes.outpost.tormenta.doctora", vars: { factor: Math.round(crater.factor) } }
            : d.lineas[0]!,
          { clave: "agentes.outpost.dilema.doctora" },
        ],
      };
    if (d.experto === "ingeniera") return { ...d, lineas: [{ clave: "agentes.outpost.dilema.ingeniera" }, ...d.lineas.slice(1)] };
    return d;
  });
  return { ...e, dialogos };
}
