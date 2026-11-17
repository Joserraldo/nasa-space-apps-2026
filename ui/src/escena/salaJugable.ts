import * as THREE from "three";
import { crearMateriales } from "./materiales";
import { ambienteSalaKit, crearSalaKit, PUERTA_SALA, puntosSalaKit, type PuntoSala, type SalaKit } from "./activos/interiores/salaKit";
import { ALTURA_PISO } from "./activos/interiores/kitPastel";
import { AMBIENTE_PASILLO, crearPasillo, PUERTAS_PASILLO, PUNTOS_PASILLO, ZONAS_PASILLO } from "./activos/interiores/pasillo";
import { AMBIENTE_ESTACION, crearSalaEstacion, puertasSalaEstacion, puntosSalaEstacion, SALAS_ESTACION, zonaSalaEstacion, type MuroSala, type SalaEstacion } from "./activos/interiores/salaEstacion";
import { animar, crearPersonaje } from "./personajes";

/**
 * Experimental: a room the kid can walk in. Self-contained (own renderer and loop), so entering a room
 * does not touch the outdoor scene: the game mounts this over it and unmounts it on exit.
 *
 * - Movement: WASD or arrows, screen-relative (the camera is a cut-away view that drifts with the kid).
 * - Collision: circles for furniture (`puntosSalaKit`) and the room box.
 * - Interaction: the nearest interactive thing within reach gets a floor ring; `E` reports it with
 *   `alInteractuar(id)`. At a door, `E` calls `alSalir(destino)`: the airlock opens to Mars ("base") and to
 *   the corridor, the corridor to the airlock, the workshop and the habitat.
 * - Cameras: in the corridor it rides behind the kid; in the open-top station rooms it looks down from above
 *   and hides the wall runs between it and the kid; drag turns it in both.
 * - The loop stops while the tab is hidden and everything is released in `quitar()`.
 * Touch controls and the wiring into the game screens come next; today this runs in the dev preview:
 * `/escena.html?sala=taller&kit=1&jugar=1`.
 */

const VELOCIDAD = 2.4;
const RADIO_NINO = 0.3;
const ALCANCE = 1.25;
/** Walkable box of a kit room (8 x 6 m; walls are 0.25 thick). */
const CAJA = { xMin: -3.55, xMax: 3.55, zMin: -2.55, zMax: 2.75 } as const;

export type EspacioJugable = SalaKit | SalaEstacion | "pasillo";
/** Open-top rooms of the station kit (`salaEstacion.ts`). */
const esEstacion = (e: EspacioJugable): e is SalaEstacion => (SALAS_ESTACION as readonly string[]).includes(e);
type Caja = { readonly xMin: number; readonly xMax: number; readonly zMin: number; readonly zMax: number };
interface Puerta { readonly destino: string; readonly x: number; readonly z: number; readonly entrada: { readonly x: number; readonly z: number; readonly giro: number } }

/** What the loop needs from a space: its scene, walkable boxes, obstacles and doors. */
function datosEspacio(espacio: EspacioJugable) {
  if (espacio === "pasillo") {
    return { piso: ALTURA_PISO, raiz: crearPasillo(), muros: [] as MuroSala[], amb: AMBIENTE_PASILLO, zonas: ZONAS_PASILLO as readonly Caja[], puntos: PUNTOS_PASILLO, puertas: PUERTAS_PASILLO as readonly Puerta[] };
  }
  if (esEstacion(espacio)) {
    const sala = crearSalaEstacion(espacio, crearMateriales());
    return { piso: 0, raiz: sala.raiz, muros: sala.muros, amb: AMBIENTE_ESTACION, zonas: [zonaSalaEstacion(espacio)] as readonly Caja[], puntos: puntosSalaEstacion(espacio), puertas: puertasSalaEstacion(espacio) as readonly Puerta[] };
  }
  // The Outpost (on the ship) opens back to the base.
  const destino = "base";
  const puerta: Puerta = { destino, x: PUERTA_SALA.x, z: PUERTA_SALA.z - 0.5, entrada: { x: PUERTA_SALA.x, z: PUERTA_SALA.z, giro: 0 } };
  return { piso: 0, muros: [] as MuroSala[], raiz: crearSalaKit(espacio, crearMateriales()), amb: ambienteSalaKit(espacio), zonas: [CAJA] as readonly Caja[], puntos: puntosSalaKit(espacio), puertas: [puerta] as readonly Puerta[] };
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
  /** Touch stick direction (screen right, screen down), each -1..1; (0, 0) stops. */
  fijarEje(x: number, z: number): void;
  /** Same as pressing E. */
  usar(): void;
  quitar(): void;
}

