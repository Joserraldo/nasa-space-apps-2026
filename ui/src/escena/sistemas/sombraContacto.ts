/**
 * Sombra de contacto de los personajes (Frente D, D2). Dueño: Frente D.
 * Una mancha suave bajo cada personaje (`personaje-*`) y bajo Iris, para que nadie parezca flotar:
 * en `alta` y `media` suma al Sol; en `baja`, que no tiene sombras, es lo único que los apoya.
 * Todas en un solo `InstancedMesh` (1 draw call). Al saltar, la mancha se achica. No toca recursos.
 */
import * as THREE from "three";
import { colorToken } from "../materiales";
import { alturaSuelo } from "../fisica";
import { TERRENO } from "../mundo";
import { CAMINO, distanciaPlaza } from "../activos/caminos";
import type { ContextoSistema, SistemaEscena } from "../escena3d";

/** Radio de la mancha (m) por tipo, y opacidad en el centro (el borde va a 0). [E] */
export const CONTACTO = { radioPersona: 0.42, radioIris: 0.55, opacidad: 0.45, maximo: 8, sobreSuelo: 0.015 } as const;

/** Escala de la mancha según la altura sobre el suelo: 1 apoyado, más chica al subir, nunca menos de 0,4. */
export function escalaContacto(altura: number): number {
  return Math.max(0.4, 1 / (1 + 1.5 * Math.max(0, altura)));
}

/**
 * Altura de la mancha sobre el suelo de la física: encima de la plaza (10 cm) si el personaje está en
 * ella y, si no, encima de la losa de los caminos (5 cm), para que ningún pavimento la tape.
 */
export function alturaMancha(x: number, z: number): number {
  return (distanciaPlaza(x, z) < 0.2 ? CAMINO.altoPlaza : CAMINO.altoLosa) + CONTACTO.sobreSuelo;
}

/** Disco de radio 1 con alfa por vértice: opaco en el centro y transparente en el borde. */
function discoSuave(): THREE.BufferGeometry {
  const g = new THREE.CircleGeometry(1, 12);
  g.rotateX(-Math.PI / 2);
  const n = g.getAttribute("position").count;
  const col = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) col.set([1, 1, 1, i === 0 ? CONTACTO.opacidad : 0], i * 4);
  g.setAttribute("color", new THREE.BufferAttribute(col, 4));
  return g;
}

/** Personajes a los que se les pone mancha: los grupos `personaje-*` y `iris`. */
export function buscarPersonajes(raiz: THREE.Object3D): { objeto: THREE.Object3D; radio: number }[] {
  const salida: { objeto: THREE.Object3D; radio: number }[] = [];
  raiz.traverse((o) => {
    if (o.name.startsWith("personaje-")) salida.push({ objeto: o, radio: CONTACTO.radioPersona });
    else if (o.name === "iris") salida.push({ objeto: o, radio: CONTACTO.radioIris });
  });
  return salida.slice(0, CONTACTO.maximo);
}

export function crearSistema(): SistemaEscena {
  let malla: THREE.InstancedMesh | null = null;
  let personajes: ReturnType<typeof buscarPersonajes> = [];
  const pos = new THREE.Vector3();
  const m = new THREE.Matrix4();
  const escala = new THREE.Vector3();
  const giro = new THREE.Quaternion();
  return {
    id: "sombra-contacto",
    montar(ctx: ContextoSistema) {
      // Sombra teñida, nunca negra (DISEÑO §3.3): basalto hacia el índigo de las botas.
      const material = new THREE.MeshBasicMaterial({
        color: colorToken("roca-basalto").lerp(colorToken("indigo-botas"), 0.5),
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      });
      material.name = "Contact_Shadow";
      malla = new THREE.InstancedMesh(discoSuave(), material, CONTACTO.maximo);
      malla.name = "Contact_Shadows";
      malla.count = 0;
      malla.frustumCulled = false;
      malla.renderOrder = 1;
      ctx.escena.add(malla);
    },
    actualizar(_dt: number, ctx: ContextoSistema) {
      if (!malla) return;
      // Los personajes pueden llegar después del montaje: se buscan hasta encontrarlos.
      if (personajes.length === 0) personajes = buscarPersonajes(ctx.escena);
      let i = 0;
      for (const p of personajes) {
        if (!p.objeto.visible || !p.objeto.parent) continue;
        p.objeto.getWorldPosition(pos);
        const suelo = alturaSuelo(pos.x, pos.z, TERRENO);
        const r = p.radio * escalaContacto(pos.y - suelo);
        m.compose(pos.set(pos.x, suelo + alturaMancha(pos.x, pos.z), pos.z), giro, escala.set(r, 1, r));
        malla.setMatrixAt(i++, m);
      }
      malla.count = i;
      malla.instanceMatrix.needsUpdate = true;
    },
    dispose() {
      if (!malla) return;
      malla.removeFromParent();
      malla.geometry.dispose();
      (malla.material as THREE.Material).dispose();
      malla.dispose();
      malla = null;
      personajes = [];
    },
  };
}
