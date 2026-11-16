import * as THREE from "three";
import { animar, crearIris, crearPersonaje, type CaraIris, type Gesto, type OpcionesIris } from "./personajes";
import { cadenciaCaminar } from "./personajes/animaciones";
import { VEL_JUGADOR } from "./movimientoBase";
import type { ModoGuia } from "./guia";
import type { FaseSalto } from "./movimientoBase";
import { ANCLAJES_EXPERTAS, DOCK_IRIS, INICIO_JUGADOR, type ExpertaBase } from "./mundo";
import type { VistaEscena } from "./vista";

/** Cada experta se vuelve hacia el niño cuando está a esta distancia (m). [E] */
export const DISTANCIA_ATENCION = 3.6;
/** Al acercarse el niño, saluda este tiempo y después explica. */
const MS_SALUDO = 1600;
/** Giro de las expertas hacia el niño, rad/s. */
const GIRO_INGENIERA = 4;
/** Cara de Iris según lo que hace como guía (si no está apagada ni averiada). */
const CARA_GUIA: Readonly<Record<ModoGuia, CaraIris>> = { acompana: "atenta", guia: "atenta", espera: "pensando", llego: "feliz" };

function girarHacia(actual: number, deseado: number, max: number): number {
  const d = ((((deseado - actual + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) - Math.PI;
  return actual + Math.max(-max, Math.min(max, d));
}

/**
 * Montaje de los modelos vigentes de develop; no redefine geometrías ni balance. La posición del
 * niño y de Iris la escribe la escena (desde `movimientoBase`); aquí se eligen gestos, caras y el
 * giro de la Ingeniera. Sin asignaciones por fotograma.
 */
/** Las tres expertas de la base, cada una en su estación (A6): taller, hábitat y sensor. */
export const EXPERTAS_BASE: readonly ExpertaBase[] = ["ingeniera", "doctora", "meteorologa"];

export function crearTripulacionBase() {
  const grupo = new THREE.Group();
  grupo.name = "Tripulacion_Base";
  const jugador = crearPersonaje("nino");
  const iris = crearIris();
  jugador.grupo.position.set(INICIO_JUGADOR.x, 0, INICIO_JUGADOR.z);
  jugador.grupo.rotation.y = Math.PI;
  // Cada experta en su anclaje, mirando hacia donde empieza el niño.
  const expertas = EXPERTAS_BASE.map((id) => {
    const pj = crearPersonaje(id);
    const a = ANCLAJES_EXPERTAS[id];
    pj.grupo.position.set(a.x, a.y, a.z);
    const rumbo = Math.atan2(INICIO_JUGADOR.x - a.x, INICIO_JUGADOR.z - a.z);
    pj.grupo.rotation.y = rumbo;
    // Las expertas no proyectan sombra del Sol: las apoya la sombra de contacto (D2), y así las tres caben en
    // el presupuesto de la vista (cada sombra suma una pasada con todos sus triángulos). El Sol queda para el niño.
    const cuerpo = pj.grupo.getObjectByName("cuerpo");
    if (cuerpo) cuerpo.castShadow = false;
    return { id, pj, rumbo, atendiendoDesde: -1 };
  });
  const [ingeniera, doctora, meteorologa] = expertas.map((e) => e.pj) as [ReturnType<typeof crearPersonaje>, ReturnType<typeof crearPersonaje>, ReturnType<typeof crearPersonaje>];
  iris.grupo.position.set(DOCK_IRIS.x, DOCK_IRIS.y, DOCK_IRIS.z);
  iris.grupo.rotation.y = Math.atan2(INICIO_JUGADOR.x - DOCK_IRIS.x, INICIO_JUGADOR.z - DOCK_IRIS.z);
  grupo.add(jugador.grupo, ...expertas.map((e) => e.pj.grupo), iris.grupo);
  const cascos = crearCascosInstanciados([jugador, ...expertas.map((e) => e.pj)]);
  grupo.add(cascos.malla);
  // Objetos reutilizados en cada frame.
  const gesto = { quieto: true };
  /** Opciones del niño: paso según la rapidez (A4) y capa de salto (A5). */
  const gestoNino: { quieto: boolean; fase: number; ritmo: number; salto: { fase: FaseSalto; k: number } } = { quieto: true, fase: 0, ritmo: 0, salto: { fase: "suelo", k: 0 } };
  const rover: OpcionesIris = { quieto: true, velocidad: 0, averiada: false, cara: "atenta" };
  /** Lo escribe la escena en cada fotograma, después de mover a los actores (`errorIris`, al cambiar el pedido). */
  const actores = { caminando: false, velocidad: 0, salto: { fase: "suelo", k: 0 } as Readonly<{ fase: FaseSalto; k: number }>, velocidadIris: 0, modoIris: "acompana" as ModoGuia, errorIris: false };
  let apagada = false;
  let ultimoMs = -1;
  let liberada = false;
  const animarTripulacion = (ahoraMs: number, reducido: boolean) => {
    if (liberada) return;
    gesto.quieto = reducido;
    rover.quieto = reducido;
    const t = ahoraMs / 1000;
    const dt = ultimoMs >= 0 ? Math.min(0.1, Math.max(0, (ahoraMs - ultimoMs) / 1000)) : 0;
    ultimoMs = ahoraMs;

    // El niño camina con el gesto de caminar; quieto, en reposo (con movimiento reducido, la pose clave).
    // La cadencia y el largo del paso siguen a la rapidez real: arranca y frena con pasos cortos (A4).
    gestoNino.quieto = reducido;
    gestoNino.ritmo = Math.min(1, actores.velocidad / VEL_JUGADOR);
    gestoNino.fase = actores.caminando ? (gestoNino.fase + cadenciaCaminar(gestoNino.ritmo) * dt) % (Math.PI * 2) : 0;
    gestoNino.salto.fase = actores.salto.fase;
    gestoNino.salto.k = actores.salto.k;
    animar(jugador, actores.caminando ? "caminar" : "reposo", t, gestoNino);

    // Cada experta se vuelve hacia el niño si está cerca: saluda y después explica (A7 la vuelve coreografía).
    const p = jugador.grupo.position;
    for (const e of expertas) {
      const q = e.pj.grupo.position;
      const cerca = Math.hypot(p.x - q.x, p.z - q.z) <= DISTANCIA_ATENCION;
      let g: Gesto = "reposo";
      let deseado = e.rumbo;
      if (cerca) {
        if (e.atendiendoDesde < 0) e.atendiendoDesde = ahoraMs;
        g = ahoraMs - e.atendiendoDesde < MS_SALUDO ? "saludar" : "explicar";
        deseado = Math.atan2(p.x - q.x, p.z - q.z);
      } else e.atendiendoDesde = -1;
      e.pj.grupo.rotation.y = reducido ? deseado : girarHacia(e.pj.grupo.rotation.y, deseado, GIRO_INGENIERA * dt);
      animar(e.pj, g, t, gesto);
    }

    // Iris: ruedas con su rapidez real (con umbral anti-temblor cuando está parada) y cara según lo que hace.
    rover.velocidad = actores.velocidadIris > 0.12 ? actores.velocidadIris : 0;
    // La guía pide cara de error (avería revelada): la muestra aunque la vista todavía no la marque averiada.
    if (!apagada) rover.cara = actores.errorIris ? "error" : CARA_GUIA[actores.modoIris];
    iris.animar(t, rover);
    cascos.actualizar(grupo);
  };
  animarTripulacion(0, true);
  return {
    grupo, jugador, ingeniera, doctora, meteorologa, iris, actores,
    /** Las expertas por id, para la cercanía (`Interactivo` de tipo actor) y los globos. */
    expertas: { ingeniera, doctora, meteorologa } as Readonly<Record<ExpertaBase, ReturnType<typeof crearPersonaje>>>,
    aplicarVista(vista: VistaEscena) {
      apagada = vista.iris.nivel === "offline";
      rover.averiada = !apagada && vista.iris.averiada;
      rover.cara = apagada ? "apagada" : CARA_GUIA[actores.modoIris];
    },
    animar: animarTripulacion,
    liberar() {
      if (liberada) return;
      liberada = true;
      // Cada fábrica libera también su esqueleto; el liberador genérico de mallas no lo hace.
      grupo.removeFromParent();
      cascos.liberar();
      jugador.liberar();
      for (const e of expertas) e.pj.liberar();
      iris.liberar();
    },
  };
}
export type TripulacionBase = ReturnType<typeof crearTripulacionBase>;

/**
 * Los cascos (la burbuja translúcida de cada humano) en un solo `InstancedMesh`: es la misma geometría
 * (`IcosahedronGeometry(1, 1)` escalada) con el mismo material compartido, así que cuatro cascos cuestan
 * una llamada de dibujo en vez de cuatro (A6: con las tres expertas, la vista sigue en ≤ 80). El casco
 * original de cada personaje queda oculto; en cada fotograma la instancia copia su matriz (sigue al torso).
 * Si el personaje está oculto (primera persona), su instancia se encoge a cero.
 */
function crearCascosInstanciados(personajes: readonly ReturnType<typeof crearPersonaje>[]) {
  const originales = personajes.map((p) => p.grupo.getObjectByName("casco") as THREE.Mesh);
  const geometria = new THREE.IcosahedronGeometry(1, 1);
  const malla = new THREE.InstancedMesh(geometria, originales[0]!.material, originales.length);
  malla.name = "Cascos_Instanciados";
  malla.renderOrder = originales[0]!.renderOrder;
  malla.frustumCulled = false; // las instancias se mueven por toda la base
  for (const o of originales) o.visible = false;
  const inversa = new THREE.Matrix4();
  const m = new THREE.Matrix4();
  const cero = new THREE.Matrix4().makeScale(0, 0, 0);
  return {
    malla,
    actualizar(raiz: THREE.Object3D) {
      raiz.updateMatrixWorld(true);
      inversa.copy(raiz.matrixWorld).invert();
      originales.forEach((o, i) => {
        const visible = personajes[i]!.grupo.visible;
        malla.setMatrixAt(i, visible ? m.multiplyMatrices(inversa, o.matrixWorld) : cero);
      });
      malla.instanceMatrix.needsUpdate = true;
    },
    liberar() {
      malla.removeFromParent();
      geometria.dispose();
      malla.dispose();
    },
  };
}
