/**
 * Kit de las ilustraciones 3D de la portada y la carga (inicio/01 y 03, DISEÑO §6). No son imágenes:
 * montan los modelos reales del juego (niño, nave, módulos) en un lienzo transparente encima del
 * fondo DOM, así que si cambia un modelo, cambian estas pantallas.
 *
 * Cámara ortográfica en píxeles CSS: cada pieza se encaja entera en su caja (en % del lienzo, como
 * las cajas de DISEÑO §6) sin deformarse. Luz de DISEÑO §3.4: hemisférica cálida con suelo ciruela
 * (sombras lilas, nunca negras) y una direccional desde arriba a la izquierda. Sin tone mapping.
 */
import * as THREE from "three";
import { COLORES, type TokenColor } from "../../../estilos/tokens.js";
import { liberarEscena } from "../../../escena/liberar.js";

/** Caja en % del lienzo: x, y desde arriba a la izquierda. */
export interface Caja { x: number; y: number; w: number; h: number }

export interface Pieza {
  objeto: THREE.Object3D;
  /** Caja según el tamaño del lienzo en px; null la oculta. Una caja que sale del lienzo recorta la pieza. */
  caja(ancho: number, alto: number): Caja | null;
  /** Orden de profundidad: mayor, más adelante. */
  capa: number;
  /** Por cuadro (solo con movimiento): desplazamiento en px (y hacia abajo) y giro en grados. */
  mover?(t: number): { dx?: number; dy?: number; giro?: number } | void;
}

export interface Ilustracion {
  piezas: Pieza[];
  /** Después de encajar todo (tender el cable o la órbita entre piezas ya ubicadas). */
  encajado?(ancho: number, alto: number, escena: THREE.Scene): void;
  liberar?(): void;
}

export type CrearIlustracion = () => Ilustracion;

/** Igual que las reglas de `inicio.css`: celular horizontal, vertical (y tableta de pie) o ancho. */
export type Modo = "ancho" | "horizontal" | "vertical";
export function modoInicio(ancho: number, alto: number): Modo {
  if (alto <= 500) return "horizontal";
  return ancho < 900 ? "vertical" : "ancho";
}

export const color = (t: TokenColor): THREE.Color => new THREE.Color(COLORES[t]);
export const mezcla = (a: TokenColor, b: TokenColor, k: number): THREE.Color => color(a).lerp(color(b), k);

/** Material mate de caras planas (DISEÑO §3.4): Lambert, más barato que Standard en celular. */
export function mate(c: THREE.Color | TokenColor, extra: THREE.MeshLambertMaterialParameters = {}): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color: typeof c === "string" ? color(c) : c, flatShading: true, ...extra });
}

/** Pasa de px del lienzo (y hacia abajo) al mundo de la cámara (y hacia arriba). */
export const aMundo = (x: number, y: number, z = 0): THREE.Vector3 => new THREE.Vector3(x, -y, z);

/**
 * Encaja `contenido` (hijo de `marco`) entero en `caja`, centrado y sin deformar. El marco queda en el
 * centro de la caja: los giros del movimiento son alrededor de ese centro.
 */
export function encajar(marco: THREE.Object3D, contenido: THREE.Object3D, caja: Caja, ancho: number, alto: number, capa = 0): number {
  marco.position.set(0, 0, 0);
  marco.rotation.set(0, 0, 0);
  marco.scale.setScalar(1);
  contenido.position.set(0, 0, 0);
  marco.updateMatrixWorld(true);
  const b = new THREE.Box3().setFromObject(contenido, true);
  const tam = b.getSize(new THREE.Vector3());
  const centro = b.getCenter(new THREE.Vector3());
  const s = Math.min(((caja.w / 100) * ancho) / Math.max(tam.x, 1e-6), ((caja.h / 100) * alto) / Math.max(tam.y, 1e-6));
  contenido.position.copy(centro).multiplyScalar(-1);
  marco.scale.setScalar(s);
  marco.position.copy(aMundo(((caja.x + caja.w / 2) / 100) * ancho, ((caja.y + caja.h / 2) / 100) * alto, capa * 2000));
  marco.updateMatrixWorld(true);
  return s;
}

/**
 * Monta la ilustración en `lienzo` y devuelve la función que la desmonta (libera renderer, mallas y
 * materiales propios). `quieto` (prefers-reduced-motion) dibuja un solo cuadro por cambio de tamaño.
 */
export function arrancar(lienzo: HTMLCanvasElement, crear: CrearIlustracion, quieto: boolean): () => void {
  const renderer = new THREE.WebGLRenderer({ canvas: lienzo, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const escena = new THREE.Scene();
  escena.add(new THREE.HemisphereLight(mezcla("marfil", "lila", 0.5), mezcla("lila", "ciruela", 0.55), 1.7));
  const sol = new THREE.DirectionalLight(color("traje-marfil"), 2.1);
  sol.position.set(-1, 1.3, 1.2);
  escena.add(sol);
  const camara = new THREE.OrthographicCamera(0, 1, 0, -1, 1, 40000);
  camara.position.z = 20000;

  const ilustracion = crear();
  const marcos = ilustracion.piezas.map((p) => {
    const marco = new THREE.Group();
    marco.add(p.objeto);
    escena.add(marco);
    return { p, marco, base: new THREE.Vector3(), escala: 1 };
  });

  let ancho = 0;
  let alto = 0;
  const encajarTodo = () => {
    ancho = lienzo.clientWidth;
    alto = lienzo.clientHeight;
    if (!ancho || !alto) return false;
    renderer.setSize(ancho, alto, false);
    Object.assign(camara, { left: 0, right: ancho, top: 0, bottom: -alto });
    camara.updateProjectionMatrix();
    for (const m of marcos) {
      const caja = m.p.caja(ancho, alto);
      m.marco.visible = caja !== null;
      if (caja) m.escala = encajar(m.marco, m.p.objeto, caja, ancho, alto, m.p.capa);
      m.base.copy(m.marco.position);
    }
    ilustracion.encajado?.(ancho, alto, escena);
    return true;
  };

  const dibujar = (t: number) => {
    if (!quieto) {
      for (const m of marcos) {
        const d = m.p.mover?.(t);
        if (!d) continue;
        m.marco.position.set(m.base.x + (d.dx ?? 0), m.base.y - (d.dy ?? 0), m.base.z);
        m.marco.rotation.z = THREE.MathUtils.degToRad(d.giro ?? 0);
      }
    }
    renderer.render(escena, camara);
  };

  let cuadro = 0;
  const inicio = performance.now();
  const ciclo = () => {
    dibujar((performance.now() - inicio) / 1000);
    cuadro = requestAnimationFrame(ciclo);
  };
  // Contadores del último cuadro tras encajar, para la ficha del PR (APLICACION §8: < 80 llamadas).
  const medir = () => {
    lienzo.dataset.llamadas = String(renderer.info.render.calls);
    lienzo.dataset.triangulos = String(renderer.info.render.triangles);
  };
  const observador = new ResizeObserver(() => {
    if (!encajarTodo()) return;
    dibujar(0);
    medir();
  });
  observador.observe(lienzo);
  if (encajarTodo()) {
    dibujar(0);
    medir();
  }
  if (!quieto) cuadro = requestAnimationFrame(ciclo);

  return () => {
    cancelAnimationFrame(cuadro);
    observador.disconnect();
    ilustracion.liberar?.();
    liberarEscena(escena);
    renderer.dispose();
    renderer.forceContextLoss();
  };
}
