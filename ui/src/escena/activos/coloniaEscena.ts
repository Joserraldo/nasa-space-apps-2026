/**
 * Monta la colonia (Etapas D2 y D3) en la escena armada cuando llegan los GLB: quita el decorado procedural viejo
 * (`Base_Buildings`, balizas y placas de anclaje), conserva las lomas, coloca los modelos CC BY (hábitat, torre,
 * reciclador, cápsula de llegada), cambia los sólidos de invernadero, escudo y reciclador, y agrega a Perseverance con
 * Ingenuity (solo en el sitio `cerca-de-perseverance`) y un tripulante que camina por el anillo.
 * Las huellas de colisión de la colonia salen de `huellasColonia` (`colonia.ts`).
 */
import * as THREE from "three";
import { clone as clonarEsqueleto } from "three/examples/jsm/utils/SkeletonUtils.js";
import type { Materiales } from "../materiales";
import { liberarEscena } from "../liberar";
import { decorado, alCentro } from "./baseExterior";
import { ANILLO } from "./caminos";
import { HABITAT_COLONIA, TORRE_COLONIA, armarColonia, fusionarConUV, kitDesdeGltf, quaterniusDesdeGltf } from "./colonia";
import { colorLuz, crearTuberias, type MaterialesColonia } from "./coloniaPiezas";
import { crearDomoVidrio, crearEmisorEscudo } from "./domoVidrio";
import type { ModelosModulos } from "./modelosModulos";
import { reemplazarSolido, type ModuloArmado } from "./modulosArmados";
import type { ModuloBase } from "./modulos";
import { crearPlataformaNave } from "./nave";
import { colocar } from "./modulos";
import { fusionar } from "./fusionar";
import { materialCeldasPanel, materialCuerpoPanel } from "./panelSolar";
import { crearPerseverance } from "./perseverance";
import { PALETA, conPolvo, crearPaleta, materialKit, materialLuces, materialMarco, materialQuaternius, materialRegolito, materialVidrio, type OpcionesPolvo } from "./polvoKit";

/** Sitio de aterrizaje donde se ven los vehículos de NASA (`missions/src/jezero.ts`). */
export const SITIO_PERSEVERANCE = "cerca-de-perseverance";
/**
 * Perseverance e Ingenuity: fuera del círculo caminable (radio 20), entre el laboratorio y la cúpula chica, mirando a
 * la base. Tamaño real: Ingenuity mide medio metro de alto. [E]
 */
export const VEHICULOS_NASA = { x: 17, z: -14, ingenuity: [2.6, 1.8] as const } as const;
/** Tripulante: alto (m), velocidad (m/s) y vuelta del anillo exterior que recorre. [E] */
export const TRIPULANTE = { alto: 1.75, velocidad: 0.8 } as const;

/** Escala de cada CC BY: el GLB mide 7,6 m (hábitat) y 6,4 m (torre) en su lado mayor. */
const LADO_GLB = { habitat: 7.6, torre: 6.4, reciclador: 2.9 } as const;
/** Reciclador dentro de su huella (2,3 × 1,5): escala y tubería hasta el domo por +z local. [E] */
const RECICLADOR = { escala: 0.82, tubo: [0.95, 2.25] as const } as const;

/** Polvo de los modelos CC BY: menos que el kit para no ensuciar el vidrio del domo. */
const POLVO_CCBY: OpcionesPolvo = { base: 0.03, suelo: 0.5, arriba: 0.04, chorreado: 0.06 };

function quitar(o: THREE.Object3D | undefined): void {
  if (!o) return;
  o.removeFromParent();
  liberarEscena(o);
}

/**
 * Vidrio de la textura de un CC BY al azul único de la paleta (`clasificacion-objetos.md`, regla 7): los píxeles azulados
 * toman `PALETA.azul` con su misma luz relativa. Sin imagen (pruebas de Node) devuelve la textura tal cual.
 */
