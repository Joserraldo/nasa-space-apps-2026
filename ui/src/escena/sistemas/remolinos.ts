/**
 * Remolinos de polvo a lo lejos (Frente D, D6). Dueño: Frente D. Solo ambiente: no tocan recursos ni
 * la misión (MECANICAS §5) y quedan lejos de la base, más allá de donde se camina.
 *
 * Fuente verificada por el frente B (`agents/DATOS-MARTE.md`, fila `remolino`, [V]): NASA, "Dust Devils on
 * Mars" (imagen del MRO en Nili Fossae), https://science.nasa.gov/resource/dust-devils-on-mars/. Los
 * remolinos se forman cuando el Sol calienta el suelo: aparecen de día y no en el atardecer del final.
 *
 * Tres embudos translúcidos de color polvo (más opacos abajo, se desvanecen arriba), en un solo
 * `InstancedMesh` (1 draw call). Se desplazan despacio alrededor de la base y se mecen; con movimiento
 * reducido quedan quietos.
 */
import * as THREE from "three";
import { colorToken } from "../materiales";
import type { ContextoSistema, SistemaEscena } from "../escena3d";
import type { FaseVista } from "../vista";

/** Remolinos: distancia a la base (m), alto (m), rumbo inicial (rad) y fase de su vaivén. [E] */
export const REMOLINOS = [
  // Rumbos alrededor de π: delante de la cámara de inicio, que mira hacia -z.
  { radio: 85, alto: 26, rumbo: 2.75, fase: 0 },
  { radio: 120, alto: 34, rumbo: 3.45, fase: 2.1 },
  { radio: 70, alto: 18, rumbo: 3.95, fase: 4.0 },
] as const;
/** Velocidad del desplazamiento alrededor de la base (rad/s) y opacidad en la base del embudo. [E] */
export const MOVIMIENTO_REMOLINO = { deriva: 0.006, giro: 0.8, opacidad: 0.45 } as const;

/** Se ven de día y de tarde; no en el atardecer del final (sin calor del Sol no se forman). */
export function hayRemolinos(fase: FaseVista | null | undefined): boolean {
  return fase !== "final";
}

/** Embudo abierto de alto 1, más ancho arriba, con alfa por vértice: opaco abajo y 0 arriba. */
function embudo(): THREE.BufferGeometry {
  const g = new THREE.CylinderGeometry(0.16, 0.05, 1, 10, 3, true);
  g.translate(0, 0.5, 0);
  const pos = g.getAttribute("position");
  const col = new Float32Array(pos.count * 4);
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    col.set([1, 1, 1, MOVIMIENTO_REMOLINO.opacidad * Math.pow(1 - y, 1.5)], i * 4);
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 4));
  return g;
}

/** Posición, giro y escala del remolino `i` en el tiempo `t` (s); `quieto` sin movimiento. */
export function poseRemolino(i: number, t: number, quieto: boolean, destino = new THREE.Matrix4()): THREE.Matrix4 {
  const r = REMOLINOS[i]!;
  const k = quieto ? 0 : t;
  const rumbo = r.rumbo + MOVIMIENTO_REMOLINO.deriva * k;
  const vaiven = quieto ? 0 : 0.08 * Math.sin(0.7 * k + r.fase);
  const giro = new THREE.Quaternion().setFromEuler(new THREE.Euler(vaiven, MOVIMIENTO_REMOLINO.giro * k + r.fase, vaiven * 0.5));
  const pulso = 1 + (quieto ? 0 : 0.06 * Math.sin(1.3 * k + r.fase));
  return destino.compose(
    new THREE.Vector3(Math.sin(rumbo) * r.radio, 0, Math.cos(rumbo) * r.radio),
    giro,
    new THREE.Vector3(r.alto * pulso, r.alto, r.alto * pulso),
  );
}

export function crearSistema(): SistemaEscena {
  let malla: THREE.InstancedMesh | null = null;
  let t = 0;
  const m = new THREE.Matrix4();
  return {
    id: "remolinos",
    montar(ctx: ContextoSistema) {
      const material = new THREE.MeshBasicMaterial({
        color: colorToken("regolito-claro").lerp(colorToken("sombra-suelo"), 0.5),
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      material.name = "Dust_Devil";
      malla = new THREE.InstancedMesh(embudo(), material, REMOLINOS.length);
      malla.name = "Dust_Devils";
      malla.frustumCulled = false;
      malla.castShadow = false;
      malla.receiveShadow = false;
      ctx.escena.add(malla);
    },
    actualizar(dt: number, ctx: ContextoSistema) {
      if (!malla) return;
      malla.visible = hayRemolinos(ctx.vista?.fase);
      if (!malla.visible) return;
      t += dt;
      for (let i = 0; i < REMOLINOS.length; i++) malla.setMatrixAt(i, poseRemolino(i, t, ctx.reducido, m));
      malla.instanceMatrix.needsUpdate = true;
    },
    dispose() {
      if (!malla) return;
      malla.removeFromParent();
      malla.geometry.dispose();
      (malla.material as THREE.Material).dispose();
      malla.dispose();
      malla = null;
    },
  };
}
