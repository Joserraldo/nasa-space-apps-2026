import * as THREE from "three";
import { direccionSolActual, OPCIONES_DOMO, PALETA_CIELO, pintarDomo, RADIO_DOMO, TAMANO_HALO, type Cielo } from "./cielo";

/**
 * Experimental: visible Sun disc behind `?sol=1`.
 *
 * The sky dome painted the Sun halo in vertex colors on a 48x24 sphere, which looks blotchy and has no
 * readable Sun. This draws a small disc plus a soft glow along `direccionSolActual()` (the direction the
 * day cycle gives the light), so disc, glow and shadows always agree, and takes over the dome halo:
 * the glow keeps the halo colors, including the blue Martian sunset (MARTE.md section 4), growing as the
 * Sun gets low.
 *
 * Seen from Mars the Sun is about 0.35 degrees wide (2/3 of Earth's view: Mars is ~1.52 AU away). At game
 * scale that is ~6 px, so the disc is drawn at 0.9 degrees to stay readable.
 */

const DISTANCIA = RADIO_DOMO * 0.8;
const GRADOS_DISCO = 0.9;
const GRADOS_BRILLO = 9;
/** Sun elevation (degrees) of the day look and of the sunset look, to blend the glow. */
const ELEVACION_DIA = 38;
const ELEVACION_ATARDECER = 5;

export interface OpcionesSol {
  /** Glow strength: 1 on Mars (dusty air), low on airless worlds (the Moon, space). */
  brillo: number;
  /** Disc size multiplier (the Sun looks 1.5x bigger from the Moon than from Mars). */
  tamano: number;
}

function texturaRadial(paradas: readonly [number, string][]): THREE.CanvasTexture {
  const lienzo = document.createElement("canvas");
  lienzo.width = lienzo.height = 128;
  const ctx = lienzo.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  for (const [t, c] of paradas) g.addColorStop(t, c);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(lienzo);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const escalaDe = (grados: number) => 2 * DISTANCIA * Math.tan(THREE.MathUtils.degToRad(grados) / 2);

function sprite(textura: THREE.Texture, grados: number, nombre: string): THREE.Sprite {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: textura, fog: false, depthWrite: false, toneMapped: false, transparent: true }));
  s.name = nombre;
  s.scale.setScalar(escalaDe(grados));
  s.frustumCulled = false;
  return s;
}

export function solVisibleActivo(): boolean {
  if (typeof location === "undefined") return false;
  return new URLSearchParams(location.search).get("sol") === "1";
}

/** Adds the Sun to `escena`; it follows the camera so it always sits on the sky, never in the world. */
export function crearSolVisible(escena: THREE.Scene, cielo: Cielo, opciones: OpcionesSol = { brillo: 1, tamano: 1 }): THREE.Group {
  // The glow below replaces the dome halo: repaint the dome once without it.
  OPCIONES_DOMO.halo = false;
  pintarDomo(cielo.domo.geometry, 0, direccionSolActual());

  const grupo = new THREE.Group();
  grupo.name = "Sky_Sun";
  const brillo = sprite(texturaRadial([[0, "rgba(255,255,255,0.7)"], [0.3, "rgba(255,255,255,0.25)"], [1, "rgba(255,255,255,0)"]]), GRADOS_BRILLO, "Sky_Sun_Glow");
  const disco = sprite(texturaRadial([[0, "rgba(255,255,255,1)"], [0.7, "rgba(255,252,246,1)"], [1, "rgba(255,248,236,0)"]]), GRADOS_DISCO * opciones.tamano, "Sky_Sun_Disc");
  grupo.add(brillo, disco);

  const haloDia = new THREE.Color(PALETA_CIELO.dia.halo);
  const haloAtardecer = new THREE.Color(PALETA_CIELO.atardecer.halo);
  const materialBrillo = brillo.material as THREE.SpriteMaterial;
  const dir = new THREE.Vector3();
  const ojo = new THREE.Vector3();
  // onBeforeRender runs with the active camera: keep the group on the sky sphere around it.
  disco.onBeforeRender = (_r, _s, camara) => {
    direccionSolActual(dir);
    // World position: in first person the camera is parented to the kid, so `camara.position` is local.
    grupo.position.copy(camara.getWorldPosition(ojo)).addScaledVector(dir, DISTANCIA);
    const elevacion = THREE.MathUtils.radToDeg(Math.asin(THREE.MathUtils.clamp(dir.y, -1, 1)));
    const k = THREE.MathUtils.clamp((ELEVACION_DIA - elevacion) / (ELEVACION_DIA - ELEVACION_ATARDECER), 0, 1);
    materialBrillo.color.copy(haloDia).lerp(haloAtardecer, k);
    materialBrillo.opacity = opciones.brillo;
    brillo.scale.setScalar(escalaDe(GRADOS_BRILLO * (TAMANO_HALO.dia + (TAMANO_HALO.atardecer - TAMANO_HALO.dia) * k)));
    grupo.updateMatrixWorld(true);
    if (import.meta.env.DEV) {
      // Dev only: screen position of the Sun (NDC), so a capture script can aim the camera at it.
      const p = grupo.position.clone().project(camara);
      (globalThis as { __solNDC?: number[] }).__solNDC = [p.x, p.y, p.z];
    }
  };
  escena.add(grupo);
  return grupo;
}
