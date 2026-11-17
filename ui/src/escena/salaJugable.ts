import * as THREE from "three";
import { crearMateriales } from "./materiales";
import { ambienteSalaKit, crearSalaKit, PUERTA_SALA, puntosSalaKit, type PuntoSala, type SalaKit } from "./activos/interiores/salaKit";
import { animar, crearPersonaje } from "./personajes";

/**
 * Experimental: a room the kid can walk in. Self-contained (own renderer and loop), so entering a room
 * does not touch the outdoor scene: the game mounts this over it and unmounts it on exit.
 *
 * - Movement: WASD or arrows, screen-relative (the camera is a cut-away view that drifts with the kid).
 * - Collision: circles for furniture (`puntosSalaKit`) and the room box.
 * - Interaction: the nearest interactive thing within reach gets a floor ring; `E` reports it with
 *   `alInteractuar(id)`. At the door, `E` calls `alSalir()`.
 * - The loop stops while the tab is hidden and everything is released in `quitar()`.
 * Touch controls and the wiring into the game screens come next; today this runs in the dev preview:
 * `/escena.html?sala=taller&kit=1&jugar=1`.
 */

const VELOCIDAD = 2.4;
const RADIO_NINO = 0.3;
const ALCANCE = 1.25;
/** Walkable box (the room is 8 x 6 m; walls are 0.25 thick). */
const CAJA = { xMin: -3.55, xMax: 3.55, zMin: -2.55, zMax: 2.75 } as const;

export interface OpcionesSalaJugable {
  calidad?: "alta" | "media" | "baja";
  /** The thing within reach changed (null = nothing, "puerta" = the exit). */
  alCercano?: (id: string | null) => void;
  alInteractuar?: (id: string) => void;
  alSalir?: () => void;
}

export interface SalaJugable {
  quitar(): void;
}

export function montarSalaJugable(canvas: HTMLCanvasElement, sala: SalaKit, o: OpcionesSalaJugable = {}): SalaJugable {
  const calidad = o.calidad ?? "alta";
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: calidad !== "baja" });
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, calidad === "alta" ? 1.5 : 1));
  renderer.shadowMap.enabled = calidad !== "baja";
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const escena = new THREE.Scene();
  const amb = ambienteSalaKit(sala);
  escena.background = new THREE.Color(amb.fondoEscena);
  escena.add(crearSalaKit(sala, crearMateriales()), new THREE.HemisphereLight(amb.luz.hemiCielo, amb.luz.hemiSuelo, amb.luz.hemi));
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
  nino.grupo.position.set(PUERTA_SALA.x, 0, PUERTA_SALA.z);
  nino.grupo.traverse((x) => { if (x instanceof THREE.Mesh) x.castShadow = true; });
  escena.add(nino.grupo);

  // Floor ring under the thing within reach.
  const anillo = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.68, 32), new THREE.MeshBasicMaterial({ color: "#8FF3FF", transparent: true, opacity: 0.9, depthWrite: false }));
  anillo.rotation.x = -Math.PI / 2;
  anillo.position.y = 0.03;
  anillo.visible = false;
  escena.add(anillo);

  const camara = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
  const ajustar = () => {
    const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
    renderer.setSize(w, h, false);
    camara.aspect = w / h;
    camara.updateProjectionMatrix();
  };
  ajustar();
  addEventListener("resize", ajustar);

  const puntos = puntosSalaKit(sala);
  const teclas = new Set<string>();
  let cercano: string | null = null;
  const alBajar = (e: KeyboardEvent) => {
    teclas.add(e.code);
    if (e.code === "KeyE" && cercano) {
      if (cercano === "puerta") o.alSalir?.();
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
  let giro = Math.PI;
  let previo = 0;
  let t = 0;

  function mover(dt: number): boolean {
    const dx = eje(["KeyD", "ArrowRight"], ["KeyA", "ArrowLeft"]);
    const dz = eje(["KeyS", "ArrowDown"], ["KeyW", "ArrowUp"]);
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
    p.x = THREE.MathUtils.clamp(x, CAJA.xMin, CAJA.xMax);
    p.z = THREE.MathUtils.clamp(z, CAJA.zMin, CAJA.zMax);
    // Turn toward the walking direction (shortest way).
    const meta = Math.atan2(dx, dz);
    const delta = Math.atan2(Math.sin(meta - giro), Math.cos(meta - giro));
    giro += delta * Math.min(1, dt * 12);
    nino.grupo.rotation.y = giro;
    return true;
  }

  function alcance(): PuntoSala | "puerta" | null {
    // The door wins when the kid stands at it, so there is always a way out.
    if (Math.hypot(p.x - PUERTA_SALA.x, p.z - (PUERTA_SALA.z - 0.5)) < PUERTA_SALA.radio) return "puerta";
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
    const id = a === null ? null : a === "puerta" ? "puerta" : a.id;
    if (id !== cercano) {
      cercano = id;
      o.alCercano?.(cercano);
    }
    anillo.visible = a !== null;
    if (a === "puerta") anillo.position.set(PUERTA_SALA.x, 0.03, PUERTA_SALA.z - 0.5);
    else if (a) anillo.position.set(a.x, 0.03, a.z);
    if (a !== null) anillo.scale.setScalar((a === "puerta" ? 1 : Math.max(0.6, a.radio + 0.25)) * (1 + 0.05 * Math.sin(t * 5)));

    // Cut-away camera that drifts with the kid so he stays near the middle of the frame.
    camara.position.set(-2.8 + p.x * 0.35, 5.6, 8.4 + p.z * 0.35);
    camara.lookAt(0.3 + p.x * 0.45, 0.9, -0.6 + p.z * 0.45);
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
