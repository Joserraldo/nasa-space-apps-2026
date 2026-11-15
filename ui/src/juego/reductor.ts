import type { Action, Equipment, GameState } from "@solar-shield/contracts";
import {
  aplicarAccion,
  aterrizar,
  avanzarTick,
  elegirDilema,
  modulosColocados,
  novedades,
  partidaDorada,
  pausar,
  puedeAplicar,
  puedeColocar as puedeColocarMotor,
  type Novedades,
  type PuntajeSitio,
} from "@solar-shield/engine";

export type Fase = "inicio" | "satelite" | "sitio" | "modulos" | "base" | "tormenta" | "final";

/** Estado de orquestación de la pantalla. Los recursos y el resultado viven en `estado` (motor). */
export interface Juego {
  fase: Fase;
  estado: GameState;
  colocados: Equipment[];
  sitio: PuntajeSitio | null;
  ultimas: Novedades | null;
  tormentaVista: boolean;
}

export type Evento =
  | { tipo: "nueva" }
  | { tipo: "restaurar"; juego: Juego }
  | { tipo: "fase"; fase: Fase }
  | { tipo: "accion"; accion: Action }
  | { tipo: "acciones"; acciones: Action[] }
  | { tipo: "dilema"; opcionId: string; previas?: Action[] | undefined }
  | { tipo: "tick" }
  | { tipo: "pausa"; pausado: boolean }
  | { tipo: "sitio"; sitio: PuntajeSitio }
  | { tipo: "modulo"; modulo: Equipment };

export function inicial(): Juego {
  return { fase: "inicio", estado: partidaDorada(), colocados: [], sitio: null, ultimas: null, tormentaVista: false };
}

/**
 * Delega en el motor la validez del módulo, el límite de la misión y los recursos disponibles,
 * restringiendo la colocación al paso `"modulos"` para evitar cobros duplicados.
 */
export function puedeColocar(j: Juego, modulo: Equipment): boolean {
  return (
    j.fase === "modulos" &&
    puedeColocarMotor(j.estado, modulo) &&
    puedeAplicar(j.estado, { tipo: "colocar_modulo", modulo }).ok
  );
}

export function reducir(j: Juego, e: Evento): Juego {
  switch (e.tipo) {
    case "nueva":
      return inicial();
    case "restaurar":
      return e.juego;
    case "fase":
      return { ...j, fase: e.fase };
    case "sitio":
      return { ...j, sitio: e.sitio, estado: aterrizar(j.estado, e.sitio.id), fase: "modulos" };
    case "modulo": {
      if (!puedeColocar(j, e.modulo)) return j;
      const estado = aplicarAccion(j.estado, { tipo: "colocar_modulo", modulo: e.modulo });
      if (estado === j.estado) return j;
      return { ...j, estado, colocados: modulosColocados(estado) as Equipment[] };
    }
    case "accion": {
      const estado = aplicarAccion(j.estado, e.accion);
      return estado === j.estado ? j : { ...j, estado };
    }
    case "acciones": {
      let s = j.estado;
      for (const a of e.acciones) s = aplicarAccion(s, a);
      return { ...j, estado: pausar(s, false), fase: "base" };
    }
    case "dilema": {
      let s = j.estado;
      for (const a of e.previas ?? []) s = aplicarAccion(s, a);
      const estado = elegirDilema(s, e.opcionId);
      return estado === s ? j : { ...j, estado: pausar(estado, false), fase: "base" };
    }
    case "pausa":
      return { ...j, estado: pausar(j.estado, e.pausado) };
    case "tick": {
      if (j.estado.pausado || j.estado.resultado !== "en_curso") return j;
      const sig = avanzarTick(j.estado);
      const n = novedades(j.estado, sig);
      if (sig.resultado !== "en_curso") return { ...j, estado: sig, ultimas: n, fase: "final" };
      if (n.tormentaLlego && !j.tormentaVista) {
        return { ...j, estado: pausar(sig, true), ultimas: n, fase: "tormenta", tormentaVista: true };
      }
      return { ...j, estado: n.pausar ? pausar(sig, true) : sig, ultimas: n };
    }
  }
}
