/**
 * Filtro de la sombra del Sol según la calidad (Frente D, D4). Dueño: Frente D.
 * `escena3d.ts` aplica DPR, tamaño de sombra y antialias; el tipo de filtro lo pone este sistema
 * (`AJUSTE_CALIDAD[calidad].filtroSombra`). Three no recompila los materiales al cambiar el tipo de
 * sombra, así que al cambiarlo se marcan todos los de la escena. No toca recursos.
 */
import * as THREE from "three";
import { AJUSTE_CALIDAD, type FiltroSombra } from "../calidad";
import type { ContextoSistema, SistemaEscena } from "../escena3d";

const TIPO: Readonly<Record<FiltroSombra, THREE.ShadowMapType>> = { suave: THREE.PCFSoftShadowMap, simple: THREE.BasicShadowMap };

/** Tipo de sombra de three para una calidad; `null` si esa calidad no tiene sombras (no se toca). */
export function tipoSombra(calidad: ContextoSistema["calidad"]): THREE.ShadowMapType | null {
  const f = AJUSTE_CALIDAD[calidad].filtroSombra;
  return f ? TIPO[f] : null;
}

/** Marca para recompilar todos los materiales de la escena (una vez por cambio de filtro). */
function recompilar(escena: THREE.Object3D): void {
  escena.traverse((o) => {
    const m = (o as THREE.Mesh).material;
    if (!m) return;
    for (const x of Array.isArray(m) ? m : [m]) x.needsUpdate = true;
  });
}

/** Pone el tipo de sombra de `calidad`; devuelve true si cambió (y marcó los materiales). */
export function aplicarFiltro(ctx: Pick<ContextoSistema, "renderer" | "escena" | "calidad">): boolean {
  const tipo = tipoSombra(ctx.calidad);
  if (tipo === null || ctx.renderer.shadowMap.type === tipo) return false;
  ctx.renderer.shadowMap.type = tipo;
  ctx.renderer.shadowMap.needsUpdate = true;
  recompilar(ctx.escena);
  return true;
}

export function crearSistema(): SistemaEscena {
  return {
    id: "filtro-sombra",
    montar(ctx) {
      aplicarFiltro(ctx);
    },
    actualizar(_dt, ctx) {
      aplicarFiltro(ctx);
    },
    dispose() {},
  };
}
