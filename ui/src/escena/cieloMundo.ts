import * as THREE from "three";
import { fijarDireccionSol, RADIO_DOMO, type Cielo } from "./cielo";
import type { MundoTextura } from "./texturasSuelo";

/**
 * Experimental: sky, light and celestial bodies per world, behind `?mundo=<id>`.
 *
 * Each mission tells its story through the sky (missions/src):
 * - `marte`: Jezero, the playable route. Unchanged: the day cycle and the dome stay as they are.
 * - `marte-noche`: Mars north pole, "Sin Sol, ¿de dónde sale la energía?". Polar night with stars,
 *   Phobos and Deimos and icy ground. Night is the point of this mission (Jezero has no night on
 *   purpose, cicloDia.ts).
 * - `luna`: Moon south pole, "el agua se esconde en la oscuridad y la energía vive en la luz". No air:
 *   dark sky, the Sun grazes the horizon (true at the lunar poles), long hard shadows, Earth low.
 * - `luna-noche`: Moon near side, "la noche larga". Night with Earth high in the sky; the soft blue
 *   light is earthshine.
 * The outpost ship is not here: it has no ground and needs its own scene.
 *
 * Real data, game look: no photos. Star positions and brightness come from NASA SVS 4851 "Deep Star
 * Maps 2020" (`public/texturas/cielo/estrellas.json`, the 1500 brightest peaks), drawn as crisp points
 * over a palette gradient; Earth, Phobos and Deimos are faceted low-poly spheres with flat colors, lit by
 * the scene Sun so their phases are right.
 *
 * Until the multi-mission chain (#410/#411) lands, the world comes from the URL and the ground color is
 * overridden for the preview; afterwards it should come from the active mission and its palette.
 */

export type MundoCielo = "marte" | "marte-noche" | "luna" | "luna-noche";
const MUNDOS: readonly MundoCielo[] = ["marte", "marte-noche", "luna", "luna-noche"];

interface Cuerpo {
  /** Flat colors of the facets: each facet picks one. */
  colores: readonly string[];
  /** Apparent diameter in degrees (game size; real ones in the comment of AJUSTES). */
  grados: number;
  elevacion: number;
  azimut: number;
  /** Irregular shape (small moons) instead of a round planet. */
  irregular?: boolean;
  /**
   * Where its light comes from: `sol` (phase set by the Sun) or `llena` (lit toward the viewer: Earth seen
   * from the lunar night is nearly full). Default `sol`.
   */
  fase?: "sol" | "llena";
  /** Earth: colors by region (ocean, land patches, white poles) instead of random facets. */
  tierra?: boolean;
}

interface Ajuste {
  cielo: { cenit: string; horizonte: string };
  /** Star brightness (0-1): dimmer by day on the Moon, full at night. */
  estrellas: number;
  niebla: { color: string; cerca: number; lejos: number } | null;
  /** Sun elevation and azimuth in degrees (azimuth 0 = -z, 90 = +x). */
  sol: { elevacion: number; azimut: number; intensidad: number; color: string; visible: boolean };
  hemi: { cielo: string; suelo: string; intensidad: number };
  cuerpos: Cuerpo[];
  /** Ground tint for the preview (replaces the Martian vertex colors). */
  suelo: string;
  texturas: MundoTextura;
  brilloSol: number;
  tamanoSol: number;
}

/** Ocean, land, ice/cloud (game palette tones). */
const TIERRA: Cuerpo["colores"] = ["#4F86D9", "#6FAE7A", "#F3EEE5"];

/**
 * Real apparent sizes, for reference: Earth from the Moon ~1.9 deg; Phobos from Mars up to ~0.2 deg;
 * Deimos ~0.04 deg. Game sizes are larger so they read on a phone.
 */