function texturaAzulUnico(t: THREE.Texture): { mapa: THREE.Texture; rugosidad: THREE.Texture | null } {
  const img = t.image as (CanvasImageSource & { width: number; height: number }) | undefined;
  if (!img || typeof document === "undefined" || !img.width) return { mapa: t, rugosidad: null };
  const lienzo = document.createElement("canvas");
  lienzo.width = img.width;
  lienzo.height = img.height;
  const ctx = lienzo.getContext("2d");
  if (!ctx) return { mapa: t, rugosidad: null };
  ctx.drawImage(img, 0, 0);
  const datos = ctx.getImageData(0, 0, lienzo.width, lienzo.height);
  const p = datos.data;
  // Luz relativa respecto del azul de la paleta, en sRGB como la imagen.
  const [ar, ag, ab] = [1, 3, 5].map((i) => parseInt(PALETA.azulClaro.slice(i, i + 2), 16)) as [number, number, number];
  // Rugosidad (canal verde): el vidrio liso y brillante, el resto mate.
  const rug = document.createElement("canvas");
  rug.width = lienzo.width;
  rug.height = lienzo.height;
  const ctxR = rug.getContext("2d")!;
  const datosR = ctxR.createImageData(rug.width, rug.height);
  const q = datosR.data;
  const ref = 0.2126 * ar + 0.7152 * ag + 0.0722 * ab;
  for (let i = 0; i < p.length; i += 4) {
    const r = p[i]!, g = p[i + 1]!, b = p[i + 2]!;
    // Azules y turquesas (el vidrio de la textura es turquesa: verde y azul por encima del rojo).
    const vidrio = b > r + 25 && g > r + 10 && b + 25 >= g;
    q[i] = q[i + 1] = q[i + 2] = vidrio ? 30 : 235;
    q[i + 3] = 255;
    if (vidrio) {
      // El vidrio original es oscuro: se toma el azul de la paleta casi tal cual, con ±15 % de su luz relativa.
      const k = Math.min(1.15, Math.max(0.85, 0.85 + 0.3 * ((0.2126 * r + 0.7152 * g + 0.0722 * b) / ref)));
      p[i] = Math.min(255, ar * k);
      p[i + 1] = Math.min(255, ag * k);
      p[i + 2] = Math.min(255, ab * k);
    }
  }
  ctx.putImageData(datos, 0, 0);
  ctxR.putImageData(datosR, 0, 0);
  const rugosidad = new THREE.CanvasTexture(rug);
  rugosidad.flipY = t.flipY;
  rugosidad.wrapS = t.wrapS;
  rugosidad.wrapT = t.wrapT;
  const nueva = new THREE.CanvasTexture(lienzo);
  nueva.flipY = t.flipY;
  nueva.colorSpace = t.colorSpace;
  nueva.wrapS = t.wrapS;
  nueva.wrapT = t.wrapT;
  nueva.name = `${t.name}_AzulUnico`;
  return { mapa: nueva, rugosidad };
}

/** Clona un GLB con materiales propios (mate y con polvo desde abajo), sombras y sin transmisión. */
function prepararModelo(raiz: THREE.Object3D, polvo: OpcionesPolvo = POLVO_CCBY, esqueleto = false, azulUnico = false): THREE.Object3D {
  const copia = esqueleto ? clonarEsqueleto(raiz) : raiz.clone();
  const clones = new Map<THREE.Material, THREE.MeshStandardMaterial>();
  copia.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    o.castShadow = o.receiveShadow = true;
    const original = o.material as THREE.MeshStandardMaterial;
    let m = clones.get(original);
    if (!m) {
      m = original.clone();
      if (m instanceof THREE.MeshPhysicalMaterial) m.transmission = 0;
      m.roughness = Math.max(m.roughness, 0.82);
      m.metalness = Math.min(m.metalness, 0.1);
      if (azulUnico && m.map) {
        const { mapa, rugosidad } = texturaAzulUnico(m.map);
        m.map = mapa;
        if (rugosidad) {
          m.roughnessMap = rugosidad;
          m.roughness = 1;
          m.metalness = 0;
          m.envMapIntensity = 1.4;
        }
      }
      clones.set(original, conPolvo(m, { ...polvo, color: PALETA.polvo }));
    }
    o.material = m;
  });
  return copia;
}

/** Lo que la escena anima o cambia después de montar la colonia. */
export interface ColoniaViva {
  /** Perseverance e Ingenuity (visibles solo en su sitio). */
  nasa: THREE.Object3D;
  mostrarSitio(sitio: string | null | undefined): void;
  animar(ahora: number, reducido: boolean): void;
}

