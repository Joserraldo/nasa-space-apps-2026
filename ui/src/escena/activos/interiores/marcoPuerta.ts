import * as THREE from "three";

/**
 * Doorway frame, our own build after the lit doorway of the interior references (María Paula's pick): a dark
 * frame with cut corners, small glowing triangles along its inner edge and a yellow and black hazard sill.
 * Shared geometry and materials; `marcoPuerta` places a copy centred on the origin, standing on y = 0,
 * `ancho` metres wide (x), its passage along z.
 */

const ANCHO = 2.4, ALTO = 2.3, FONDO = 0.5, BORDE = 0.28, CHAFLAN = 0.35;

function contorno(w: number, h: number, c: number, y0: number): THREE.Vector2[] {
  const x = w / 2;
  return [[-x + c, y0], [x - c, y0], [x, y0 + c], [x, y0 + h - c], [x - c, y0 + h], [-x + c, y0 + h], [-x, y0 + h - c], [-x, y0 + c]]
    .map(([a, b]) => new THREE.Vector2(a, b));
}

interface Piezas { marco: THREE.BufferGeometry; luz: THREE.BufferGeometry; umbral: THREE.BufferGeometry; materiales: [THREE.Material, THREE.Material, THREE.Material] }
let piezas: Piezas | null = null;

function crearPiezas(): Piezas {
  const forma = new THREE.Shape(contorno(ANCHO, ALTO, CHAFLAN, 0));
  // The hole reaches just below the floor line, so the frame is open at the bottom and the sill closes it.
  forma.holes.push(new THREE.Path(contorno(ANCHO - 2 * BORDE, ALTO - BORDE + 0.01, CHAFLAN * 0.7, -0.01).reverse()));
  const marco = new THREE.ExtrudeGeometry(forma, { depth: FONDO, bevelEnabled: false }).translate(0, 0, -FONDO / 2);
  const luz = new THREE.CircleGeometry(0.07, 3);
  // Hazard stripes painted once on a tiny canvas.
  const lienzo = document.createElement("canvas");
  lienzo.width = 64;
  lienzo.height = 8;
  const g = lienzo.getContext("2d");
  if (g) {
    g.fillStyle = "#1D1E2A";
    g.fillRect(0, 0, 64, 8);
    g.fillStyle = "#E3B51F";
    for (let i = -8; i < 64; i += 8) {
      g.beginPath();
      g.moveTo(i, 8); g.lineTo(i + 4, 0); g.lineTo(i + 8, 0); g.lineTo(i + 4, 8);
      g.fill();
    }
  }
  const textura = new THREE.CanvasTexture(lienzo);
  textura.colorSpace = THREE.SRGBColorSpace;
  textura.magFilter = THREE.NearestFilter;
  const umbral = new THREE.BoxGeometry(ANCHO - 2 * BORDE, 0.05, FONDO).translate(0, 0.025, 0);
  return {
    marco, luz, umbral,
    materiales: [
      new THREE.MeshStandardMaterial({ name: "Doorway_Frame", color: "#2B2C38", roughness: 0.6 }),
      new THREE.MeshBasicMaterial({ name: "Doorway_Light", color: "#CFE9FF", side: THREE.DoubleSide }),
      new THREE.MeshStandardMaterial({ name: "Doorway_Sill", map: textura, roughness: 0.7 }),
    ],
  };
}

/** A frame `ancho` m wide, added to `destino` at (x, z) turned `giro` radians. */
export function marcoPuerta(destino: THREE.Object3D, x: number, z: number, giro: number, ancho: number): void {
  piezas ??= crearPiezas();
  const [mMarco, mLuz, mUmbral] = piezas.materiales;
  const g = new THREE.Group();
  g.name = "Doorway";
  const marco = new THREE.Mesh(piezas.marco, mMarco);
  marco.castShadow = true;
  marco.receiveShadow = true;
  g.add(marco, new THREE.Mesh(piezas.umbral, mUmbral));
  // Glowing triangles on both faces: three up each side pointing in, three along the top pointing down.
  const xm = ANCHO / 2 - BORDE / 2, ym = ALTO - BORDE / 2;
  const puntos: [number, number, number][] = [
    ...[0.5, 1.1, 1.7].flatMap((y): [number, number, number][] => [[-xm, y, 0], [xm, y, Math.PI]]),
    ...[-0.5, 0, 0.5].map((px): [number, number, number] => [px, ym, -Math.PI / 2]),
  ];
  for (const cara of [1, -1]) {
    for (const [px, py, giroLuz] of puntos) {
      const l = new THREE.Mesh(piezas.luz, mLuz);
      l.position.set(px, py, cara * (FONDO / 2 + 0.01));
      l.rotation.z = giroLuz;
      g.add(l);
    }
  }
  g.scale.setScalar(ancho / ANCHO);
  g.position.set(x, 0, z);
  g.rotation.y = giro;
  destino.add(g);
}
