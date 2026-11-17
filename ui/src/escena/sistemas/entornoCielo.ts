/**
 * Iluminación de entorno del cielo procedural (Etapa A). Genera un `envMap` con `PMREMGenerator` desde
 * `cielo.escenaEntorno` (el mismo shader del domo, con regolito debajo del horizonte; nunca una foto) y lo
 * pone en `escena.environment`: metal y vidrio reflejan el cielo y el cielo rellena las sombras.
 *
 * Interruptor: `AJUSTE_CALIDAD[calidad].entorno` (sin entorno en `baja`). Se regenera solo cuando el
 * ciclo del día movió el cielo lo suficiente (`UMBRAL`), no en cada fotograma. Corre después de
 * `cicloDia` (orden por nombre). No toca recursos.
 */
import * as THREE from "three";
import { AJUSTE_CALIDAD } from "../calidad";
import type { EstadoCielo } from "../cielo";
import type { ContextoSistema, SistemaEscena } from "../escena3d";

/** Cambio mínimo de mezcla, noche o altura del Sol para volver a generar el entorno. [E] */
export const UMBRAL = 0.04;

/** ¿El cielo cambió lo suficiente desde el último entorno? */
export function cambioCielo(a: Readonly<EstadoCielo> | null, b: Readonly<EstadoCielo>, umbral = UMBRAL): boolean {
  if (!a) return true;
  return Math.abs(a.mezcla - b.mezcla) >= umbral || Math.abs(a.noche - b.noche) >= umbral || Math.abs(a.dirSol.y - b.dirSol.y) >= umbral;
}

export function crearSistema(): SistemaEscena {
  let pmrem: THREE.PMREMGenerator | null = null;
  let objetivo: THREE.WebGLRenderTarget | null = null;
  let ultimo: EstadoCielo | null = null;
  let escena: THREE.Scene | null = null;
  return {
    id: "entorno-cielo",
    montar(ctx) {
      escena = ctx.escena;
    },
    actualizar(_dt: number, ctx: ContextoSistema) {
      const textura = objetivo?.texture ?? null;
      if (!AJUSTE_CALIDAD[ctx.calidad].entorno) {
        if (textura && ctx.escena.environment === textura) ctx.escena.environment = null;
        return;
      }
      const e = ctx.cielo.estado;
      if (textura && !cambioCielo(ultimo, e)) {
        if (ctx.escena.environment !== textura) ctx.escena.environment = textura;
        return;
      }
      pmrem ??= new THREE.PMREMGenerator(ctx.renderer);
      const nuevo = pmrem.fromScene(ctx.cielo.escenaEntorno, 0, 0.1, 100);
      ctx.escena.environment = nuevo.texture;
      objetivo?.dispose();
      objetivo = nuevo;
      ultimo = { mezcla: e.mezcla, noche: e.noche, dirSol: { ...e.dirSol } };
    },
    dispose() {
      if (escena && objetivo && escena.environment === objetivo.texture) escena.environment = null;
      objetivo?.dispose();
      pmrem?.dispose();
      objetivo = null;
      pmrem = null;
    },
  };
}
