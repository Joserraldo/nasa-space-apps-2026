import type { Expert } from "@solar-shield/contracts";
import type { Dialogo, Linea } from "./dialogo.js";
import type { VistaAgente } from "./expertos.js";
import { areaUrgente } from "./iris-guia.js";

/**
 * Iris compañera en el mundo abierto v8 (propuesta docs/ideas/iris-companera-v8.md).
 * Solo sugiere adónde ir: nunca ejecuta una `Action` ni bloquea un lugar.
 */

/**
 * Lugares de la base adonde Iris puede llevar al niño.
 * Copia exacta de `LugarId` de `ui/src/escena/mundo.ts` (rama de ui v8). Si ui cambia un id, hay que copiarlo aquí.
 */
export type DestinoIris = "mesa" | "taller" | "sensor" | "habitat" | "panel_solar" | "escudo" | "reciclador_agua" | "invernadero" | "antena" | "banco";

/** Gesto del rover (referencias de ui v8). */
export type GestoIris = "senalar" | "mirar" | "pedir_reparacion" | "explicar";
/** Rostro en la pantalla de Iris: "error" solo con la avería revelada. */
export type CaraIris = "normal" | "error";

export interface GuiaLugar {
  destino: DestinoIris;
  /** true solo en tutorial: ui traza la ruta. En pistas Iris solo mira hacia el área. */
  ruta: boolean;
  /** A quién consultar al llegar (ausente = el lugar no tiene experta). */
  experto?: Expert;
  dialogo: Dialogo;
  /** avería revelada → pedir_reparacion; tutorial → senalar; pistas → mirar. */
  gesto: GestoIris;
  cara: CaraIris;
}

/** Bienvenida: misma forma que la guía para que ui pinte igual. */
export interface BriefingIris {
  dialogo: Dialogo;
  gesto: "explicar";
  cara: "normal";
}

/** Metas de los 8 pasos de Jezero (copia de `PasoMision["meta"]` de @solar-shield/missions). */
const META_DEL_PASO = ["satelite_suelto", "ruta_dibujada", "sitio_elegido", "modulos_colocados", "tormenta_llega", "consejo_opuesto", "telemetria_enviada", "fin"] as const;

interface Plan {
  destino: DestinoIris;
  experto?: Expert;
  /** Sufijo de la clave i18n: agentes.iris.acompana.{tutorial|pista}.<motivo>. */
  motivo: string;
}

const PLAN_DEL_PASO: Record<(typeof META_DEL_PASO)[number], Omit<Plan, "motivo">> = {
  satelite_suelto: { destino: "mesa" },
  ruta_dibujada: { destino: "mesa" },
  sitio_elegido: { destino: "mesa" },
  modulos_colocados: { destino: "taller", experto: "ingeniera" },
  tormenta_llega: { destino: "sensor", experto: "meteorologa" },
  consejo_opuesto: { destino: "habitat", experto: "doctora" },
  // La consola de enlace está en la mesa: no se exige haber construido la antena (precaución 2 de ui v8).
  telemetria_enviada: { destino: "mesa" },
  fin: { destino: "mesa" },
};

const PLAN_URGENTE: Record<"energia" | "blindaje" | "soporte", Plan> = {
  energia: { destino: "taller", experto: "ingeniera", motivo: "energia" },
  blindaje: { destino: "habitat", experto: "doctora", motivo: "blindaje" },
  soporte: { destino: "habitat", experto: "doctora", motivo: "soporte" },
};

function planDe(v: VistaAgente, paso: number, averiaRevelada: boolean): Plan {
  if (averiaRevelada) return { destino: "taller", experto: "ingeniera", motivo: "averia" };
  const area = areaUrgente(v);
  // En tormenta manda el paso (5 → sensor, 6 → habitat).
  if (area === "energia" || area === "blindaje" || area === "soporte") return PLAN_URGENTE[area];
  const meta = META_DEL_PASO[paso - 1];
  if (!meta) return { destino: "mesa", motivo: "libre" };
  // P0.4: con la tormenta ya en el estado (aún sin activar) Iris avisa al llegar al taller.
  if (meta === "modulos_colocados" && v.tormenta !== null) return { destino: "taller", experto: "ingeniera", motivo: "tormenta_viene" };
  return { ...PLAN_DEL_PASO[meta], motivo: meta };
}

/**
 * Adónde lleva Iris al niño. Prioridad: avería revelada → urgencia (fuera de tormenta) → paso de Jezero.
 * `null` = Iris offline, se queda cargando en su dock.
 * "danada" solo guía como tutorial antes de revelar la avería; luego pide verificar sin ruta.
 */
export function guiaIrisLugar(v: VistaAgente, paso: number, opts: { averiaRevelada?: boolean } = {}): GuiaLugar | null {
  const nivel = v.iaBase ?? "tutorial";
  if (nivel === "offline") return null;
  const { destino, experto, motivo } = planDe(v, paso, opts.averiaRevelada ?? false);
  const averia = motivo === "averia";
  const cara: CaraIris = averia ? "error" : "normal";
  const conExperto = experto ? { experto } : {};
  // La avería inicial de Jezero se oculta hasta su revelación (A1).
  // Después Iris reconoce la falla, deja de trazar rutas y pide verificar con la Ingeniera.
  if (nivel === "danada" && averia) {
    return { destino, ruta: false, ...conExperto, gesto: "pedir_reparacion", cara: "error", dialogo: { experto: "ia_base", prioridad: "consejo", lineas: [{ clave: "agentes.iris.acompana.danada.verificar" }] } };
  }

  if (nivel === "pistas") {
    return { destino, ruta: false, ...conExperto, gesto: averia ? "pedir_reparacion" : "mirar", cara, dialogo: { experto: "ia_base", prioridad: "charla", lineas: [{ clave: `agentes.iris.acompana.pista.${motivo}` }] } };
  }
  const vars: Linea["vars"] = { lugarKey: `agentes.iris.lugar.${destino}`, ...(experto ? { expertoKey: `agentes.nombre.${experto}` } : {}) };
  return { destino, ruta: true, ...conExperto, gesto: averia ? "pedir_reparacion" : "senalar", cara, dialogo: { experto: "ia_base", prioridad: "consejo", lineas: [{ clave: `agentes.iris.acompana.tutorial.${motivo}`, vars }] } };
}

/** Bienvenida del paso 1 (omitible): objetivo, tres medidores y "pregúntale a una experta". */
export function briefingIris(): BriefingIris {
  return {
    gesto: "explicar",
    cara: "normal",
    dialogo: {
      experto: "ia_base",
      prioridad: "charla",
      lineas: [{ clave: "agentes.iris.acompana.briefing.objetivo" }, { clave: "agentes.iris.acompana.briefing.medidores" }, { clave: "agentes.iris.acompana.briefing.experta" }],
    },
  };
}