/** Punto y rumbo a `s` metros sobre el anillo exterior (cerrado). */
function sobreAnillo(s: number): { x: number; z: number; rumbo: number } {
  const tramos = ANILLO.slice(1).map((b, i) => ({ a: ANILLO[i]!, b, l: Math.hypot(b[0] - ANILLO[i]![0], b[1] - ANILLO[i]![1]) }));
  const total = tramos.reduce((t, x) => t + x.l, 0);
  let r = ((s % total) + total) % total;
  for (const t of tramos) {
    if (r <= t.l) {
      const k = r / t.l;
      return { x: t.a[0] + (t.b[0] - t.a[0]) * k, z: t.a[1] + (t.b[1] - t.a[1]) * k, rumbo: Math.atan2(t.b[0] - t.a[0], t.b[1] - t.a[1]) };
    }
    r -= t.l;
  }
  return { x: ANILLO[0]![0], z: ANILLO[0]![1], rumbo: 0 };
}

export function ponerColonia(
  base: THREE.Group,
  materiales: Materiales,
  modulos: Readonly<Record<ModuloBase, ModuloArmado>>,
  modelos: ModelosModulos,
): ColoniaViva {
  const kit = kitDesdeGltf(modelos.kit);
  const paleta = crearPaleta();
  const m: MaterialesColonia = {
    kit: materialKit(paleta),
    regolito: materialRegolito(),
    luz: materialLuces(),
    vidrio: materialVidrio(),
    marco: materialMarco(paleta),
    quat: materialQuaternius(),
  };
  const q = quaterniusDesdeGltf(modelos.quaternius);
  // Viejo: decorado fusionado (menos las lomas), balizas con tapa cian y placas octogonales.
  const viejo = base.getObjectByName("Base_Buildings");
  const lomas = viejo?.getObjectByName("Mounds");
  if (lomas) base.attach(lomas);
  quitar(viejo);
  quitar(base.getObjectByName("Kit_Beacon_Instanced"));
  quitar(base.getObjectByName("Module_Anchor_Instanced"));
  // Queda la plataforma (fuera de los dos encuadres) con la cápsula de llegada CC BY en lugar de la nave procedural.
  const nave = decorado("plataforma_nave");
  const plataforma = crearPlataformaNave(materiales);
  const vieja = plataforma.getObjectByName("Ship");
  vieja?.removeFromParent();
  if (vieja) liberarEscena(vieja);
  const envoltura = new THREE.Group();
  envoltura.add(colocar(plataforma, [nave.x, 0, nave.z], [0, alCentro(nave.x, nave.z), 0]));
  const quedan: THREE.Object3D[] = [fusionar(envoltura, "Colony_KeptShipPad")];
  const capsula = prepararModelo(modelos.capsula);
  capsula.position.set(nave.x, 0.76, nave.z);
  capsula.rotation.y = alCentro(nave.x, nave.z);
  quedan.push(capsula);
  const panel = { cuerpo: conPolvo(materialCuerpoPanel(), { base: 0.1, suelo: 0.5, arriba: 0.3, chorreado: 0 }), celdas: materialCeldasPanel("Colony_PanelCells") };
  base.add(armarColonia(kit, m, panel, { quedan, q }));

  // Hábitat (refugio de la tormenta) y torre de comunicaciones: CC BY tal cual, con polvo mate.
  const habitat = prepararModelo(modelos.habitat, POLVO_CCBY, false, true);
  habitat.name = "Colony_Habitat";
  habitat.scale.setScalar(HABITAT_COLONIA.ancho / LADO_GLB.habitat);
  habitat.position.set(HABITAT_COLONIA.x, 0, HABITAT_COLONIA.z);
  const t = decorado("torre");
  const torre = prepararModelo(modelos.torre, POLVO_CCBY, false, true);
  torre.name = "Colony_CommsTower";
  const escalaTorre = TORRE_COLONIA.ancho / LADO_GLB.torre;
  torre.scale.setScalar(escalaTorre);
  torre.position.set(t.x, 0, t.z);
  torre.rotation.y = alCentro(t.x, t.z);
  // Luz roja que parpadea en lo alto del plato (comunicaciones rojo).
  const baliza = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 4), new THREE.MeshBasicMaterial({ name: "Tower_Beacon", color: colorLuz("rojo", 2.2) }));
  baliza.name = "Tower_Beacon";
  baliza.position.set(t.x, 5.75 * escalaTorre * (6.4 / LADO_GLB.torre) + 0.15, t.z);
  base.add(habitat, torre, baliza);

  // Módulos: invernadero de vidrio con estantes y luz, escudo de sacos y reciclador CC BY con su tubería al hábitat.
  reemplazarSolido(modulos.invernadero, fusionarConUV(crearDomoVidrio(m, { radio: 2.65, estantes: 2, rampa: q.Ramp }), "Module_Greenhouse"), [0, 2.72, 0]);
  // Escudo: emisor en forma de domo chico; la protección es la cúpula de `escudoTormenta.ts`.
  reemplazarSolido(modulos.escudo, fusionarConUV(crearEmisorEscudo(m), "Module_Shield"), [0, 1.3, 0]);
  const reciclador = new THREE.Group();
  const estacion = prepararModelo(modelos.reciclador);
  estacion.scale.setScalar(RECICLADOR.escala);
  reciclador.add(estacion, fusionarConUV(crearTuberias(m, RECICLADOR.tubo[0], RECICLADOR.tubo[1]), "Recycler_PipesMerged"));
  reemplazarSolido(modulos.reciclador_agua, reciclador, [0, 1.7, -0.2]);

  // Vehículos de NASA en Jezero: Perseverance (low poly propio) e Ingenuity (NASA 3D Resources reducido).
  const nasa = new THREE.Group();
  nasa.name = "NASA_Jezero";
  const rover = crearPerseverance();
  const ingenuity = prepararModelo(modelos.ingenuity, { base: 0.08, suelo: 0.5, arriba: 0.2, chorreado: 0 });
  ingenuity.position.set(VEHICULOS_NASA.ingenuity[0], 0, VEHICULOS_NASA.ingenuity[1]);
  const rotores = ["rotors_01", "rotors_02"].map((n) => ingenuity.getObjectByName(n)).filter((x): x is THREE.Object3D => !!x);
  nasa.add(rover, ingenuity);
  nasa.position.set(VEHICULOS_NASA.x, 0, VEHICULOS_NASA.z);
  nasa.rotation.y = alCentro(VEHICULOS_NASA.x, VEHICULOS_NASA.z);
  nasa.visible = false;
  base.add(nasa);

  // Tripulante que camina por el anillo exterior (CC BY, con su ciclo de caminar de 1,33 s).
  const tripulante = prepararModelo(modelos.tripulante, { base: 0.05, suelo: 0.35, arriba: 0.1, chorreado: 0 }, true);
  tripulante.name = "Colony_Walker";
  // Visor del casco: el naranja del modelo pasa a grafito con brillo (sin naranja en la colonia).
  tripulante.traverse((o) => {
    if (o instanceof THREE.Mesh && o.material instanceof THREE.MeshStandardMaterial && o.material.name.startsWith("helmet")) {
      o.material.color.set(PALETA.grafito);
      o.material.roughness = 0.25;
    }
  });
  const mezclador = new THREE.AnimationMixer(tripulante);
  const clip = modelos.tripulante.animations[0];
  if (clip) mezclador.clipAction(clip).play();
  mezclador.update(0);
  tripulante.updateMatrixWorld(true);
  const caja = new THREE.Box3().setFromObject(tripulante, true);
  const alto = Math.max(0.01, caja.max.y - caja.min.y);
  const escala = TRIPULANTE.alto / alto;
  const cuerpo = new THREE.Group();
  cuerpo.add(tripulante);
  tripulante.scale.multiplyScalar(escala);
  tripulante.position.y = -caja.min.y * escala;
  base.add(cuerpo);

  let previo = -1;
  let recorrido = 12;
  return {
    nasa,
    mostrarSitio(sitio) {
      nasa.visible = sitio === SITIO_PERSEVERANCE;
    },
    animar(ahora, reducido) {
      const dt = previo < 0 ? 0 : Math.min(0.1, (ahora - previo) / 1000);
      previo = ahora;
      // Con movimiento reducido: todo quieto en su estado final (rotores parados, baliza encendida, tripulante quieto).
      baliza.visible = reducido || Math.sin(ahora / 260) > -0.2;
      if (!reducido) {
        if (nasa.visible) rotores.forEach((r, i) => (r.rotation.y += (i ? -1 : 1) * dt * 1.4));
        mezclador.update(dt);
        recorrido += dt * TRIPULANTE.velocidad;
      }
      const p = sobreAnillo(recorrido);
      cuerpo.position.set(p.x, 0, p.z);
      cuerpo.rotation.y = p.rumbo;
    },
  };
}
