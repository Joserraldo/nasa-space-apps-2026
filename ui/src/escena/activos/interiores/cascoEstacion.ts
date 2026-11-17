import * as THREE from "three";
import { fusionar } from "../fusionar";

/**
 * The shell of the station rooms, built in code (no external mesh): floor, walls, the large gate with a lit
 * stretch of corridor behind it, the long window and the airlock pad. Same sizes and colours as the low poly
 * station look the rooms had: white walls 3.2 m tall and 0.4 m thick with a blue base line, a grey panelled
 * floor, a blocky white gate with blue and cyan lights, purple trims.
 *
 * Builders work in metres. A wall run grows along +x from 0, its inner face on z = 0 facing +z (the room) and
 * its thickness toward -z; a gate is centred on x = 0 on that same line. The room turns and places them.
 */

export const ALTO_MURO = 3.2;
export const GROSOR_MURO = 0.4;
/** Width of the gap a gate fills in a wall run. */
export const ANCHO_PUERTA = 3.2;
/** Depth of the stretch of corridor behind a gate, from the wall line. */
export const FONDO_TRAMO = 4.2;

const estandar = (name: string, color: string, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ name, color, roughness: 0.8, metalness: 0, ...extra });
const BLANCO = estandar("Shell_White", "#F2F0EC");
const CANTO = estandar("Shell_Cap", "#E4DED6");
const JUNTA = estandar("Shell_Seam", "#CFCBD3");
const PISO = estandar("Shell_Floor", "#C2C0CC", { roughness: 0.75 });
const PANEL = estandar("Shell_Floor_Panel", "#CFCDD8", { roughness: 0.7 });
const GRIS = estandar("Shell_Metal", "#B9B8C2");
const OSCURO = estandar("Shell_Dark", "#2B2C38");
const MORADO = estandar("Shell_Purple", "#7C5CC4");
const AZUL = new THREE.MeshBasicMaterial({ name: "Shell_Blue", color: "#2F8EEA" });
const CIAN = new THREE.MeshBasicMaterial({ name: "Shell_Glow", color: "#5AB4FF" });
const VIDRIO = estandar("Shell_Window", "#CFE6FF", { roughness: 0.1, transparent: true, opacity: 0.22, depthWrite: false });

function caja(w: number, h: number, d: number, mat: THREE.Material, x: number, y: number, z: number, nombre: string): THREE.Mesh {
  const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  o.name = nombre;
  o.position.set(x, y, z);
  o.castShadow = mat !== VIDRIO && !(mat instanceof THREE.MeshBasicMaterial);
  o.receiveShadow = true;
  return o;
}

/** Floor of `ancho` x `fondo` m centred on the origin, top at y = 0: a slab and a grid of raised panels (instanced). */
export function pisoSala(ancho: number, fondo: number): THREE.Group {
  const g = new THREE.Group();
  g.name = "Shell_Floor";
  const losa = caja(ancho, 0.05, fondo, PISO, 0, -0.025, 0, "Shell_Floor_Slab");
  losa.castShadow = false;
  const paso = 0.8;
  const nx = Math.floor(ancho / paso), nz = Math.floor(fondo / paso);
  const paneles = new THREE.InstancedMesh(new THREE.BoxGeometry(paso - 0.14, 0.02, paso - 0.14), PANEL, nx * nz);
  paneles.name = "Shell_Floor_Panels";
  const m = new THREE.Matrix4();
  let i = 0;
  for (let a = 0; a < nx; a++) for (let b = 0; b < nz; b++) {
    paneles.setMatrixAt(i++, m.makeTranslation(-ancho / 2 + paso * (a + 0.5), 0.01, -fondo / 2 + paso * (b + 0.5)));
  }
  paneles.receiveShadow = true;
  g.add(losa, paneles);
  return g;
}

/** A plain wall run of `largo` m: white body, lighter cap, blue base line and panel seams every 1.6 m. */
export function muro(largo: number): THREE.Group {
  const g = new THREE.Group();
  const t = GROSOR_MURO;
  g.add(
    caja(largo, ALTO_MURO, t, BLANCO, largo / 2, ALTO_MURO / 2, -t / 2, "Wall_Body"),
    caja(largo, 0.08, t + 0.04, CANTO, largo / 2, ALTO_MURO + 0.04, -t / 2, "Wall_Cap"),
    caja(largo, 0.09, 0.03, AZUL, largo / 2, 0.16, 0.015, "Wall_BaseLine"),
  );
  for (let x = 1.6; x < largo - 0.2; x += 1.6) g.add(caja(0.05, ALTO_MURO - 0.5, 0.02, JUNTA, x, ALTO_MURO / 2 + 0.1, 0.01, "Wall_Seam"));
  return g;
}

/**
 * A wall run of `largo` m with a long window in its middle: low sill, header, a clear pane (Mars shows through),
 * purple frame and dark mullions.
 */
