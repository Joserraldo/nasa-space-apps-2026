/**
 * Contenedor 3D del juego (pedido B7): arma las salas y la escena del espacio con las piezas de la
 * vista, sin editarlas, y permite cambiar de escenario y liberar todo.
 */
import { DirectionalLight, Group, HemisphereLight, InstancedMesh, Mesh, SphereGeometry, Vector3 } from "three";
import colonia from "../../data/layouts/colonies/exterior-pilot.json";
import nw14 from "../../data/layouts/rooms/nw-14.json";
import nw15 from "../../data/layouts/rooms/nw-15.json";
import nw16 from "../../data/layouts/rooms/nw-16.json";
import nw17 from "../../data/layouts/rooms/nw-17.json";
import { bakeRoomAO } from "../../tools/bake-room-ao";
import type { CameraFrame } from "../camera/player";
import { buildRoomFromLayout, parseRoomLayout } from "../catalog/layout";
import { startLoop } from "../core/loop";
import { createRendering } from "../core/rendering";
import { applyEnvironment } from "../environment/apply";
import demURL from "../../data/terrain/jezero-elevation.bin?url";
import { decodeJezeroDEM } from "../environment/dem";
import { presets } from "../environment/presets";
import { createJezeroRockScatter } from "../environment/rock-scatter";
import { createTerrain, terrainHeight } from "../environment/terrain";
import { createProductionRegistry } from "../kit/pieces";
import { paletteHex } from "../materials/palette";
import { getScreens } from "../materials/screens";
import { materials, terrainUniforms } from "../materials/shared";
import { buildColonyGroup, parseColonyLayout } from "../scenes/colony-layout";
import { applyExteriorLightingCalibration } from "../scenes/exterior-pilot";
import { applyInteriorCalibration } from "../scenes/room-viewer";
import { createSpaceShot, SPACE_DURATION } from "../scenes/space-shot";
import type { EscenarioId } from "./intro";

const SALAS_3D: Record<Exclude<EscenarioId, "space" | "colonia">, unknown> = { "nw-14": nw14, "nw-15": nw15, "nw-16": nw16, "nw-17": nw17 };

/** Muestras de la oclusión por vértice: menos que en las rutas de revisión para que la carga sea corta. */
const MUESTRAS_AO = 16;

export interface Escenario3d {
  /** Arma el escenario por adelantado (tarda: se hace en la pantalla de carga). */
  preparar(id: EscenarioId): Promise<void>;
  /** El escenario ya debe estar preparado. */
  mostrar(id: EscenarioId, ambiente: string): void;
  /** Cámara fija del escenario para las escenas de los capítulos. */
  vista(id: EscenarioId): void;
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
  interface Listo {
    grupo: Group;
    espacio?: ReturnType<typeof createSpaceShot>;
    exterior?: { cielo: Mesh; actualizar: () => boolean; ambiente: string };
    camara?: { posicion: Vector3; objetivo: Vector3; fov: number };
  }
  const listos = new Map<EscenarioId, Listo>();
  let actual: { id: EscenarioId; ambiente: string } | null = null;
  let segundosEnEspacio = 0;

