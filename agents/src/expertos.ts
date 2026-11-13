import { CONFIDENCE_THRESHOLD, type ClassifierOutput, type GameState } from "@solar-shield/contracts";
import { aAccion } from "./a-accion.js";
import type { Dialogo, Linea, ReferenciaDosis } from "./dialogo.js";

/** Lo único del estado que ven los expertos (nunca el modelo). */
export type VistaAgente = Pick<GameState, "recursos" | "tripulacion" | "tormenta" | "equipos">;

export interface Contexto {
  /** Dosis en la superficie de Marte (RAD/Curiosity), para la Doctora. */
  dosisMarte?: ReferenciaDosis;
}

const l = (clave: string, vars?: Linea["vars"]): Linea => (vars ? { clave, vars } : { clave });
const muletilla = (experto: string): Linea => l(`agentes.${experto}.muletilla`);

/** Umbral de recurso bajo (pct). Es de presentación: solo cambia qué frase se elige. */
const BAJO = 30;

function ingeniera(s: ClassifierOutput, v: VistaAgente): Dialogo {
  const { energia, blindaje, soporte_vital } = v.recursos;
  const base = { experto: "ingeniera" as const, prioridad: "consejo" as const };
  if (s.accion === "repartir_energia") {
    const accion = aAccion(s);
    if (!accion) return { ...base, lineas: [l("agentes.ingeniera.repartir.cual")] };
    return { ...base, accion, lineas: [l("agentes.ingeniera.repartir.ok", { destinoKey: `agentes.recurso.${s.parametros.destino}`, cantidadKey: `agentes.cantidad.${s.parametros.cantidad ?? "medio"}` }), muletilla("ingeniera")] };
  }
  if (s.accion === "reparar") {
    const equipo = s.parametros.equipo;
    if (!equipo) return { ...base, lineas: [l("agentes.ingeniera.reparar.cual")] };
    const estado = v.equipos[equipo as keyof typeof v.equipos];
    const equipoKey = `agentes.equipo.${equipo}`;
    if (estado === "ok") return { ...base, lineas: [l("agentes.ingeniera.reparar.sano", { equipoKey })] };
    const accion = aAccion(s);
    return { ...base, ...(accion ? { accion } : {}), lineas: [l("agentes.ingeniera.reparar.ok", { equipoKey }), muletilla("ingeniera")] };
  }
  const clave = energia < BAJO ? "agentes.ingeniera.energia.baja" : "agentes.ingeniera.energia.ok";
  return { ...base, lineas: [l(clave, { energia: Math.round(energia), blindaje: Math.round(blindaje), soporte: Math.round(soporte_vital) }), muletilla("ingeniera")] };
}

function doctora(s: ClassifierOutput, v: VistaAgente, c: Contexto): Dialogo {
  const base = { experto: "doctora" as const, prioridad: "consejo" as const };
  if (s.accion === "ir_al_refugio") {
    return { ...base, accion: { tipo: "refugiarse" }, lineas: [l("agentes.doctora.refugio.ok"), muletilla("doctora")] };
  }
  if (s.accion === "explicar_dosis") {
    const lineas = [l("agentes.doctora.dosis.analogia")];
    if (!c.dosisMarte) return { ...base, lineas };
    return { ...base, fuente: c.dosisMarte.fuente, lineas: [...lineas, l("agentes.doctora.dosis.marte", { valor: c.dosisMarte.valor })] };
  }
  // estado_salud: la radiación no se siente; nunca se le atribuyen síntomas leves (revisión de datos, #40).
  const dosis = Math.max(0, ...v.tripulacion.map((t) => t.dosisMSv));
  const lineas = [l("agentes.doctora.salud.estado", { dosis: Number(dosis.toFixed(2)) }), l("agentes.doctora.salud.noSeSiente")];
  if (v.tormenta) lineas.push(l("agentes.doctora.salud.tormenta"));
  return { ...base, lineas: [...lineas, muletilla("doctora")] };
}

function meteorologa(s: ClassifierOutput, v: VistaAgente): Dialogo {
  const base = { experto: "meteorologa" as const, prioridad: "consejo" as const };
  const t = v.tormenta;
  if (s.accion === "explicar_evento") {
    // Destello ≠ nube: lo que hay que esperar con el escudo es la nube (revisión de datos, #40).
    return { ...base, lineas: [l("agentes.meteorologa.evento.destelloNube"), muletilla("meteorologa")] };
  }
  if (!t) return { ...base, lineas: [l("agentes.meteorologa.pronostico.calma"), muletilla("meteorologa")] };
  // Datos curados, no en vivo: se dice la fecha real, nunca "ahora mismo".
  const lineas = [l("agentes.meteorologa.pronostico.real", { fecha: t.inicio.slice(0, 10), nombreKey: `datos.tormenta.${t.id}.nombre` })];
  if (t.marcoMarte) lineas.push(l(`datos.marco.${t.marcoMarte}`));
  if (t.medicionMarte && t.medicionMarte.factor >= 1.5) lineas.push(l("agentes.meteorologa.pronostico.medida", { factor: Math.round(t.medicionMarte.factor) }));
  return { ...base, prioridad: "alerta", fuente: t.fuente, lineas: [...lineas, muletilla("meteorologa")] };
}

function iaBase(s: ClassifierOutput, v: VistaAgente): Dialogo {
  const base = { experto: "ia_base" as const, prioridad: "charla" as const };
  if (s.accion === "ayuda") {
    // Nivel 1: recomienda a quién llamar según el estado (reglas, sin modelo).
    const quien = v.tormenta ? "meteorologa" : v.recursos.energia < BAJO ? "ingeniera" : v.recursos.blindaje < BAJO ? "ingeniera" : "doctora";
    return { ...base, lineas: [l("agentes.ia_base.ayuda", { expertoKey: `agentes.nombre.${quien}` })] };
  }
  const clave = { saludo: "agentes.ia_base.saludo", repetir: "agentes.ia_base.repetir" }[s.accion as string] ?? "agentes.ia_base.fueraDeTema";
  return { ...base, lineas: [l(clave)] };
}

/** Responde una salida del clasificador (o de un atajo/botón) con plantillas. Nunca llama al modelo. */
export function responder(s: ClassifierOutput, v: VistaAgente, c: Contexto = {}): Dialogo {
  if (s.confianza < CONFIDENCE_THRESHOLD) {
    const experto = s.experto === "matematico" || s.experto === "control_mision" ? "ia_base" : s.experto;
    return { experto, prioridad: "charla", lineas: [l(`agentes.aclarar.${experto}`)] };
  }
  switch (s.experto) {
    case "ingeniera":
      return ingeniera(s, v);
    case "doctora":
      return doctora(s, v, c);
    case "meteorologa":
      return meteorologa(s, v);
    case "matematico": {
      const accion = aAccion(s);
      return { experto: "matematico", prioridad: "consejo", ...(accion ? { accion } : {}), lineas: [l(accion ? "agentes.matematico.calculo" : "agentes.matematico.cual")] };
    }
    default:
      return iaBase(s, v);
  }
}
