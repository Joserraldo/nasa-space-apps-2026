import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { CAMARA_TERCERA, adelanteEquivalente, encuadreTercera, fovParaAspecto, poseTercera, solidosBase } from "./escena3d";
import { INICIO_JUGADOR } from "./mundo";
import { FICHAS } from "./personajes";

const personajeAltura = FICHAS.nino.altura;

/**
 * Encuadre de la tercera persona que sigue al niño: entero, de espaldas y en el tercio inferior
 * (ESCENAS §3.1). Se proyecta sin WebGL la pose que usa la escena.
 */
const TAMANOS: readonly [string, number, number][] = [
  ["1440x900", 1440, 900],
  ["1024x683", 1024, 683],
  ["844x390", 844, 390],
  ["390x844", 390, 844],
  // Lienzos medidos en el juego (la pantalla deja un panel al costado o debajo).
  ["juego 1024x683 (579x638)", 579, 638],
  ["juego 390x844 (358x228)", 358, 228],
];

function proyectar(ancho: number, alto: number, x: number, z: number, yaw: number) {
  const camara = new THREE.PerspectiveCamera(fovParaAspecto("tercera", ancho / alto), ancho / alto, 0.1, 600);
  const e = encuadreTercera(ancho / alto);
  const pos = new THREE.Vector3();
  const mira = new THREE.Vector3();
  poseTercera(x, 0, z, yaw, e.inclinacion, e.distancia, e.adelante, e.hombro, pos, mira);
  camara.position.copy(pos);
  camara.lookAt(mira);
  camara.updateMatrixWorld();
  const pies = new THREE.Vector3(x, 0, z).project(camara);
  const cabeza = new THREE.Vector3(x, personajeAltura, z).project(camara);
  const horizonte = new THREE.Vector3(x - Math.sin(yaw) * 400, 0, z - Math.cos(yaw) * 400).project(camara);
  return { pies, cabeza, horizonte, pos };
}

describe("cámara de tercera persona que sigue al niño", () => {
  for (const [nombre, ancho, alto] of TAMANOS) {
    it(`${nombre}: el niño entero en la parte baja del cuadro, con el horizonte arriba`, () => {
      for (const yaw of [0, 1.2, -2.5]) {
        const { pies, cabeza, horizonte, pos } = proyectar(ancho, alto, INICIO_JUGADOR.x, INICIO_JUGADOR.z, yaw);
        // NDC: −1 abajo, +1 arriba. Pies dentro del cuadro y en el tercio inferior; cabeza debajo del centro.
        expect(pies.y).toBeGreaterThan(-0.97);
        expect(pies.y).toBeLessThan(-1 / 3);
        expect(cabeza.y).toBeLessThan(0);
        expect(cabeza.y).toBeGreaterThan(pies.y);
        expect(Math.abs(pies.x)).toBeLessThan(0.9);
        // El horizonte queda en la mitad de arriba: se ve la base por delante.
        expect(horizonte.y).toBeGreaterThan(0.05);
        // Detrás del niño: la cámara está del lado contrario a donde mira.
        const atras = (pos.x - INICIO_JUGADOR.x) * -Math.sin(yaw) + (pos.z - INICIO_JUGADOR.z) * -Math.cos(yaw);
        expect(atras).toBeLessThan(0);
      }
    });
  }

  it("el encuadre se interpola entre apaisado y vertical y no sale de esos extremos", () => {
    const a = encuadreTercera(2.5), v = encuadreTercera(0.2), m = encuadreTercera(1);
    expect(a).toEqual(CAMARA_TERCERA.apaisado);
    expect(v).toEqual(CAMARA_TERCERA.vertical);
    expect(m.adelante).toBeGreaterThan(a.adelante);
    expect(m.adelante).toBeLessThan(v.adelante);
  });

  it("al subir la cámara por un obstáculo, la mirada se acerca y el niño sigue dentro", () => {
    const e = encuadreTercera(1.5);
    const sube = e.inclinacion + 0.42;
    const adelante = adelanteEquivalente(e, e.inclinacion, e.distancia, sube, e.distancia);
    expect(adelante).toBeLessThan(e.adelante);
    expect(adelanteEquivalente(e, e.inclinacion, e.distancia, e.inclinacion, e.distancia)).toBe(e.adelante);
    const camara = new THREE.PerspectiveCamera(fovParaAspecto("tercera", 1.5), 1.5, 0.1, 600);
    const pos = new THREE.Vector3(), mira = new THREE.Vector3();
    poseTercera(0, 0, 0, 0, sube, e.distancia, adelante, e.hombro, pos, mira);
    camara.position.copy(pos);
    camara.lookAt(mira);
    camara.updateMatrixWorld();
    expect(new THREE.Vector3(0, 0, 0).project(camara).y).toBeGreaterThan(-0.97);
  });

  it("sólidos: cajas exactas para el hábitat, las consolas y los módulos construidos", () => {
    const s = solidosBase({ panel_solar: "funcionando", antena: "ausente" }, null);
    expect(s.cajas.length).toBeGreaterThanOrEqual(6);
    expect(s.circulos.some((c) => Math.abs(c.r - 0.4) < 1e-9)).toBe(true); // la Ingeniera
  });
});
