import * as THREE from "three";
import { crearMateriales } from "./materiales";
import { ambienteSalaKit, crearSalaKit, PUERTA_SALA, puntosSalaKit, type PuntoSala, type SalaKit } from "./activos/interiores/salaKit";
import { AMBIENTE_PASILLO, crearPasillo, PUERTAS_PASILLO, ZONAS_PASILLO } from "./activos/interiores/pasillo";
import { animar, crearPersonaje } from "./personajes";

/**
 * Experimental: a room the kid can walk in. Self-contained (own renderer and loop), so entering a room
 * does not touch the outdoor scene: the game mounts this over it and unmounts it on exit.
 *
 * - Movement: WASD or arrows, screen-relative (the camera is a cut-away view that drifts with the kid).
 * - Collision: circles for furniture (`puntosSalaKit`) and the room box.
 * - Interaction: the nearest interactive thing within reach gets a floor ring; `E` reports it with
 *   `alInteractuar(id)`. At a door, `E` calls `alSalir(destino)`: the workshop and the habitat open to the
 *   corridor, the corridor opens to both and to the airlock ("base").
 * - The loop stops while the tab is hidden and everything is released in `quitar()`.
 * Touch controls and the wiring into the game screens come next; today this runs in the dev preview:
 * `/escena.html?sala=taller&kit=1&jugar=1`.
 */

const VELOCIDAD = 2.4;
const RADIO_NINO = 0.3;
const ALCANCE = 1.25;
/** Walkable box of a kit room (8 x 6 m; walls are 0.25 thick). */
const CAJA = { xMin: -3.55, xMax: 3.55, zMin: -2.55, zMax: 2.75 } as const;

export type EspacioJugable = SalaKit | "pasillo";
type Caja = { readonly xMin: number; readonly xMax: number; readonly zMin: number; readonly zMax: number };
interface Puerta { readonly destino: string; readonly x: number; readonly z: number; readonly entrada: { readonly x: number; readonly z: number; readonly giro: number } }

/** What the loop needs from a space: its scene, walkable boxes, obstacles and doors. */
function datosEspacio(espacio: EspacioJugable) {
  if (espacio === "pasillo") {
    return { raiz: crearPasillo(), amb: AMBIENTE_PASILLO, zonas: ZONAS_PASILLO as readonly Caja[], puntos: [] as PuntoSala[], puertas: PUERTAS_PASILLO as readonly Puerta[] };
  }
  // Workshop and habitat open to the corridor; the Outpost (on the ship) back to the base.
  const destino = espacio === "outpost" ? "base" : "pasillo";
  const puerta: Puerta = { destino, x: PUERTA_SALA.x, z: PUERTA_SALA.z - 0.5, entrada: { x: PUERTA_SALA.x, z: PUERTA_SALA.z, giro: 0 } };
  return { raiz: crearSalaKit(espacio, crearMateriales()), amb: ambienteSalaKit(espacio), zonas: [CAJA] as readonly Caja[], puntos: puntosSalaKit(espacio), puertas: [puerta] as readonly Puerta[] };
}

const dentro = (zonas: readonly Caja[], x: number, z: number) => zonas.some((c) => x >= c.xMin && x <= c.xMax && z >= c.zMin && z <= c.zMax);

export interface OpcionesSalaJugable {
  calidad?: "alta" | "media" | "baja";
  /** Where the kid comes from: he appears at the door that leads there (default: the first door). */
  desde?: string | undefined;
  /** The thing within reach changed (null = nothing, "puerta:<destino>" = a door). */
  alCercano?: (id: string | null) => void;
  alInteractuar?: (id: string) => void;
  alSalir?: (destino: string) => void;
}

export interface SalaJugable {
  quitar(): void;
}