export function montarSalaJugable(canvas: HTMLCanvasElement, sala: EspacioJugable, o: OpcionesSalaJugable = {}): SalaJugable {
  const calidad = o.calidad ?? "alta";
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: calidad !== "baja" });
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, calidad === "alta" ? 1.5 : 1));
  renderer.shadowMap.enabled = calidad !== "baja";
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const escena = new THREE.Scene();
  // `piso`: height of the walkable floor; the kit floors are raised panels, so feet go on top of them.
  const { piso, raiz, muros, amb, zonas, puntos, puertas } = datosEspacio(sala);
  escena.background = new THREE.Color(amb.fondoEscena);
  if ("niebla" in amb) escena.fog = new THREE.Fog(amb.niebla.color, amb.niebla.cerca, amb.niebla.lejos);
  escena.add(raiz, new THREE.HemisphereLight(amb.luz.hemiCielo, amb.luz.hemiSuelo, amb.luz.hemi));
  const luz = new THREE.DirectionalLight(amb.luz.color, amb.luz.intensidad);
  // High and from the open side: short shadows under props, both side walls lit alike.
  luz.position.set(0.8, 8, 4.5);
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
  nino.grupo.position.set(llegada.x, piso, llegada.z);
  nino.grupo.traverse((x) => { if (x instanceof THREE.Mesh) x.castShadow = true; });
  // Inside the pressurised base the kid takes the helmet off (from above, its tinted glass also hid his hair).
  const casco = nino.grupo.getObjectByName("casco");
  if (casco) casco.visible = false;
  escena.add(nino.grupo);

  // Floor ring under the thing within reach.
  const anillo = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.68, 32), new THREE.MeshBasicMaterial({ color: "#8FF3FF", transparent: true, opacity: 0.9, depthWrite: false }));
  anillo.rotation.x = -Math.PI / 2;
  anillo.position.y = piso + 0.03;
  anillo.visible = false;
  escena.add(anillo);

  // Wider lens inside the tube, so the kid fits whole in front of the camera.
  const camara = new THREE.PerspectiveCamera(sala === "pasillo" ? 62 : esEstacion(sala) ? 50 : 45, 1, 0.1, 200);
  const ajustar = () => {
    const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
    renderer.setSize(w, h, false);
    camara.aspect = w / h;
    // Keep the horizontal view of a 16:10 screen on narrow (portrait) ones, up to 85 degrees vertical.
    if (esEstacion(sala) || sala === "pasillo") {
      const base = sala === "pasillo" ? 62 : 50;
      const horizontal = Math.atan(Math.tan(THREE.MathUtils.degToRad(base / 2)) * 1.6);
      const vertical = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(horizontal) / camara.aspect));
      camara.fov = THREE.MathUtils.clamp(vertical, base, 85);
    }
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

  // Drag (mouse or finger) turns the camera around the kid, as outdoors. `giroManual` adds to the automatic
  // heading; in the corridor it eases back while the kid walks, in the rooms it stays where it was left.
  let giroManual = 0;
  // A station room is wider than deep; on a portrait screen the view turns a quarter so its long side runs
  // up the screen. Movement reads the same heading, so "up" still walks away from the camera.
  const vistaActual = () => rumbo + giroManual + (esEstacion(sala) && camara.aspect < 1 ? Math.PI / 2 : 0);
  let arrastre: { id: number; x: number } | null = null;
  const alApuntar = (e: PointerEvent) => {
    arrastre = { id: e.pointerId, x: e.clientX };
    canvas.setPointerCapture(e.pointerId);
  };
  const alMoverPuntero = (e: PointerEvent) => {
    if (!arrastre || e.pointerId !== arrastre.id) return;
    giroManual -= (e.clientX - arrastre.x) * 0.008;
    arrastre.x = e.clientX;
  };
  const alSoltarPuntero = (e: PointerEvent) => {
    if (arrastre?.id === e.pointerId) arrastre = null;
  };
  canvas.addEventListener("pointerdown", alApuntar);
  canvas.addEventListener("pointermove", alMoverPuntero);
  canvas.addEventListener("pointerup", alSoltarPuntero);
  canvas.addEventListener("pointercancel", alSoltarPuntero);

  // Touch stick (`fijarEje`): -1..1 on each axis, screen right and screen down; adds to the keys.
  const tactil = { x: 0, z: 0 };
  const eje = (pos: string[], neg: string[]) => (pos.some((k) => teclas.has(k)) ? 1 : 0) - (neg.some((k) => teclas.has(k)) ? 1 : 0);
  const p = nino.grupo.position;
  let giro = llegada.giro;
  nino.grupo.rotation.y = giro;
  // Inside the kit spaces the camera rides behind the kid. In the corridor it looks along the run he is in:
  // the main run in the direction he came in, the airlock branch toward its far end; in the workshop and habitat
  // halls it looks at the back wall. It only turns at the crossing, so the controls never flip on their own.
  const dentroTubo = sala !== "outpost";
  const desdeEsclusa = o.desde === "esclusa";
  const rumboPrincipal = Math.abs(Math.abs(llegada.giro) - Math.PI / 2) < 0.1 ? llegada.giro : Math.PI / 2;
  const rumboRamal = desdeEsclusa ? 0 : Math.PI;
  // Station rooms start looking the way the kid walks in.
  let rumbo = esEstacion(sala) ? llegada.giro : sala !== "pasillo" ? Math.PI : dentroTubo && llegada.z < -1.4 ? rumboRamal : rumboPrincipal;
  let previo = 0;
  let t = 0;

  function mover(dt: number): boolean {
    let dx = THREE.MathUtils.clamp(eje(["KeyD", "ArrowRight"], ["KeyA", "ArrowLeft"]) + tactil.x, -1, 1);
    let dz = THREE.MathUtils.clamp(eje(["KeyS", "ArrowDown"], ["KeyW", "ArrowUp"]) + tactil.z, -1, 1);
    if (dentroTubo) {
      // Camera-relative: up is "forward along the view", right is "to the screen right".
      const avance = -dz, lado = dx;
      const vista = vistaActual();
      dx = avance * Math.sin(vista) - lado * Math.cos(vista);
      dz = avance * Math.cos(vista) + lado * Math.sin(vista);
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
    if (a) anillo.position.set(a.x, piso + 0.03, a.z);
    if (a !== null) anillo.scale.setScalar(("destino" in a ? 1 : Math.max(0.6, a.radio + 0.25)) * (1 + 0.05 * Math.sin(t * 5)));

    if (esEstacion(sala)) {
      // From above and behind; the wall runs facing the camera hide, so the room reads like the sheets.
      const fx = Math.sin(vistaActual()), fz = Math.cos(vistaActual());
      // Portrait: the lens spans ~46 degrees across, so the camera climbs and looks almost straight down
      // until the 9.6 m room fits side to side, with no empty ground under it.
      const vertical = camara.aspect < 1;
      const atrasSala = vertical ? 3.0 : 6.2, alto = vertical ? 10.5 : 5.6, mira = vertical ? 0.3 : 0.8;
      // Portrait frames mostly the room (its centre is the origin) and only follows the kid a little.
      const sigue = vertical ? 0.35 : 1, cx = p.x * sigue, cz = p.z * sigue;
      camara.position.set(cx - fx * atrasSala, alto, cz - fz * atrasSala);
      camara.lookAt(cx + fx * mira, 0.6, cz + fz * mira);
      for (const m of muros) m.grupo.visible = -(m.normal[0] * fx + m.normal[1] * fz) < 0.35;
    } else if (dentroTubo) {
      const meta = sala !== "pasillo" ? Math.PI : p.z < -1.4 ? rumboRamal : rumboPrincipal;
      rumbo += Math.atan2(Math.sin(meta - rumbo), Math.cos(meta - rumbo)) * Math.min(1, dt * 3);
      // Chase camera near the ceiling, pulled in when a wall is closer than its usual distance.
      if (sala === "pasillo" && camina) giroManual *= 1 - Math.min(1, dt * 1.5);
      const fx = Math.sin(rumbo + giroManual), fz = Math.cos(rumbo + giroManual);
      let atras = 3.0;
      // The camera also keeps out of columns and furniture, so it never ends up inside one.
      const libre = (x: number, z: number) => dentro(zonas, x, z) && puntos.every((s) => s.radio === 0 || Math.hypot(x - s.x, z - s.z) > s.radio + 0.2);
      while (atras > 0.8 && !libre(p.x - fx * atras, p.z - fz * atras)) atras -= 0.1;
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
    fijarEje(x, z) {
      tactil.x = x;
      tactil.z = z;
    },
    usar() {
      alBajar(new KeyboardEvent("keydown", { code: "KeyE" }));
      teclas.delete("KeyE");
    },
    quitar() {
      renderer.setAnimationLoop(null);
      document.removeEventListener("visibilitychange", alVisibilidad);
      removeEventListener("resize", ajustar);
      removeEventListener("keydown", alBajar);
      removeEventListener("keyup", alSubir);
      removeEventListener("blur", alDesenfocar);
      canvas.removeEventListener("pointerdown", alApuntar);
      canvas.removeEventListener("pointermove", alMoverPuntero);
      canvas.removeEventListener("pointerup", alSoltarPuntero);
      canvas.removeEventListener("pointercancel", alSoltarPuntero);
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
