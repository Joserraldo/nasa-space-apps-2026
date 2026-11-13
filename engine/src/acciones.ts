import {
  ActionSchema,
  type Action,
  type BaseAction,
  type GameState,
  type PendingEffect,
  type Resource,
  type Resources,
} from "@solar-shield/contracts";
import {
  COSTOS_ACCION,
  CONSUMO_POR_TICK,
  DIAS_PARA_GANAR,
  MALA_SUERTE_POR_DIFICULTAD,
  RECURSO_MAX,
  RETRASO_POR_DIFICULTAD,
  TICKS_POR_DIA,
} from "@solar-shield/design";
import { ajustarAltura, avanzarOrbita, senalDeDano } from "./orbita.js";
import { elegir, enteroEntre, siguiente } from "./rng.js";

const RECURSOS: readonly Resource[] = ["energia", "soporte_vital", "blindaje"];

function limitar(v: number): number {
  return Math.max(0, Math.min(RECURSO_MAX, v));
}

function aplicarDeltas(
  estado: GameState,
  deltas: Partial<Record<Resource, number>>,
  origen: GameState["causas"][number]["origen"],
  descripcionKey: string,
  accion?: Action,
): GameState {
  const recursos: Resources = { ...estado.recursos };
  const causas = [...estado.causas];
  for (const r of RECURSOS) {
    const d = deltas[r];
    if (!d) continue;
    recursos[r] = limitar(recursos[r] + d);
    causas.push({ tick: estado.tick, origen, descripcionKey, recurso: r, delta: d, ...(accion ? { accion } : {}) });
  }
  return { ...estado, recursos, causas };
}

/** Costo y beneficio de una acción base, ya escalados por sus parámetros. */
export function costoDe(accion: BaseAction): { inmediato: Partial<Record<Resource, number>>; retrasado: Partial<Record<Resource, number>>; causaKey: string } {
  const base = COSTOS_ACCION[accion.tipo];
  switch (accion.tipo) {
    case "redistribuir_energia":
      return {
        inmediato: { ...base.inmediato, energia: (base.inmediato.energia ?? 0) - accion.cantidad },
        retrasado: { [accion.hacia]: accion.cantidad },
        causaKey: base.causaKey,
      };
    case "subir_escudo":
      return {
        inmediato: { energia: (base.inmediato.energia ?? 0) * accion.nivel },
        retrasado: { blindaje: (base.retrasado.blindaje ?? 0) * accion.nivel },
        causaKey: base.causaKey,
      };
    default:
      return { inmediato: { ...base.inmediato }, retrasado: { ...base.retrasado }, causaKey: base.causaKey };
  }
}

/**
 * aplicarAccion(estado, accion) -> estado. Puro y determinista.
 * El costo se cobra ahora; el beneficio entra a la cola con retraso de 1-3 ticks.
 * `simular` no cambia recursos: devuelve el estado con una causa "sistema" y un uso menos.
 */
export function aplicarAccion(estado: GameState, accionCruda: unknown): GameState {
  const accion = ActionSchema.parse(accionCruda);
  if (estado.resultado !== "en_curso") return estado;

  if (accion.tipo === "simular") {
    if (estado.simulacionesRestantes === 0) return estado;
    return {
      ...estado,
      simulacionesRestantes:
        estado.simulacionesRestantes === null ? null : estado.simulacionesRestantes - 1,
      causas: [...estado.causas, { tick: estado.tick, origen: "sistema", descripcionKey: "causa.simular", accion }],
    };
  }

  const { inmediato, retrasado, causaKey } = costoDe(accion);
  let s = aplicarDeltas(estado, inmediato, "decision", causaKey, accion);

  const retraso = RETRASO_POR_DIFICULTAD[s.dificultad];
  let rng = s.rngEstado;
  const nuevos: PendingEffect[] = [];
  for (const r of RECURSOS) {
    const d = retrasado[r];
    if (!d) continue;
    const paso = enteroEntre(rng, retraso.min, retraso.max);
    rng = paso.estado;
    nuevos.push({
      id: `${s.tick}-${accion.tipo}-${r}`,
      aplicaEnTick: s.tick + paso.entero,
      recurso: r,
      delta: d,
      origen: "decision",
      descripcionKey: causaKey,
      oculto: retraso.ocultos,
    });
  }
  s = { ...s, rngEstado: rng, efectosPendientes: [...s.efectosPendientes, ...nuevos] };
  if (accion.tipo === "ajustar_orbita" && s.orbita) {
    s = { ...s, orbita: ajustarAltura(s.orbita, accion.deltaAlturaKm) };
  }
  return s;
}

