import type { Action, Equipment, GameState } from "@solar-shield/contracts";
import {
  aplicarAccion,
  aterrizar,
  avanzarTick,
  elegirDilema,
  modulosColocados,
  novedades,
  partidaDeMision,
  pausar,
  puedeAplicar,
  puedeColocar as puedeColocarMotor,
  type Novedades,
  type PuntajeSitio,
} from "@solar-shield/engine";
import { misionDeLaUrl, misionPorId } from "./misiones.js";

export type Fase = "inicio" | "satelite" | "sitio" | "modulos" | "base" | "tormenta" | "final";

/** Estado de orquestación de la pantalla. Los recursos y el resultado viven en `estado` (motor). */
export interface Juego {
  fase: Fase;
  estado: GameState;
  colocados: Equipment[];
  sitio: PuntajeSitio | null;
  ultimas: Novedades | null;
  tormentaVista: boolean;
  /** El estado de antes de la decisión de la tormenta: mientras exista se muestra "Decision recorded" (ui/04 panel 04). */
  registro: GameState | null;
  /** EXPERIMENTAL: id de la misión (missions/). Sin él, Jezero. */
  misionId: string;
}

export type Evento =
  | { tipo: "nueva"; misionId?: string; semilla?: string }
  | { tipo: "restaurar"; juego: Juego }
  | { tipo: "fase"; fase: Fase }
  | { tipo: "accion"; accion: Action }
  | { tipo: "acciones"; acciones: Action[] }
  | { tipo: "dilema"; opcionId: string; previas?: Action[] | undefined }
  | { tipo: "seguir" }
  | { tipo: "tick" }
  | { tipo: "pausa"; pausado: boolean }
  | { tipo: "sitio"; sitio: PuntajeSitio }
  | { tipo: "modulo"; modulo: Equipment };

export function inicial(pedido?: { misionId?: string | undefined; semilla?: string | undefined }): Juego {
  const url = misionDeLaUrl();
  const mision = misionPorId(pedido?.misionId ?? url.misionId);
  const semilla = pedido?.semilla ?? (mision.id === url.misionId ? url.semilla : undefined);
  return { fase: "inicio", estado: partidaDeMision(mision, semilla), colocados: [], sitio: null, ultimas: null, tormentaVista: false, registro: null, misionId: mision.id };
}

/**
 * Delega en el motor la validez del módulo, el límite de la misión y los recursos disponibles,
 * restringiendo la colocación al paso `"modulos"` para evitar cobros duplicados.
 */
export function puedeColocar(j: Juego, modulo: Equipment): boolean {
  return (
    j.fase === "modulos" &&
    puedeColocarMotor(j.estado, modulo, misionPorId(j.misionId)) &&
    puedeAplicar(j.estado, { tipo: "colocar_modulo", modulo }, misionPorId(j.misionId)).ok
  );
}

export function reducir(j: Juego, e: Evento): Juego {
  const m = misionPorId(j.misionId);
  switch (e.tipo) {
    case "nueva":
      return inicial({ misionId: e.misionId ?? j.misionId, semilla: e.semilla });
    case "restaurar":
      return e.juego;
    case "fase":
      return { ...j, fase: e.fase };
    case "sitio":
      // Solo en el paso de elegir sitio: un evento repetido más tarde no regresa a módulos ni cambia el sitio.
      if (j.fase !== "sitio") return j;
      return { ...j, sitio: e.sitio, estado: aterrizar(j.estado, e.sitio.id, m), fase: "modulos" };
    case "modulo": {
      if (!puedeColocar(j, e.modulo)) return j;
      const estado = aplicarAccion(j.estado, { tipo: "colocar_modulo", modulo: e.modulo }, m);
      if (estado === j.estado) return j;
      return { ...j, estado, colocados: modulosColocados(estado) as Equipment[] };
    }
    case "accion": {
      const estado = aplicarAccion(j.estado, e.accion, m);
      return estado === j.estado ? j : { ...j, estado };
    }
    case "acciones": {
      let s = j.estado;
      for (const a of e.acciones) s = aplicarAccion(s, a, m);
      return { ...j, estado: pausar(s, false), fase: "base" };
    }
    case "dilema": {
      let s = j.estado;
      for (const a of e.previas ?? []) s = aplicarAccion(s, a, m);
      const estado = elegirDilema(s, e.opcionId, m);
      // La tormenta sigue en pantalla con "Decision recorded" hasta que el jugador pulse "Return to exploration".
      return estado === s ? j : { ...j, estado, registro: j.estado };
    }
    case "seguir":
      return { ...j, estado: pausar(j.estado, false), registro: null, fase: "base" };
    case "pausa":
      return { ...j, estado: pausar(j.estado, e.pausado) };
    case "tick": {
      if (j.estado.pausado || j.estado.resultado !== "en_curso") return j;
      const sig = avanzarTick(j.estado, m);
      const n = novedades(j.estado, sig, m);
      if (sig.resultado !== "en_curso") return { ...j, estado: sig, ultimas: n, fase: "final" };
      if (n.tormentaLlego && !j.tormentaVista) {
        return { ...j, estado: pausar(sig, true), ultimas: n, fase: "tormenta", tormentaVista: true };
      }
      return { ...j, estado: n.pausar ? pausar(sig, true) : sig, ultimas: n };
    }
  }
}
