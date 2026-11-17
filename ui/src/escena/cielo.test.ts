import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { LUZ, PALETA_CIELO, colorCielo, coloresCielo, hexALineal, hexARgb } from "./cielo";
import { GRADACION, instalarAtmosfera } from "./atmosfera";
import { LATITUD_JEZERO, POLO_MARTE, desdeArDec, fusionar, matrizCielo } from "./estrellas";
import { cambioCielo } from "./sistemas/entornoCielo";
import { BLOOM, umbralBloom } from "./postproceso";

const dirDia = { x: LUZ.direccionSol[0], y: LUZ.direccionSol[1], z: LUZ.direccionSol[2] };

describe("cielo de Marte", () => {
  it("día caramelo, atardecer y noche; sin variante por tormenta solar", () => {
    expect(Object.keys(PALETA_CIELO)).toEqual(["dia", "atardecer", "noche"]);
    for (const hex of [PALETA_CIELO.dia.cenit, PALETA_CIELO.dia.horizonte, PALETA_CIELO.dia.niebla]) {
      const [r, g, b] = hexARgb(hex);
      expect(r).toBeGreaterThan(g);
      expect(g).toBeGreaterThan(b); // caramelo/ocre: nunca azul ni gris lechoso
    }
    // El horizonte de día es más claro que el cénit (polvo de canto).
    expect(hexARgb(PALETA_CIELO.dia.horizonte)[0]).toBeGreaterThan(hexARgb(PALETA_CIELO.dia.cenit)[0]);
    expect(colorCielo(0)).toEqual(hexALineal(PALETA_CIELO.dia.horizonte));
    expect(colorCielo(1)).toEqual(hexALineal(PALETA_CIELO.dia.cenit));
  });

  it("el halo azul es solo del atardecer; de noche no hay halo ni bruma", () => {
    const dia = coloresCielo({ mezcla: 0, noche: 0, dirSol: dirDia });
    const tarde = coloresCielo({ mezcla: 1, noche: 0, dirSol: dirDia });
    const noche = coloresCielo({ mezcla: 1, noche: 1, dirSol: { x: -0.7, y: -0.3, z: 0.1 } });
    expect(dia.halo[2]).toBeLessThan(dia.halo[0]);
    expect(tarde.halo[2]).toBeGreaterThan(tarde.halo[0]);
    expect(tarde.radioHalo).toBeGreaterThan(dia.radioHalo);
    expect(noche.brilloHalo).toBe(0);
    expect(noche.brilloDisco).toBe(0);
    expect(noche.densidadNiebla).toBeLessThan(dia.densidadNiebla / 3);
  });

  it("respeta el límite de sombras; la gradación parte de AgX", () => {
    expect(LUZ.tamanoSombra.alta).toBeLessThanOrEqual(2048);
    expect(LUZ.tamanoSombra.baja).toBeLessThanOrEqual(1024);
    expect(LUZ.toneMapping).toBe("AgX");
    instalarAtmosfera();
    const chunk = (THREE.ShaderChunk as unknown as Record<string, string>).tonemapping_pars_fragment!;
    expect(chunk).toContain("vec3 c = AgXToneMapping( color );");
    expect(GRADACION.saturacion).toBeGreaterThanOrEqual(0.9);
    expect(GRADACION.saturacion).toBeLessThanOrEqual(1.1); // saturación moderada
  });
});

describe("estrellas de Jezero", () => {
  it("el polo norte de Marte queda al norte (-z), a la altura de la latitud de Jezero", () => {
    const p = desdeArDec(POLO_MARTE.ar, POLO_MARTE.dec).applyMatrix3(matrizCielo());
    expect(p.y).toBeCloseTo(Math.sin(THREE.MathUtils.degToRad(LATITUD_JEZERO)), 6);
    expect(p.z).toBeLessThan(0);
    expect(Math.abs(p.x)).toBeLessThan(1e-6);
  });

  it("une los picos repetidos de una misma estrella y se queda con el más brillante", () => {
    const a = [1, 0, 0, 0.9, 1, 1, 1];
    const b = [Math.cos(0.002), Math.sin(0.002), 0, 1, 1, 1, 1]; // a 0,11° de `a`
    const c = [0, 1, 0, 0.5, 1, 1, 1];
    expect(fusionar([a, b, c])).toEqual([b, c]);
  });
});

describe("entorno y bloom", () => {
  it("el entorno se regenera solo cuando el cielo cambió lo suficiente", () => {
    const e = { mezcla: 0, noche: 0, dirSol: dirDia };
    expect(cambioCielo(null, e)).toBe(true);
    expect(cambioCielo(e, { ...e, mezcla: 0.01 })).toBe(false);
    expect(cambioCielo(e, { ...e, mezcla: 0.2 })).toBe(true);
  });

  it("el umbral del bloom es alto de día y baja de noche", () => {
    expect(umbralBloom(0)).toBe(BLOOM.umbralDia);
    expect(umbralBloom(1)).toBe(BLOOM.umbralNoche);
    expect(BLOOM.umbralDia).toBeGreaterThan(1);
  });
});
