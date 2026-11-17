import * as THREE from "three";

/**
 * Wayfinding inside the base, after the corridor sheet (santiago/01_Escenario/01_Interiores/05_corredores):
 * a row of lit floor dashes that leads to each door, a yellow line across each threshold, and a lit sign by
 * the door with the room's pictogram. The sign has no words, so there is nothing to translate; the HUD hint
 * names the room when the kid is at the door.
 */

const PASO = 0.9;
const MARCA = new THREE.BoxGeometry(0.2, 0.012, 0.42);
const LUZ_GUIA = new THREE.MeshBasicMaterial({ name: "Guide_Dash", color: "#FFE3A8" });
const AMARILLO = new THREE.MeshBasicMaterial({ name: "Guide_Threshold", color: "#F2B531" });

/** A floor run from (x0, z0) to (x1, z1), in metres. */
export type Segmento = readonly [number, number, number, number];
/** A threshold: where the door is and the way it faces into the space (radians, 0 = +z). */
export interface Umbral { readonly x: number; readonly z: number; readonly giro: number }

/** Dashes along `segmentos` and threshold lines, two instanced meshes (two draw calls), at height `y`. */
export function guiaPiso(segmentos: readonly Segmento[], umbrales: readonly Umbral[], y: number, anchoUmbral = 1.8): THREE.Group {
  const g = new THREE.Group();
  g.name = "Guide_Floor";
  const marcas: [number, number, number][] = [];
  for (const [x0, z0, x1, z1] of segmentos) {
    const n = Math.max(1, Math.floor(Math.hypot(x1 - x0, z1 - z0) / PASO));
    const ang = Math.atan2(x1 - x0, z1 - z0);
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      marcas.push([x0 + (x1 - x0) * t, z0 + (z1 - z0) * t, ang]);
    }
  }
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), uno = new THREE.Vector3(1, 1, 1);
  const eje = new THREE.Vector3(0, 1, 0);
  const instancias = (geo: THREE.BufferGeometry, mat: THREE.Material, datos: readonly (readonly [number, number, number])[], escalaX = 1) => {
    const im = new THREE.InstancedMesh(geo, mat, Math.max(1, datos.length));
    im.count = datos.length;
    datos.forEach(([x, z, a], i) => im.setMatrixAt(i, m.compose(v.set(x, y, z), q.setFromAxisAngle(eje, a), uno.set(escalaX, 1, 1))));
    im.castShadow = false;
    im.receiveShadow = false;
    return im;
  };
  g.add(instancias(MARCA, LUZ_GUIA, marcas));
  // The line runs across the door: the box is long in x, turned with the door.
  const linea = new THREE.BoxGeometry(1, 0.012, 0.1);
  g.add(instancias(linea, AMARILLO, umbrales.map((u) => [u.x, u.z, u.giro] as const), anchoUmbral));
  return g;
}

type Trazo = (c: CanvasRenderingContext2D) => void;

/** Pictograms on a 128 px square, drawn as cyan strokes. */
const PICTOGRAMAS: Record<string, Trazo> = {
  taller: (c) => { // wrench
    c.beginPath(); c.moveTo(38, 92); c.lineTo(76, 54); c.stroke();
    c.beginPath(); c.arc(84, 46, 14, 0.9, 5.4); c.stroke();
  },
  habitat: (c) => { // bed
    c.strokeRect(26, 58, 76, 22);
    c.strokeRect(30, 46, 22, 12);
    c.beginPath(); c.moveTo(26, 80); c.lineTo(26, 92); c.moveTo(102, 80); c.lineTo(102, 92); c.stroke();
  },
  esclusa: (c) => { // helmet
    c.beginPath(); c.arc(64, 62, 30, 0, Math.PI * 2); c.stroke();
    c.strokeRect(46, 52, 36, 16);
  },
  control: (c) => { // globe
    c.beginPath(); c.arc(64, 64, 30, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.ellipse(64, 64, 12, 30, 0, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.moveTo(34, 64); c.lineTo(94, 64); c.stroke();
  },
  invernadero: (c) => { // sprout
    c.beginPath(); c.moveTo(64, 98); c.lineTo(64, 58); c.stroke();
    c.beginPath(); c.ellipse(50, 50, 16, 9, -0.6, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.ellipse(78, 44, 16, 9, 0.6, 0, Math.PI * 2); c.stroke();
  },
  pasillo: (c) => { // arrow
    c.beginPath(); c.moveTo(32, 64); c.lineTo(92, 64); c.moveTo(72, 44); c.lineTo(92, 64); c.lineTo(72, 84); c.stroke();
  },
  base: (c) => { // mountains and sun: outside
    c.beginPath(); c.moveTo(26, 92); c.lineTo(54, 52); c.lineTo(70, 74); c.lineTo(82, 60); c.lineTo(102, 92); c.closePath(); c.stroke();
    c.beginPath(); c.arc(88, 38, 9, 0, Math.PI * 2); c.stroke();
  },
};

/** A small lit sign with the pictogram of `destino`, facing +z; `lado` in metres. */
export function letrero(destino: string, lado = 0.42): THREE.Mesh {
  const lienzo = document.createElement("canvas");
  lienzo.width = lienzo.height = 128;
  const c = lienzo.getContext("2d");
  if (c) {
    c.fillStyle = "#1D1E2A";
    c.beginPath(); c.roundRect(4, 4, 120, 120, 18); c.fill();
    c.strokeStyle = "#5AE0F0";
    c.lineWidth = 7;
    c.lineCap = "round";
    c.lineJoin = "round";
    (PICTOGRAMAS[destino] ?? PICTOGRAMAS.pasillo!)(c);
  }
  const textura = new THREE.CanvasTexture(lienzo);
  textura.colorSpace = THREE.SRGBColorSpace;
  const placa = new THREE.Mesh(new THREE.PlaneGeometry(lado, lado), new THREE.MeshBasicMaterial({ map: textura, name: `Sign_${destino}` }));
  placa.name = `Sign_${destino}`;
  return placa;
}
