/**
 * Coreografía de la tripulación (A7): qué gesto hace cada actor según lo que pasa. Pura (sin three ni DOM),
 * para probar la tabla sin navegador. Nunca decide reglas ni toca recursos (MECANICAS §5): lee la vista,
 * quién habla, el último evento del motor y la cercanía del niño, y elige uno de los 14 gestos.
 *
 * Principios (sensación de juegos de mundo abierto, no sus recursos): nadie queda quieto mientras habla;
 * los reposos tienen variaciones con un desfase por actor (no se mueven todos a la vez); cada experta hace el
 * trabajo de su estación; se saluda al llegar, se escucha al que habla y se reacciona a lo que pasó.
 */
import type { Gesto } from "./personajes/animaciones";
import type { ActorId } from "./frontera";
import type { VistaEscena } from "./vista";

/** Actores humanos con gestos (Iris es un rover y tiene sus propias caras). */
export type ActorCoreografia = Exclude<ActorId, "iris">;

/** Reacciones a eventos del motor que se ven en el cuerpo. Las elige la escena a partir de `EventoFeedback`. */
export type Reaccion = "averia" | "tormenta" | "beneficio" | "exito" | "fallo";

export interface Situacion {
  /** Segundos desde que arrancó la escena (el reloj de la animación). */
  t: number;
  vista: Pick<VistaEscena, "tormenta" | "iris" | "modulos"> | null;
  /** Quién habla en el diálogo abierto (frontera `hablando`), o null. */
  hablando: ActorId | null;
  /** Última reacción y hace cuántos segundos llegó; null si no hubo. */
  reaccion: Readonly<{ tipo: Reaccion; hace: number }> | null;
  /** Expertas: segundos desde que el niño entró en su radio de atención; -1 si está lejos. */
  cerca: number;
  /** Niño: si se está moviendo. */
  caminando: boolean;
}

/** Cuánto dura cada cosa (s). [E] Calibrado a ojo en el juego. */
export const TIEMPOS = { saludo: 1.6, reaccion: 2.2, hablar: 2.6, explicar: 1.8, ciclo: 7, variacion: 2.4 } as const;

/** Desfase por actor (s): que los reposos y los ciclos no coincidan. */
const DESFASE: Readonly<Record<ActorCoreografia, number>> = { nino: 0, ingeniera: 2.3, doctora: 4.1, meteorologa: 5.7 };

/** Alterna entre `a` (durante `da` s) y `b` (durante `db` s). */
function alterna<T>(t: number, a: T, da: number, b: T, db: number): T {
  return t % (da + db) < da ? a : b;
}

/** Variación de reposo: la mayor parte del ciclo `base`, y una ventana corta con `variacion`. */
function reposoCon(t: number, actor: ActorCoreografia, variacion: Gesto, base: Gesto = "reposo"): Gesto {
  return (t + DESFASE[actor]) % TIEMPOS.ciclo < TIEMPOS.variacion ? variacion : base;
}

/** Gesto de un actor en esta situación. */
export function gestoDe(actor: ActorCoreografia, s: Situacion): Gesto {
  const t = s.t + DESFASE[actor];
  const r = s.reaccion && s.reaccion.hace < TIEMPOS.reaccion ? s.reaccion.tipo : null;

  if (actor === "nino") {
    if (s.caminando) return "caminar";
    if (r === "averia" || r === "tormenta") return "alertar";
    if (r === "beneficio" || r === "exito") return "confirmar";
    if (r === "fallo") return "arrodillarse";
    if (s.hablando && s.hablando !== "nino") return "escuchar";
    // Quieto: mira alrededor o revisa el traje cada tanto.
    return reposoCon(s.t, actor, alterna(Math.floor((s.t + DESFASE.nino) / TIEMPOS.ciclo), "observar", 1, "inspeccionar", 1));
  }

  // Expertas. Hablar es lo primero: nunca quietas mientras hablan.
  if (s.hablando === actor) return alterna(t, "hablar", TIEMPOS.hablar, "explicar", TIEMPOS.explicar);
  const cerca = s.cerca >= 0;
  if (s.hablando && cerca) return "escuchar";
  if (r === "beneficio" || r === "exito") return "confirmar";
  if (r === "tormenta") return actor === "doctora" ? "tranquilizar" : "alertar";
  if (r === "averia") return actor === "ingeniera" ? "alertar" : "verificar";
  if (cerca) return s.cerca < TIEMPOS.saludo ? "saludar" : "explicar";

  // En su estación, cada una hace su trabajo según el estado de la base.
  const v = s.vista;
  switch (actor) {
    case "ingeniera": {
      const instalando = !!v && Object.values(v.modulos).includes("instalando");
      const averia = !!v && (v.iris.averiada || Object.values(v.modulos).includes("averiado"));
      if (instalando) return "arrodillarse";
      if (averia) return alterna(t, "reparar", 5, "inspeccionar", 2);
      return reposoCon(s.t, actor, "inspeccionar");
    }
    case "doctora":
      if (v?.tormenta.activa) return alterna(t, "tranquilizar", 3, "verificar", 3);
      return reposoCon(s.t, actor, "verificar");
    case "meteorologa":
      if (v?.tormenta.activa) return alterna(t, "alertar", 2, "observar", 4);
      if (v?.tormenta.anunciada) return alterna(t, "observar", 4, "alertar", 1.5);
      return reposoCon(s.t, actor, "observar");
  }
}

/** La reacción que provoca un evento del motor, o null (los cambios de recursos de cada turno no cuentan). */
export function reaccionDe(e: Readonly<{ tipo: string; resultado?: string }>): Reaccion | null {
  switch (e.tipo) {
    case "averia":
      return "averia";
    case "tormenta_llego":
      return "tormenta";
    case "efecto_llego":
      return "beneficio";
    case "fin":
      return e.resultado === "exito" ? "exito" : "fallo";
    default:
      return null;
  }
}