const AJUSTES: Readonly<Record<Exclude<MundoCielo, "marte">, Ajuste>> = {
  "marte-noche": {
    cielo: { cenit: "#15132A", horizonte: "#3E3150" },
    estrellas: 0.85,
    niebla: { color: "#2C2540", cerca: 60, lejos: 420 },
    // Game light, not sunlight: a cold key light so kids can still read the base at night.
    sol: { elevacion: 35, azimut: 200, intensidad: 0.9, color: "#9FB0E8", visible: false },
    hemi: { cielo: "#4A5378", suelo: "#4A3A40", intensidad: 1.1 },
    cuerpos: [
      { colores: ["#8C7B70", "#7A6B62", "#9C8C80"], grados: 2.5, elevacion: 30, azimut: 200, irregular: true, fase: "llena" },
      { colores: ["#9A8A7E", "#857669"], grados: 1.2, elevacion: 52, azimut: 130, irregular: true, fase: "llena" },
    ],
    suelo: "#D9D2CF",
    texturas: "marte",
    brilloSol: 0,
    tamanoSol: 1,
  },
  luna: {
    cielo: { cenit: "#07080F", horizonte: "#161A2A" },
    estrellas: 0.55,
    niebla: null,
    sol: { elevacion: 4, azimut: 250, intensidad: 3.2, color: "#FFFFFF", visible: true },
    // Real Moon shadows are almost black; a little fill keeps the crew readable for kids.
    hemi: { cielo: "#2A3048", suelo: "#4A4A4A", intensidad: 0.5 },
    cuerpos: [{ colores: TIERRA, grados: 4, elevacion: 9, azimut: 20, tierra: true }],
    suelo: "#A3A19C",
    texturas: "luna",
    brilloSol: 0.25,
    tamanoSol: 1.5,
  },
  "luna-noche": {
    cielo: { cenit: "#07080F", horizonte: "#1B2238" },
    estrellas: 1,
    niebla: null,
    // No Sun: the directional light is earthshine, coming from Earth.
    sol: { elevacion: 50, azimut: 160, intensidad: 0.7, color: "#AFC6FF", visible: false },
    hemi: { cielo: "#2A3350", suelo: "#34343A", intensidad: 0.7 },
    cuerpos: [{ colores: TIERRA, grados: 4, elevacion: 50, azimut: 160, fase: "llena", tierra: true }],
    suelo: "#8E8C88",
    texturas: "luna",
    brilloSol: 0,
    tamanoSol: 1.5,
  },
};

export function mundoCielo(): MundoCielo {
  if (typeof location === "undefined") return "marte";
  const m = new URLSearchParams(location.search).get("mundo");
  return (MUNDOS as readonly string[]).includes(m ?? "") ? (m as MundoCielo) : "marte";
}

/** Settings for the visible Sun and the ground of a world. */
export function ajusteDeMundo(m: MundoCielo): { texturas: MundoTextura; suelo: string | null; brilloSol: number; tamanoSol: number; solVisible: boolean } {
  if (m === "marte") return { texturas: "marte", suelo: null, brilloSol: 1, tamanoSol: 1, solVisible: true };
  const a = AJUSTES[m];
  return { texturas: a.texturas, suelo: a.suelo, brilloSol: a.brilloSol, tamanoSol: a.tamanoSol, solVisible: a.sol.visible };
}

function direccion(elevacion: number, azimut: number): THREE.Vector3 {
  const e = THREE.MathUtils.degToRad(elevacion), a = THREE.MathUtils.degToRad(azimut);
  return new THREE.Vector3(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e));
}

/** Deterministic pseudo-random in [0, 1) so facets keep their colors between runs. */
function azar(semilla: number): () => number {
  let s = semilla >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

/**
 * Faceted low-poly body: icosahedron with one flat color per facet, shaded here by its phase (`luz` points
 * from the body to its light). Unlit material, so the scene lights (earthshine, the cold night light) do
 * not turn it into a dark dot; facets keep the flat game look.
 */
function cuerpoFacetado(c: Cuerpo, radio: number, semilla: number, luz: THREE.Vector3): THREE.Mesh {
  const geo = new THREE.IcosahedronGeometry(radio, c.irregular ? 1 : 2); // already non-indexed: one color per facet
  const pos = geo.getAttribute("position");
  const r = azar(semilla);
  if (c.irregular) {
    // Potato shape: squash and push vertices in or out (the same push for shared corners).
    const empuje = new Map<string, number>();
    for (let i = 0; i < pos.count; i++) {
      const clave = `${pos.getX(i).toFixed(3)},${pos.getY(i).toFixed(3)},${pos.getZ(i).toFixed(3)}`;
      let k = empuje.get(clave);
      if (k === undefined) empuje.set(clave, (k = 0.8 + r() * 0.35));
      pos.setXYZ(i, pos.getX(i) * k * 1.25, pos.getY(i) * k * 0.85, pos.getZ(i) * k);
    }
  }
  geo.computeVertexNormals();
  const nor = geo.getAttribute("normal");
  const colores = new Float32Array(pos.count * 3);
  const paleta = c.colores.map((h) => new THREE.Color(h));
  const n = new THREE.Vector3(), tmp = new THREE.Color();
  for (let f = 0; f < pos.count; f += 3) {
    n.fromBufferAttribute(nor, f);
    // Night side stays visible but dim (0.18), like the game's soft shadows; day side up to full color.
    const k = 0.18 + 0.82 * Math.max(0, n.dot(luz));
    tmp.copy(paleta[c.tierra ? indiceTierra(n) : Math.floor(r() * paleta.length)]!).multiplyScalar(k);
    for (let v = 0; v < 3; v++) colores.set([tmp.r, tmp.g, tmp.b], (f + v) * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colores, 3));
  return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, fog: false }));
}