  /** La colonia en Jezero, armada como en /exterior-pilot pero sin su panel de revisión. */
  async function prepararColonia(): Promise<Listo> {
    const plano = parseColonyLayout(colonia, registry);
    const respuesta = await fetch(demURL);
    if (!respuesta.ok) throw new Error(`terreno: ${respuesta.status}`);
    const dem = decodeJezeroDEM(await respuesta.arrayBuffer());
    const opciones = { biome: plano.biome, seed: plano.terrainSeed, dem };
    const cielo = new Mesh(new SphereGeometry(48000, 48, 24), materials.M_sky);
    cielo.renderOrder = -10;
    // Sin rocas sobre las piezas ni delante de las cámaras.
    const exclusions = [...plano.placements.map((p) => ({ x: p.at[0], z: p.at[1], radius: 6 })),
      ...plano.views.map((v) => ({ x: v.position[0], z: v.position[2], radius: 3.4 })), { x: 0, z: 2, radius: 11.4 }];
    const rocas = createJezeroRockScatter({ seed: plano.terrainSeed, lod: 0, dem, exclusions });
    const base = buildColonyGroup(plano, registry, dem);
    const grupo = new Group();
    grupo.add(cielo, createTerrain(opciones), rocas, base);
    const v = plano.views[1] ?? plano.views[0]!;
    const y = v.eyeHeight === undefined ? v.position[1] : terrainHeight(v.position[0], v.position[2], opciones) + v.eyeHeight;
    return {
      grupo,
      exterior: { cielo, actualizar: () => base.updateLods(camera), ambiente: plano.environment },
      camara: { posicion: new Vector3(v.position[0], y, v.position[2]), objetivo: new Vector3(...v.target), fov: v.fov },
    };
  }

  async function preparar(id: EscenarioId): Promise<void> {
    if (listos.has(id)) return;
    if (id === "colonia") { listos.set(id, await prepararColonia()); return; }
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
      const camara = { posicion: espacio.camera.position.clone(), objetivo: new Vector3(-1.45, 3.55, 0), fov: espacio.camera.fov };
      listos.set(id, { grupo, espacio, camara });
      return;
    }
    const plano = parseRoomLayout(SALAS_3D[id], registry);
    const sala = buildRoomFromLayout(plano, registry);
    const horneada = bakeRoomAO(sala.staticGroup, { samples: MUESTRAS_AO, radius: 0.95, strength: 0.92 });
    sala.staticGroup.traverse((nodo) => { if (nodo instanceof Mesh) nodo.geometry.dispose(); });
    const cielo = new Mesh(new SphereGeometry(90, 24, 16), materials.M_sky);
    cielo.position.y = -16;
    grupo.add(cielo, horneada.group, sala.lightsGroup);
    const v = plano.views[0]!;
    listos.set(id, { grupo, camara: { posicion: new Vector3(...v.position), objetivo: new Vector3(...v.target), fov: v.fov } });
  }

  function mostrar(id: EscenarioId, ambiente: string): void {
    if (actual?.id === id && actual.ambiente === ambiente) return;
    const nuevo = listos.get(id);
    if (!nuevo) throw new Error(`escenario sin preparar: ${id}`);
    if (actual) scene.remove(listos.get(actual.id)!.grupo);
    actual = { id, ambiente };
    segundosEnEspacio = 0;
    scene.add(nuevo.grupo);
    const { espacio, exterior } = nuevo;
    rendering.ao.enabled = !espacio;
    // En la colonia la luz y el terreno no se mueven: la sombra se calcula una vez.
    renderer.shadowMap.autoUpdate = !exterior;
    renderer.shadowMap.needsUpdate = true;
    camera.near = exterior ? 0.1 : 0.05;
    camera.far = exterior ? 60000 : 550;
    camera.updateProjectionMatrix();
    if (exterior) {
      terrainUniforms.biome.value = 0;
      terrainUniforms.useMask.value = 1;
      terrainUniforms.oxide.value.set(paletteHex("oxide"));
      terrainUniforms.shade.value.set(paletteHex("regolithShade"));
      applyEnvironment(rendering, presets.find((p) => p.id === exterior.ambiente) ?? presets[3]!);
      applyExteriorLightingCalibration(rendering);
      return;
    }
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
    const { espacio, exterior } = listos.get(actual.id)!;
    if (exterior) {
      camera.updateMatrixWorld();
      if (exterior.actualizar()) renderer.shadowMap.needsUpdate = true;
      exterior.cielo.position.copy(camera.position);
    }
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
    vista(id) {
      const v = listos.get(id)?.camara;
      if (!v) return;
      camera.position.copy(v.posicion);
      camera.lookAt(v.objetivo);
      camera.fov = v.fov;
      camera.updateProjectionMatrix();
    },
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
