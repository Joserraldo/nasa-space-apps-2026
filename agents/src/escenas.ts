import type { Action, Expert, SourceCard } from "@solar-shield/contracts";
import { ENERGIA_POR_CANTIDAD } from "./a-accion.js";
import type { Dialogo } from "./dialogo.js";
import type { VistaAgente } from "./expertos.js";

/**
 * Paso 6 de la ruta dorada (#41): llega una tormenta real y dos expertos dan consejos opuestos,
 * cada uno con su dato. Ninguno es gratis: el refugio frena el trabajo y el soporte vital;
 * el escudo gasta energía. El jugador decide (los expertos nunca deciden por él).
 */
export interface EscenaTormenta {
  dialogos: Dialogo[];
  /** Opciones en conflicto, en el orden en que se proponen (refugio, escudo y, si la misión la trae, aguantar). */
  opciones: [Action, Action, ...Action[]];
}

/** Forma mínima de una opción del dilema (estructural con `OpcionDilema` de missions/). */
export interface OpcionDilemaVista {
  accion: Action;
  /** Experto que la defiende; null = nadie la recomienda (ej. aguantar). */
  defiende: Expert | null;
}

/**
 * Cifra de radiación con su lugar (docs/ideas/voces-misiones-datos.md §2). La arma quien integra con datos
 * (ej. CRaTER de LRO en órbita lunar, #95). El lugar elige la frase: nunca "en tu base" si se midió en órbita.
 */
export interface MedicionCitada {
  /** pico / fondo, tal como lo da datos. */
  factor: number;
  /** `gale_lejos`: RAD (Curiosity) midió en el cráter Gale, lejos de la base (misión del polo norte). */
  lugar: "superficie_marte" | "gale_lejos" | "orbita_luna";
  fuente: SourceCard;
}

const CLAVE_MEDIDA: Record<MedicionCitada["lugar"], string> = {
  superficie_marte: "agentes.escena6.doctora.medida",
  gale_lejos: "agentes.escena6.doctora.medidaGale",
  orbita_luna: "agentes.escena6.doctora.medidaOrbitaLuna",
};

/**
 * @param dilema opciones de `MISION_JEZERO.dilemaPaso6.opciones`. Si se pasan, mandan las acciones de la misión;
 * si no, se usan las de siempre (refugio vs. energía al escudo).
 * @param medicion cifra citada de otro lugar (misiones de la Luna). Sin ella, la Doctora usa `medicionMarte` (Curiosity).
 */
export function escenaTormenta(v: VistaAgente, dilema?: readonly OpcionDilemaVista[], medicion?: MedicionCitada): EscenaTormenta | null {
  const t = v.tormenta;
  if (!t) return null;
  const fecha = t.inicio.slice(0, 10);
  const citada: MedicionCitada | null = medicion ?? (t.medicionMarte ? { factor: t.medicionMarte.factor, lugar: "superficie_marte", fuente: t.fuente } : null);
  const medida = citada && citada.factor >= 1.5 ? citada : null;
  // Kp solo existe en la Tierra (DONKI GST): la Meteoróloga lo dice con su lugar.
  const kp = t.fases?.find((f) => f.tipo === "GST" && f.observadoEn === "Tierra" && f.magnitudTexto)?.magnitudTexto;
  const de = (e: Expert) => dilema?.find((o) => o.defiende === e)?.accion;
  const refugio: Action = de("doctora") ?? { tipo: "refugiarse" };
  const escudo: Action = de("ingeniera") ?? { tipo: "redistribuir_energia", hacia: "blindaje", cantidad: ENERGIA_POR_CANTIDAD.mucho };
  const sinDefensor = (dilema ?? []).filter((o) => o.defiende === null).map((o) => o.accion);
  const energia = Math.round(v.recursos.energia);

  const meteorologa: Dialogo = {
    experto: "meteorologa",
    prioridad: "alerta",
    fuente: t.fuente,
    lineas: [
      { clave: "agentes.escena6.meteorologa.llega", vars: { fecha, nombreKey: `datos.tormenta.${t.id}.nombre` } },
      ...(t.marcoMarte ? [{ clave: `datos.marco.${t.marcoMarte}` }] : []),
      ...(kp ? [{ clave: "agentes.escena6.meteorologa.kpTierra", vars: { kp } }] : []),
    ],
  };
  // La Doctora cita la medición con su lugar (si hay); si no, solo el principio de protegerse.
  const doctora: Dialogo = {
    experto: "doctora",
    prioridad: "consejo",
    fuente: medida?.fuente ?? t.fuente,
    accion: refugio,
    lineas: [
      medida
        ? { clave: CLAVE_MEDIDA[medida.lugar], vars: { factor: Math.round(medida.factor) } }
        : { clave: "agentes.escena6.doctora.sinMedida" },
      // Dilema del refugio (idea de ARES): con invernadero sano, refugiarse lo deja sin cuidar.
      { clave: v.equipos.invernadero === "ok" ? "agentes.escena6.doctora.costoInvernadero" : "agentes.escena6.doctora.costo" },
    ],
  };
  // La Ingeniera cita la energía del estado del juego: el escudo la gasta.
  const ingeniera: Dialogo = {
    experto: "ingeniera",
    prioridad: "consejo",
    accion: escudo,
    lineas: [
      { clave: "agentes.escena6.ingeniera.contra" },
      // Solo se cita el gasto si la acción lo trae; el costo de subir_escudo vive en design/ y no se inventa aquí.
      escudo.tipo === "redistribuir_energia"
        ? { clave: "agentes.escena6.ingeniera.costo", vars: { energia, gasto: escudo.cantidad } }
        : { clave: "agentes.escena6.ingeniera.costoSinCifra", vars: { energia } },
    ],
  };
  const iris: Dialogo = {
    experto: "ia_base",
    prioridad: "charla",
    lineas: [...(sinDefensor.length ? [{ clave: "agentes.escena6.aguantar" }] : []), { clave: "agentes.escena6.elige" }],
  };

  return { dialogos: [meteorologa, doctora, ingeniera, iris], opciones: [refugio, escudo, ...sinDefensor] };
}
