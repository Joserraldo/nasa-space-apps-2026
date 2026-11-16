import { afterEach, describe, expect, it } from "vitest";
import * as THREE from "three";
import { LUZ, crearCielo, direccionSolActual, fijarDireccionSol, PALETA_CIELO } from "./cielo";
import {
  DURACION_SOL_H,
  ELEVACION_MINIMA,
  HORAS,
  acercarMomento,
  elevacionSol,
  horaDelMomento,
  luzDelMomento,
  momentoDeFase,
} from "./cicloDia";
import { aplicarMomento } from "./sistemas/cicloDia";

afterEach(() => fijarDireccionSol(...LUZ.direccionSol));

describe("ciclo del día (D3)", () => {
  it("usa la duración del sol de NSSDC", () => {
    expect(DURACION_SOL_H).toBe(24.6597);
  });

  it("va de día a tarde (tormenta) y a atardecer (final); nunca noche", () => {
    expect(momentoDeFase("base")).toBe(0);
    expect(momentoDeFase("modulos")).toBe(0);
    expect(momentoDeFase(null)).toBe(0);
    expect(momentoDeFase("tormenta")).toBe(0.5);
    expect(momentoDeFase("final")).toBe(1);
  });

  it("sin noche jugable: el Sol nunca baja de la elevación mínima a ninguna hora", () => {
    for (let h = 0; h <= DURACION_SOL_H; h += 0.25) expect(elevacionSol(h)).toBeGreaterThanOrEqual(ELEVACION_MINIMA);
    for (let m = 0; m <= 1; m += 0.05) expect(luzDelMomento(m).direccion.y).toBeGreaterThan(Math.sin(ELEVACION_MINIMA) - 1e-9);
  });

  it("el Sol baja a lo largo de la misión y el día queda como estaba (misma dirección que LUZ)", () => {
    const e = [0, 0.5, 1].map((m) => elevacionSol(horaDelMomento(m)));
    expect(e[0]).toBeGreaterThan(e[1]!);
    expect(e[1]).toBeGreaterThan(e[2]!);
    const dia = luzDelMomento(0).direccion;
    expect(dia.angleTo(new THREE.Vector3(...LUZ.direccionSol))).toBeLessThan(THREE.MathUtils.degToRad(1));
    expect(horaDelMomento(1)).toBe(HORAS.atardecer);
  });

  it("de día usa la paleta de día; al atardecer el cielo, la niebla y el halo son los de MARTE.md", () => {
    expect(luzDelMomento(0).mezclaCielo).toBe(0);
    expect(luzDelMomento(0.5).mezclaCielo).toBe(0);
    const a = luzDelMomento(1);
    expect(a.mezclaCielo).toBe(1);
    expect(a.niebla.getHexString()).toBe(new THREE.Color(PALETA_CIELO.atardecer.niebla).getHexString());
    expect(a.intensidadSol).toBeLessThan(luzDelMomento(0).intensidadSol);
  });

  it("cambia de a poco y llega exacto al objetivo", () => {
    expect(acercarMomento(0, 1, 1, 4)).toBeCloseTo(0.25);
    expect(acercarMomento(0.9, 1, 1, 4)).toBe(1);
    expect(acercarMomento(1, 0, 0.5, 1)).toBeCloseTo(0.5);
  });

  it("aplicar el atardecer mueve el Sol, la dirección compartida con la sombra y repinta el cielo", () => {
    const escena = new THREE.Scene();
    const cielo = crearCielo(escena);
    const antes = (cielo.domo.geometry.getAttribute("color").array as Float32Array).slice();
    aplicarMomento({ cielo, escena }, 1);
    const l = luzDelMomento(1);
    expect(direccionSolActual().angleTo(l.direccion)).toBeLessThan(1e-6);
    expect(cielo.sol.position.clone().sub(cielo.sol.target.position).normalize().angleTo(l.direccion)).toBeLessThan(1e-6);
    expect(cielo.sol.intensity).toBeCloseTo(l.intensidadSol);
    const despues = cielo.domo.geometry.getAttribute("color").array as Float32Array;
    expect(despues).not.toEqual(antes);
    cielo.quitar();
  });
});