/** Earth facet color by region: smooth bumps make land patches, high latitudes go white. */
function indiceTierra(n: THREE.Vector3): number {
  if (Math.abs(n.y) > 0.82) return 2;
  const tierra = Math.sin(n.x * 3.1 + 0.4) + Math.sin(n.y * 2.3 + 1.7) + Math.sin(n.z * 2.7 + 2.9);
  return tierra > 0.9 ? 1 : 0;
}

/**
 * Own sky dome with a palette gradient (vertex colors), like the Martian sky. It is a separate mesh: the
 * day cycle repaints the Martian dome geometry on phase changes, so painting that one would be undone.
 */
function domoGradiente(cenit: string, horizonte: string): THREE.Mesh {
  const geo = new THREE.SphereGeometry(RADIO_DOMO * 0.95, 48, 24);
  const pos = geo.getAttribute("position");
  const c = new THREE.Color(cenit), h = new THREE.Color(horizonte), tmp = new THREE.Color();
  const colores = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const t = Math.sqrt(Math.max(0, pos.getY(i) / RADIO_DOMO));
    tmp.copy(h).lerp(c, t);
    colores.set([tmp.r, tmp.g, tmp.b], i * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colores, 3));
  const domo = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false, toneMapped: false }));
  domo.name = "Sky_Dome_World";
  domo.renderOrder = -2;
  domo.frustumCulled = false;
  return domo;
}

/** Round soft point sprite so stars read as dots, not squares. */
function texturaPunto(): THREE.CanvasTexture {
  const lienzo = document.createElement("canvas");
  lienzo.width = lienzo.height = 32;
  const ctx = lienzo.getContext("2d")!;
  const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.45, "rgba(255,255,255,0.9)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(lienzo);
}

/** Three size tiers by real brightness (1 = brightest in the set). Pixel sizes, not world sizes. */
const NIVELES = [
  { desde: 0.8, tamano: 4.4 },
  { desde: 0.4, tamano: 3 },
  { desde: 0, tamano: 2 },
] as const;

/** Loads the real star set and builds the point clouds (async; the sky shows without stars until then). */
function cargarEstrellas(grupo: THREE.Group, brillo: number, distancia: number): void {
  fetch(`${import.meta.env.BASE_URL}texturas/cielo/estrellas.json`)
    .then((r) => r.json() as Promise<{ estrellas: number[][] }>)
    .then(({ estrellas }) => {
      const punto = texturaPunto();
      NIVELES.forEach((nivel, i) => {
        const hasta = i === 0 ? Infinity : NIVELES[i - 1]!.desde;
        const sel = estrellas.filter((e) => e[3]! >= nivel.desde && e[3]! < hasta);
        const pos = new Float32Array(sel.length * 3), col = new Float32Array(sel.length * 3);
        sel.forEach((e, k) => {
          pos.set([e[0]! * distancia, e[1]! * distancia, e[2]! * distancia], k * 3);
          // Pale tint from the real star color, lifted toward white so the palette stays soft.
          const v = brillo * (0.55 + 0.45 * e[3]!);
          col.set([(0.6 + 0.4 * e[4]!) * v, (0.6 + 0.4 * e[5]!) * v, (0.6 + 0.4 * e[6]!) * v], k * 3);
        });
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
        const mat = new THREE.PointsMaterial({ size: nivel.tamano, sizeAttenuation: false, map: punto, vertexColors: true, transparent: true, depthWrite: false, fog: false, toneMapped: false });
        const puntos = new THREE.Points(geo, mat);
        puntos.name = `Sky_Stars_${i}`;
        puntos.frustumCulled = false;
        puntos.renderOrder = -1;
        grupo.add(puntos);
      });
    })
    .catch(() => {
      /* No stars is acceptable: the gradient sky still reads. */
    });
}

