/**
 * Contenedor 3D del juego (pedido B7): arma las salas y la escena del espacio con las piezas de la
 * vista, sin editarlas, y permite cambiar de escenario y liberar todo.
 */
import { Group, InstancedMesh, Mesh, SphereGeometry, DirectionalLight, HemisphereLight } from "three";
import nw15 from "../../data/layouts/rooms/nw-15.json";
import nw16 from "../../data/layouts/rooms/nw-16.json";
import nw17 from "../../data/layouts/rooms/nw-17.json";
import { bakeRoomAO } from "../../tools/bake-room-ao";
import type { CameraFrame } from "../camera/player";
import { buildRoomFromLayout, parseRoomLayout } from "../catalog/layout";
import { startLoop } from "../core/loop";
import { createRendering } from "../core/rendering";
import { applyEnvironment } from "../environment/apply";
import { createProductionRegistry } from "../kit/pieces";
import { paletteHex } from "../materials/palette";
import { getScreens } from "../materials/screens";
import { materials } from "../materials/shared";
import { applyInteriorCalibration } from "../scenes/room-viewer";
import { createSpaceShot, SPACE_DURATION } from "../scenes/space-shot";
import type { EscenarioId } from "./intro";

const SALAS_3D: Record<Exclude<EscenarioId, "space">, unknown> = { "nw-15": nw15, "nw-16": nw16, "nw-17": nw17 };

/** Muestras de la oclusión por vértice: menos que en las rutas de revisión para que la carga sea corta. */
const MUESTRAS_AO = 16;

export interface Escenario3d {
  /** Arma el escenario por adelantado (tarda: se hace en la pantalla de carga). */
  preparar(id: EscenarioId): void;
  mostrar(id: EscenarioId, ambiente: string): void;
  /** Coloca la cámara en un cuadro del reproductor de tomas. */
  encuadrar(frame: CameraFrame): void;
  dispose(): void;
}

export function crearEscenario3d(contenedor: HTMLElement): Escenario3d {
  const rendering = createRendering(contenedor);
  const { renderer, scene, camera, composer, stats } = rendering;
  stats.dom.hidden = true;
  getScreens();
  const registry = createProductionRegistry();
  const listos = new Map<EscenarioId, { grupo: Group; espacio?: ReturnType<typeof createSpaceShot> }>();
  let actual: { id: EscenarioId; ambiente: string } | null = null;
  let segundosEnEspacio = 0;

  function preparar(id: EscenarioId): void {
    if (listos.has(id)) return;
    const grupo = new Group();
    if (id === "space") {
      const espacio = createSpaceShot(registry, camera.aspect);
      const borde = new DirectionalLight(paletteHex("duskHalo"), 1.02);
      borde.position.set(23, -19, 42);
      const fondo = materials.M_sky;
      fondo.uniforms.planetDirection.value.copy(espacio.earthCenter).sub(espacio.camera.position).normalize();
      fondo.uniforms.planetRadius.value = espacio.earth.scale.x / espacio.earthCenter.distanceTo(espacio.camera.position);
      const cielo = new Mesh(new SphereGeometry(140, 32, 16), fondo);
      cielo.position.copy(espacio.camera.position);
      cielo.renderOrder = -10;
      cielo.onBeforeRender = () => { fondo.uniforms.spaceMode.value = 1; fondo.uniformsNeedUpdate = true; };
      cielo.onAfterRender = () => { fondo.uniforms.spaceMode.value = 0; fondo.uniformsNeedUpdate = true; };
      grupo.add(borde, cielo, espacio.earth, espacio.ship);
      listos.set(id, { grupo, espacio });
      return;
    }
    const sala = buildRoomFromLayout(parseRoomLayout(SALAS_3D[id], registry), registry);
    const horneada = bakeRoomAO(sala.staticGroup, { samples: MUESTRAS_AO, radius: 0.95, strength: 0.92 });
    sala.staticGroup.traverse((nodo) => { if (nodo instanceof Mesh) nodo.geometry.dispose(); });
    const cielo = new Mesh(new SphereGeometry(90, 24, 16), materials.M_sky);
    cielo.position.y = -16;
    grupo.add(cielo, horneada.group, sala.lightsGroup);
    listos.set(id, { grupo });
  }

  function mostrar(id: EscenarioId, ambiente: string): void {
    if (actual?.id === id && actual.ambiente === ambiente) return;
    preparar(id);
    if (actual) scene.remove(listos.get(actual.id)!.grupo);
    actual = { id, ambiente };
    segundosEnEspacio = 0;
    scene.add(listos.get(id)!.grupo);
    const { espacio } = listos.get(id)!;
    rendering.ao.enabled = !espacio;
    if (!espacio) {
      applyInteriorCalibration(rendering, ambiente);
      return;
    }
    // La misma iluminación que usa la ruta /space.
    applyEnvironment(rendering, espacio.preset);
    const sol = scene.children.find((n): n is DirectionalLight => n instanceof DirectionalLight)!;
    sol.position.set(-50, 80, -32);
    sol.intensity = 8.4;
    sol.color.set(paletteHex("ice"));
    const relleno = scene.children.find((n): n is HemisphereLight => n instanceof HemisphereLight)!;
    relleno.color.set(paletteHex("offWhite"));
    relleno.groundColor.set(paletteHex("duskHalo"));
    relleno.intensity = 0.29;
    scene.fog = null;
  }

  const detener = startLoop(contenedor, (dt) => {
    if (!actual) return;
    const { espacio } = listos.get(actual.id)!;
    if (espacio) {
      segundosEnEspacio = Math.min(SPACE_DURATION, segundosEnEspacio + dt);
      espacio.pose(segundosEnEspacio);
    }
    renderer.info.reset();
    composer.render(dt);
  });

  return {
    preparar,
    mostrar,
    encuadrar(frame) {
      camera.position.copy(frame.position);
      camera.lookAt(frame.target);
      camera.fov = frame.shot.fov;
      camera.updateProjectionMatrix();
    },
    dispose() {
      detener();
      for (const { grupo } of listos.values())
        grupo.traverse((objeto) => {
          if (objeto instanceof InstancedMesh) objeto.dispose();
          if (objeto instanceof Mesh) objeto.geometry.dispose();
        });
      listos.clear();
      rendering.dispose();
      renderer.domElement.remove();
    },
  };
}
