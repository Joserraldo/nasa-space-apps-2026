import * as THREE from "three";

/**
 * Ground and rock textures, on by default; `?texturas=0` turns them off (CC0, Poly Haven, 512 px WebP; sources in
 * the PR). `?mundo=luna` previews the Moon set; the default is Mars. When the multi-mission chain lands
 * (#410/#411), the world should come from the active mission instead of the URL.
 *
 * Textures never change the palette: meshes keep their vertex colors and the textures only add relief
 * (normal map), roughness variation (G channel of `arm`) and a subtle speckle (grayscale detail map,
 * remapped to 0.88-1.0 so it stays a soft grain next to the flat-shaded props; the base color compensates its measured mean). Meshes have no UVs, so they are
 * projected in object space: top-down for the terrain, per face (dominant normal axis) for rocks.
 */

export type MundoTextura = "marte" | "luna";

interface Juego {
  /** Folder under `public/texturas/`. */
  carpeta: MundoTextura;
  archivo: { detalle: string; normal: string; arm?: string };
  /** Measured mean of the detail map (0-1). */
  media: number;
  /** Units covered by one texture tile. */
  tesela: number;
  intensidadNormal: number;
}

const SUELO: Readonly<Record<MundoTextura, Juego>> = {
  marte: { carpeta: "marte", archivo: { detalle: "suelo_detalle.webp", normal: "suelo_normal.webp", arm: "suelo_arm.webp" }, media: 237 / 255, tesela: 3, intensidadNormal: 0.3 },
  luna: { carpeta: "luna", archivo: { detalle: "suelo_detalle.webp", normal: "suelo_normal.webp", arm: "suelo_arm.webp" }, media: 240 / 255, tesela: 3, intensidadNormal: 0.45 },
};

const ROCA: Readonly<Record<MundoTextura, Juego>> = {
  marte: { carpeta: "marte", archivo: { detalle: "roca_detalle.webp", normal: "roca_normal.webp" }, media: 240 / 255, tesela: 1.2, intensidadNormal: 0.4 },
  luna: { carpeta: "luna", archivo: { detalle: "roca_detalle.webp", normal: "roca_normal.webp" }, media: 240 / 255, tesela: 1.2, intensidadNormal: 0.4 },
};

export function texturasSueloActivas(): boolean {
  if (typeof location === "undefined") return false;
  // Activas por defecto; `?texturas=0` vuelve al suelo liso para comparar.
  return new URLSearchParams(location.search).get("texturas") !== "0";
}

export function mundoTextura(): MundoTextura {
  if (typeof location === "undefined") return "marte";
  return new URLSearchParams(location.search).get("mundo") === "luna" ? "luna" : "marte";
}

const cargador = new THREE.TextureLoader();
const cache = new Map<string, THREE.Texture>();

function textura(carpeta: string, archivo: string): THREE.Texture {
  const url = `${import.meta.env.BASE_URL}texturas/${carpeta}/${archivo}`;
  let t = cache.get(url);
  if (!t) {
    t = cargador.load(url);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 4;
    // All maps are linear on purpose: detail is a multiplier, normal and arm are data.
    cache.set(url, t);
  }
  return t;
}

function materialTexturado(base: THREE.MeshStandardMaterial, j: Juego, nombre: string, tinte: string | null): THREE.MeshStandardMaterial {
  const m = base.clone();
  m.name = nombre;
  m.map = textura(j.carpeta, j.archivo.detalle);
  if (tinte) {
    // Preview of another world: a flat ground color instead of the Martian vertex colors.
    m.vertexColors = false;
    m.color.set(tinte).multiplyScalar(1 / j.media);
  } else {
    m.color.setScalar(1 / j.media);
  }
  m.normalMap = textura(j.carpeta, j.archivo.normal);
  m.normalScale.setScalar(j.intensidadNormal);
  if (j.archivo.arm) {
    m.roughnessMap = textura(j.carpeta, j.archivo.arm);
    m.roughness = 1;
  }
  return m;
}

/** Top-down planar UVs (x, z). */
function uvPlanas(geo: THREE.BufferGeometry, tesela: number): void {
  const pos = geo.getAttribute("position");
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = pos.getX(i) / tesela;
    uv[i * 2 + 1] = pos.getZ(i) / tesela;
  }
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
}

/** Per-face box projection: each vertex uses the two axes orthogonal to its (flat) normal's dominant axis. */
function uvCaja(geo: THREE.BufferGeometry, tesela: number): void {
  if (geo.userData.uvCaja) return; // shared cached geometry: once is enough
  const pos = geo.getAttribute("position");
  const nor = geo.getAttribute("normal");
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const ax = Math.abs(nor.getX(i)), ay = Math.abs(nor.getY(i)), az = Math.abs(nor.getZ(i));
    const [a, b] = ay >= ax && ay >= az ? [pos.getX(i), pos.getZ(i)] : ax >= az ? [pos.getZ(i), pos.getY(i)] : [pos.getX(i), pos.getY(i)];
    uv[i * 2] = a / tesela;
    uv[i * 2 + 1] = b / tesela;
  }
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  geo.userData.uvCaja = true;
}

/** Gives the terrain its own textured material (clone of the shared `Rock`). */
export function aplicarTexturasSuelo(malla: THREE.Mesh, mundo: MundoTextura = mundoTextura(), tinte: string | null = null): void {
  const j = SUELO[mundo];
  uvPlanas(malla.geometry, j.tesela);
  malla.material = materialTexturado(malla.material as THREE.MeshStandardMaterial, j, "Terrain_Textured", tinte);
}

/** Textures every rock mesh with one shared material (one extra shader program for all rocks). */
export function aplicarTexturasRocas(mallas: readonly THREE.Mesh[], mundo: MundoTextura = mundoTextura(), tinte: string | null = null): void {
  const primera = mallas[0];
  if (!primera) return;
  const j = ROCA[mundo];
  const m = materialTexturado(primera.material as THREE.MeshStandardMaterial, j, "Rock_Textured", tinte);
  if (tinte) m.color.multiplyScalar(0.78); // rocks a bit darker than the ground they sit on
  for (const malla of mallas) {
    uvCaja(malla.geometry, j.tesela);
    malla.material = m;
  }
}