/** Applies the world's sky. Returns the group of sky objects (empty on Mars). */
export function aplicarCieloMundo(escena: THREE.Scene, cielo: Cielo, m: MundoCielo = mundoCielo()): THREE.Group {
  const grupo = new THREE.Group();
  grupo.name = "Sky_World";
  if (m === "marte") return grupo;
  const a = AJUSTES[m];

  cielo.domo.visible = false;
  const domo = domoGradiente(a.cielo.cenit, a.cielo.horizonte);
  grupo.add(domo);
  const DIST = RADIO_DOMO * 0.7;
  cargarEstrellas(grupo, a.estrellas, RADIO_DOMO * 0.85);
  const dirSolMundo = direccion(a.sol.elevacion, a.sol.azimut);
  const cuerpos = a.cuerpos.map((c, i) => {
    const radio = DIST * Math.tan(THREE.MathUtils.degToRad(c.grados) / 2);
    const dirCuerpo = direccion(c.elevacion, c.azimut);
    const luz = c.fase === "llena" ? dirCuerpo.clone().negate() : dirSolMundo.clone().sub(dirCuerpo.clone().multiplyScalar(0.02)).normalize();
    const esfera = cuerpoFacetado(c, radio, 101 + i * 37, luz);
    esfera.name = `Sky_Body_${i}`;
    esfera.frustumCulled = false;
    escena.add(esfera);
    return { esfera, dir: direccion(c.elevacion, c.azimut) };
  });
  escena.add(grupo);

  const dirSol = direccion(a.sol.elevacion, a.sol.azimut);
  const ojo = new THREE.Vector3();
  const colorSol = new THREE.Color(a.sol.color);
  const hemiCielo = new THREE.Color(a.hemi.cielo), hemiSuelo = new THREE.Color(a.hemi.suelo);
  const niebla = a.niebla ? new THREE.Fog(a.niebla.color, a.niebla.cerca, a.niebla.lejos) : null;

  // The day cycle rewrites the light when the mission phase changes; this runs every frame right
  // before the dome is drawn, so the world settings always win without touching cicloDia.
  domo.onBeforeRender = (_r, _s, camara) => {
    fijarDireccionSol(dirSol.x, dirSol.y, dirSol.z);
    cielo.sol.position.copy(cielo.sol.target.position).addScaledVector(dirSol, 150);
    cielo.sol.color.copy(colorSol);
    cielo.sol.intensity = a.sol.intensidad;
    cielo.hemisferica.color.copy(hemiCielo);
    cielo.hemisferica.groundColor.copy(hemiSuelo);
    cielo.hemisferica.intensity = a.hemi.intensidad;
    escena.fog = niebla;
    camara.getWorldPosition(ojo);
    grupo.position.copy(ojo);
    for (const c of cuerpos) c.esfera.position.copy(ojo).addScaledVector(c.dir, DIST);
    if (import.meta.env.DEV) {
      // Dev only: screen position (NDC) of each body, so a capture script can aim the camera at it.
      (globalThis as { __cuerposNDC?: number[][] }).__cuerposNDC = cuerpos.map((c) => c.esfera.position.clone().project(camara).toArray());
    }
  };
  return grupo;
}

/** Distant mountains share the Martian vertex colors: give them the world's tone (a bit darker). */
export function tintarMontanas(montanas: THREE.Mesh, suelo: string): void {
  const m = (montanas.material as THREE.MeshStandardMaterial).clone();
  m.vertexColors = false;
  m.color.set(suelo).multiplyScalar(0.7);
  montanas.material = m;
}