export function ventanaLarga(largo: number): THREE.Group {
  const g = new THREE.Group();
  const t = GROSOR_MURO, abajo = 0.9, arriba = 2.7, borde = 0.5;
  const w = largo - 2 * borde, cx = largo / 2;
  g.add(
    caja(largo, abajo, t, BLANCO, cx, abajo / 2, -t / 2, "Window_Sill"),
    caja(largo, ALTO_MURO - arriba, t, BLANCO, cx, (ALTO_MURO + arriba) / 2, -t / 2, "Window_Header"),
    caja(borde, arriba - abajo, t, BLANCO, borde / 2, (abajo + arriba) / 2, -t / 2, "Window_Jamb"),
    caja(borde, arriba - abajo, t, BLANCO, largo - borde / 2, (abajo + arriba) / 2, -t / 2, "Window_Jamb"),
    caja(largo, 0.08, t + 0.04, CANTO, cx, ALTO_MURO + 0.04, -t / 2, "Window_Cap"),
    caja(largo, 0.09, 0.03, AZUL, cx, 0.16, 0.015, "Window_BaseLine"),
    caja(w, arriba - abajo, 0.03, VIDRIO, cx, (abajo + arriba) / 2, -t / 2, "Window_Pane"),
    caja(w + 0.1, 0.1, 0.08, MORADO, cx, abajo, 0.02, "Window_FrameLow"),
    caja(w + 0.1, 0.1, 0.08, MORADO, cx, arriba, 0.02, "Window_FrameHigh"),
  );
  const n = Math.max(2, Math.round(w / 1.3));
  for (let k = 1; k < n; k++) g.add(caja(0.07, arriba - abajo, 0.07, OSCURO, borde + (w * k) / n, (abajo + arriba) / 2, -t / 2, "Window_Mullion"));
  return g;
}

/**
 * The large gate, centred on x = 0 across the wall line (0.6 m into the room, 1 m out): two pillars, a lintel
 * with two round lights and a blue line, cyan strips inside the pillars and floor rails. Behind it, a stretch of
 * corridor (floor, side walls, end wall, a cool light) so the opening never shows a black hole.
 */
export function puertaConTramo(): THREE.Group {
  const g = new THREE.Group();
  const hueco = 2.3, pilar = (ANCHO_PUERTA - hueco) / 2, frente = 0.6, atras = -1.0;
  const fondo = frente - atras, cz = (frente + atras) / 2, alto = 2.4;
  for (const s of [-1, 1]) {
    const x = s * (hueco / 2 + pilar / 2);
    g.add(
      caja(pilar, ALTO_MURO, fondo, BLANCO, x, ALTO_MURO / 2, cz, "Gate_Pillar"),
      caja(0.04, alto - 0.3, 0.12, CIAN, s * (hueco / 2 + 0.01), alto / 2, frente - 0.25, "Gate_Strip"),
      caja(0.14, 0.12, fondo, GRIS, s * 0.9, 0.06, cz, "Gate_Rail"),
      caja(0.34, 0.34, 0.04, CIAN, s * 0.75, alto + 0.42, frente + 0.02, "Gate_Lamp"),
    );
  }
  g.add(
    caja(ANCHO_PUERTA, ALTO_MURO - alto, fondo, BLANCO, 0, (ALTO_MURO + alto) / 2, cz, "Gate_Lintel"),
    caja(ANCHO_PUERTA + 0.04, 0.08, fondo + 0.04, CANTO, 0, ALTO_MURO + 0.04, cz, "Gate_Cap"),
    caja(hueco, 0.1, 0.03, AZUL, 0, alto + 0.08, frente + 0.015, "Gate_Line"),
    caja(hueco, 0.03, fondo, GRIS, 0, 0.015, cz, "Gate_Threshold"),
  );
  // The stretch of corridor behind the gate.
  const z0 = atras, z1 = -FONDO_TRAMO, largo = z0 - z1;
  const piso = pisoSala(ANCHO_PUERTA, largo);
  piso.position.z = (z0 + z1) / 2;
  const izquierda = muro(largo), derecha = muro(largo), fin = muro(ANCHO_PUERTA + 2 * GROSOR_MURO);
  izquierda.rotation.y = Math.PI / 2;
  izquierda.position.set(-ANCHO_PUERTA / 2, 0, z0);
  derecha.rotation.y = -Math.PI / 2;
  derecha.position.set(ANCHO_PUERTA / 2, 0, z1);
  fin.position.set(-ANCHO_PUERTA / 2 - GROSOR_MURO, 0, z1);
  const luz = new THREE.PointLight("#9CCBFF", 3, 5, 2);
  luz.position.set(0, 1.8, (z0 + z1) / 2);
  g.add(fusionar(grupoDe(izquierda, derecha, fin, ...g.children.splice(0)), "Gate_And_Stretch"), piso, luz);
  return g;
}

const grupoDe = (...hijos: THREE.Object3D[]) => {
  const g = new THREE.Group();
  g.add(...hijos);
  return g;
};

/** The airlock pad, 2.4 m square, centred, a touch above the floor: grey plate, white octagon, purple marks. */
export function padEsclusa(): THREE.Group {
  const g = new THREE.Group();
  g.name = "Airlock_Pad";
  const octogono = (r: number, h: number, mat: THREE.Material, y: number, nombre: string) => {
    const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 8), mat);
    o.rotation.y = Math.PI / 8;
    o.position.y = y;
    o.name = nombre;
    o.receiveShadow = true;
    return o;
  };
  g.add(
    caja(2.4, 0.02, 2.4, BLANCO, 0, 0.01, 0, "Pad_Plate"),
    octogono(1.0, 0.03, GRIS, 0.025, "Pad_Ring"),
    octogono(0.78, 0.04, BLANCO, 0.03, "Pad_Centre"),
  );
  for (let k = 0; k < 4; k++) {
    const a = (k * Math.PI) / 2;
    const marca = caja(0.5, 0.025, 0.16, MORADO, Math.sin(a) * 1.08, 0.03, Math.cos(a) * 1.08, "Pad_Mark");
    marca.rotation.y = a;
    g.add(marca);
  }
  return g;
}

/** Fuses a wall run's pieces by material: one draw call per material, whatever the number of seams. */
export function fusionarMuro(g: THREE.Group, nombre: string): THREE.Group {
  return fusionar(g, nombre);
}