/** Simula una acción sin tocar el estado real: devuelve el estado hipotético tras avanzar hasta que sus efectos entren. */
export function queEsSi(estado: GameState, accion: BaseAction): GameState {
  let s = aplicarAccion(estado, accion);
  const max = RETRASO_POR_DIFICULTAD[s.dificultad].max;
  for (let i = 0; i < max; i++) s = avanzarTick(s);
  return s;
}

const MALA_SUERTE = [
  { descripcionKey: "mala_suerte.micrometeorito", deltas: { blindaje: -10 } },
  { descripcionKey: "mala_suerte.fallo_panel", deltas: { energia: -12 } },
  { descripcionKey: "mala_suerte.fuga_agua", deltas: { soporte_vital: -8 } },
  { descripcionKey: "mala_suerte.tormenta_polvo", deltas: { energia: -8, blindaje: -3 } },
] as const;

/**
 * avanzarTick(estado) -> estado. Un paso del reloj fijo: consumo pasivo,
 * efectos pendientes cuyo tick llegó, tormenta activa, mala suerte sorteada, fin de partida.
 * Si está en pausa, no hace nada.
 */
export function avanzarTick(estado: GameState): GameState {
  if (estado.pausado || estado.resultado !== "en_curso") return estado;
  let s: GameState = { ...estado, tick: estado.tick + 1 };
  s = { ...s, dia: Math.floor(s.tick / TICKS_POR_DIA) + 1 };

  s = aplicarDeltas(s, CONSUMO_POR_TICK[s.sitio], "sistema", "causa.consumo");

  const listos = s.efectosPendientes.filter((e) => e.aplicaEnTick <= s.tick);
  const futuros = s.efectosPendientes.filter((e) => e.aplicaEnTick > s.tick);
  for (const e of listos) s = aplicarDeltas(s, { [e.recurso]: e.delta }, e.origen, e.descripcionKey);
  s = { ...s, efectosPendientes: futuros };

  const senal = senalDeDano(s);
  if (senal > 0) {
    const dano = -Math.round(senal * 10);
    if (dano !== 0) s = aplicarDeltas(s, { blindaje: dano, energia: Math.ceil(dano / 2) }, "mala_suerte", "causa.tormenta");
  }

  if (s.orbita) {
    s = { ...s, orbita: avanzarOrbita(s.orbita, s.tick, senal, s.equipos.antena !== "ok") };
  }

  let rng = s.rngEstado;
  const tirada = siguiente(rng);
  rng = tirada.estado;
  if (tirada.valor < MALA_SUERTE_POR_DIFICULTAD[s.dificultad]) {
    const ev = elegir(rng, MALA_SUERTE);
    rng = ev.estado;
    s = aplicarDeltas(s, ev.elegido.deltas, "mala_suerte", ev.elegido.descripcionKey);
  }
  s = { ...s, rngEstado: rng };

  if (RECURSOS.some((r) => s.recursos[r] <= 0)) s = { ...s, resultado: "fallo" };
  else if (s.dia > DIAS_PARA_GANAR) s = { ...s, resultado: "exito" };
  return s;
}

export function pausar(estado: GameState, pausado: boolean): GameState {
  return { ...estado, pausado };
}
