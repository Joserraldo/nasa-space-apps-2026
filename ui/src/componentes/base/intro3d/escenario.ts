import * as THREE from "three";
import { colorToken, crearMateriales, type Materiales } from "../../../escena/materiales";
import { liberarEscena, liberarMateriales } from "../../../escena/liberar";

/**
 * Renderer mínimo de una viñeta de la intro (inicio/02): una escena chica de three que reutiliza
 * los modelos reales del juego (personajes, kit, módulos), así quedan al día cuando cambian.
 * Luz de DISEÑO §3.4: hemisférica cálida con suelo ciruela (sombras lilas, nunca negras),
 * direccional moderada desde arriba a la izquierda y relleno frío. Sin tone mapping ni posprocesado.
 *
 * Nota: el kit de la portada y la carga (#320, `base/inicio3d/`) resuelve lo mismo; se pueden unificar después.
 */

/** Lo que arma cada viñeta: su grupo, el encuadre de cámara y, si hay, su animación. */
export interface Vineta {
  grupo: THREE.Group;
  /** Cámara en `desde` mirando a `hacia`, con campo vertical `fov` para la proporción de la lámina (3:2). */
  camara: { desde: [number, number, number]; hacia: [number, number, number]; fov: number };
  /** Avanza la animación al instante `t` (segundos). `quieto`: pose clave sin vaivén. */
  animar?(t: number, quieto: boolean): void;
  /** Libera lo que no recorre `liberarEscena` (personajes, Iris). */
  liberar?(): void;
}

export type ArmarVineta = (m: Materiales) => Vineta;

export interface EscenarioVineta {
  redimensionar(ancho: number, alto: number): void;
  liberar(): void;
}

/** Proporción de la lámina: si la ventana es más angosta, se abre el campo para no recortar los lados. */
const PROPORCION_LAMINA = 1024 / 683;

export function montarVineta(lienzo: HTMLCanvasElement, armar: ArmarVineta, quieto: boolean): EscenarioVineta {
  const renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.setClearColor(colorToken("lila"));

  const escena = new THREE.Scene();
  const hemi = new THREE.HemisphereLight(colorToken("traje-marfil"), colorToken("ciruela"), 1.7);
  const sol = new THREE.DirectionalLight(colorToken("marfil"), 2.2);
  sol.position.set(-3, 5, 4);
  const relleno = new THREE.DirectionalLight(colorToken("lila"), 0.6);
  relleno.position.set(3, 1.5, 3);
  escena.add(hemi, sol, relleno);

  const materiales = crearMateriales();
  const vineta = armar(materiales);
  escena.add(vineta.grupo);

  const { desde, hacia, fov } = vineta.camara;
  const camara = new THREE.PerspectiveCamera(fov, PROPORCION_LAMINA, 0.05, 200);
  camara.position.set(...desde);
  camara.lookAt(...hacia);

  const inicio = performance.now();
  let cuadro = 0;
  const dibujar = () => {
    vineta.animar?.((performance.now() - inicio) / 1000, quieto);
    renderer.render(escena, camara);
  };
  const bucle = () => {
    dibujar();
    cuadro = requestAnimationFrame(bucle);
  };

  return {
    redimensionar(ancho, alto) {
      if (ancho < 1 || alto < 1) return;
      renderer.setSize(ancho, alto, false);
      const proporcion = ancho / alto;
      camara.aspect = proporcion;
      // Campo horizontal fijo cuando la pantalla es más angosta que la lámina (celular vertical).
      const tan = Math.tan(THREE.MathUtils.degToRad(fov / 2));
      camara.fov = proporcion >= PROPORCION_LAMINA ? fov : THREE.MathUtils.radToDeg(2 * Math.atan((tan * PROPORCION_LAMINA) / proporcion));
      camara.updateProjectionMatrix();
      if (quieto) dibujar();
      else if (!cuadro) bucle();
    },
    liberar() {
      cancelAnimationFrame(cuadro);
      vineta.liberar?.();
      liberarEscena(escena);
      liberarMateriales(Object.values(materiales));
      renderer.dispose();
    },
  };
}