export function montarSalaJugable(canvas: HTMLCanvasElement, sala: EspacioJugable, o: OpcionesSalaJugable = {}): SalaJugable {
  const calidad = o.calidad ?? "alta";
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: calidad !== "baja" });
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, calidad === "alta" ? 1.5 : 1));
  renderer.shadowMap.enabled = calidad !== "baja";
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const escena = new THREE.Scene();
  const { raiz, amb, zonas, puntos, puertas } = datosEspacio(sala);
  escena.background = new THREE.Color(amb.fondoEscena);
  if ("niebla" in amb) escena.fog = new THREE.Fog(amb.niebla.color, amb.niebla.cerca, amb.niebla.lejos);
  escena.add(raiz, new THREE.HemisphereLight(amb.luz.hemiCielo, amb.luz.hemiSuelo, amb.luz.hemi));
  const luz = new THREE.DirectionalLight(amb.luz.color, amb.luz.intensidad);
  luz.position.set(-2, 6, 4);
  luz.castShadow = true;
  const lado = calidad === "alta" ? 1024 : 512;
  luz.shadow.mapSize.set(lado, lado);
  const c = luz.shadow.camera;
  c.left = -7; c.right = 7; c.top = 7; c.bottom = -7; c.near = 1; c.far = 20;
  luz.shadow.bias = -0.0005;
  luz.shadow.normalBias = 0.03;
  escena.add(luz, luz.target);

  const nino = crearPersonaje("nino");
  const llegada = (puertas.find((d) => d.destino === o.desde) ?? puertas[0]!).entrada;
  nino.grupo.position.set(llegada.x, 0, llegada.z);
  nino.grupo.traverse((x) => { if (x instanceof THREE.Mesh) x.castShadow = true; });
  escena.add(nino.grupo);

  // Floor ring under the thing within reach.
  const anillo = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.68, 32), new THREE.MeshBasicMaterial({ color: "#8FF3FF", transparent: true, opacity: 0.9, depthWrite: false }));
  anillo.rotation.x = -Math.PI / 2;
  anillo.position.y = 0.03;
  anillo.visible = false;
  escena.add(anillo);

  // Wider lens inside the tube, so the kid fits whole in front of the camera.
  const camara = new THREE.PerspectiveCamera(sala === "pasillo" ? 62 : 45, 1, 0.1, 200);
  const ajustar = () => {
    const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
    renderer.setSize(w, h, false);
    camara.aspect = w / h;
    camara.updateProjectionMatrix();
  };
  ajustar();
  addEventListener("resize", ajustar);

  const teclas = new Set<string>();
  let cercano: string | null = null;
  const alBajar = (e: KeyboardEvent) => {
    teclas.add(e.code);
    if (e.code === "KeyE" && cercano) {
      if (cercano.startsWith("puerta:")) o.alSalir?.(cercano.slice("puerta:".length));
      else o.alInteractuar?.(cercano);
    }
  };
  const alSubir = (e: KeyboardEvent) => teclas.delete(e.code);
  const alDesenfocar = () => teclas.clear();
  addEventListener("keydown", alBajar);
  addEventListener("keyup", alSubir);
  addEventListener("blur", alDesenfocar);

  const eje = (pos: string[], neg: string[]) => (pos.some((k) => teclas.has(k)) ? 1 : 0) - (neg.some((k) => teclas.has(k)) ? 1 : 0);
  const p = nino.grupo.position;
  let giro = llegada.giro;
  nino.grupo.rotation.y = giro;
  // Inside the corridor the camera rides behind the kid and looks along the run he is in: the main run in
  // the direction he came in, the airlock branch toward its far end. It only turns at the crossing, so the
  // controls never flip on their own.
  const dentroTubo = sala === "pasillo";
  const desdeEsclusa = o.desde === "base";
  const rumboPrincipal = Math.abs(Math.abs(llegada.giro) - Math.PI / 2) < 0.1 ? llegada.giro : Math.PI / 2;
  const rumboRamal = desdeEsclusa ? 0 : Math.PI;
  let rumbo = dentroTubo && llegada.z < -1.4 ? rumboRamal : rumboPrincipal;
  let previo = 0;
  let t = 0;

  function mover(dt: number): boolean {
    let dx = eje(["KeyD", "ArrowRight"], ["KeyA", "ArrowLeft"]);
    let dz = eje(["KeyS", "ArrowDown"], ["KeyW", "ArrowUp"]);
    if (dentroTubo) {
      // Camera-relative: up is "forward along the view", right is "to the screen right".
      const avance = -dz, lado = dx;
      dx = avance * Math.sin(rumbo) - lado * Math.cos(rumbo);
      dz = avance * Math.cos(rumbo) + lado * Math.sin(rumbo);
    }
    const largo = Math.hypot(dx, dz);
    if (largo === 0) return false;
    let x = p.x + (dx / largo) * VELOCIDAD * dt;
    let z = p.z + (dz / largo) * VELOCIDAD * dt;
    // Push out of furniture circles, then clamp to the room.
    for (const s of puntos) {
      if (s.radio === 0) continue;
      const d = Math.hypot(x - s.x, z - s.z), minimo = s.radio + RADIO_NINO;
      if (d < minimo && d > 1e-4) {
        x = s.x + ((x - s.x) / d) * minimo;
        z = s.z + ((z - s.z) / d) * minimo;
      }
    }
    // Stay inside the walkable boxes, sliding along a wall when only one axis is blocked.
    if (dentro(zonas, x, z)) { p.x = x; p.z = z; }
    else if (dentro(zonas, x, p.z)) p.x = x;
    else if (dentro(zonas, p.x, z)) p.z = z;
    // Turn toward the walking direction (shortest way).
    const meta = Math.atan2(dx, dz);
    const delta = Math.atan2(Math.sin(meta - giro), Math.cos(meta - giro));
    giro += delta * Math.min(1, dt * 12);
    nino.grupo.rotation.y = giro;
    return true;
  }

  function alcance(): PuntoSala | Puerta | null {
    // A door wins when the kid stands at it, so there is always a way out.
    for (const d of puertas) if (Math.hypot(p.x - d.x, p.z - d.z) < PUERTA_SALA.radio) return d;
    let mejor: PuntoSala | null = null, dMejor = Infinity;
    for (const s of puntos) {
      if (!s.interactivo) continue;
      const d = Math.hypot(p.x - s.x, p.z - s.z) - s.radio;
      if (d < ALCANCE - RADIO_NINO && d < dMejor) { mejor = s; dMejor = d; }
    }
    return mejor;
  }

  function cuadro(ahora: number): void {
    const dt = Math.min(0.05, previo ? (ahora - previo) / 1000 : 0);
    previo = ahora;
    t += dt;
    const camina = mover(dt);
    animar(nino, camina ? "caminar" : "reposo", t);

    const a = alcance();
    const id = a === null ? null : "destino" in a ? `puerta:${a.destino}` : a.id;
    if (id !== cercano) {
      cercano = id;
      o.alCercano?.(cercano);
    }
    anillo.visible = a !== null;
    if (a) anillo.position.set(a.x, 0.03, a.z);
    if (a !== null) anillo.scale.setScalar(("destino" in a ? 1 : Math.max(0.6, a.radio + 0.25)) * (1 + 0.05 * Math.sin(t * 5)));

    if (dentroTubo) {
      const meta = p.z < -1.4 ? rumboRamal : rumboPrincipal;
      rumbo += Math.atan2(Math.sin(meta - rumbo), Math.cos(meta - rumbo)) * Math.min(1, dt * 3);
      // Chase camera near the ceiling, pulled in when a wall is closer than its usual distance.
      const fx = Math.sin(rumbo), fz = Math.cos(rumbo);
      let atras = 3.0;
      while (atras > 0.8 && !dentro(zonas, p.x - fx * atras, p.z - fz * atras)) atras -= 0.1;
      camara.position.set(p.x - fx * atras, 2.05, p.z - fz * atras);
      camara.lookAt(p.x + fx * 4, 0.95, p.z + fz * 4);
    } else {
      // Cut-away camera that drifts with the kid so he stays near the middle of the frame.
      camara.position.set(-2.8 + p.x * 0.35, 5.6, 8.4 + p.z * 0.35);
      camara.lookAt(0.3 + p.x * 0.45, 0.9, -0.6 + p.z * 0.45);
    }
    renderer.render(escena, camara);
    if (import.meta.env.DEV) (globalThis as { __ninoSala?: number[] }).__ninoSala = [p.x, p.z];
  }

  const alVisibilidad = () => {
    if (document.hidden) renderer.setAnimationLoop(null);
    else {
      previo = 0;
      renderer.setAnimationLoop(cuadro);
    }
  };
  document.addEventListener("visibilitychange", alVisibilidad);
  if (!document.hidden) renderer.setAnimationLoop(cuadro);

  return {
    quitar() {
      renderer.setAnimationLoop(null);
      document.removeEventListener("visibilitychange", alVisibilidad);
      removeEventListener("resize", ajustar);
      removeEventListener("keydown", alBajar);
      removeEventListener("keyup", alSubir);
      removeEventListener("blur", alDesenfocar);
      escena.traverse((x) => {
        if (x instanceof THREE.Mesh) {
          x.geometry.dispose();
          for (const m of Array.isArray(x.material) ? x.material : [x.material]) {
            for (const v of Object.values(m)) if (v instanceof THREE.Texture) v.dispose();
            m.dispose();
          }
        }
      });
      renderer.dispose();
    },
  };
}
