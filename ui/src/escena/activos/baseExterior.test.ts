import * as THREE from "three";
import { afterEach, describe, expect, it } from "vitest";
import { crearMateriales } from "../materiales";
import { liberarCache } from "../liberar";
import { crearHabitat, crearTorreControl } from "./edificios";
import { CONSOLAS, DECORADO, decorado } from "./baseExterior";
import { MODULOS_BASE } from "./modulos";
import { crearConsola } from "./piezasComunes";
import { armarModulo, giroHacia } from "./modulosArmados";
import { CAMINOS, distanciaTramo, posicionesBalizas, sobreCamino } from "./caminos";
import { ANCLAJES_MODULOS, TERRENO, lugar, type LugarId } from "../mundo";

const caja = (o: THREE.Object3D) => { o.updateMatrixWorld(true); return new THREE.Box3().setFromObject(o); };
function separados(a: THREE.Object3D, b: THREE.Object3D) {
  const comun = caja(a).intersect(caja(b));
  const tam = comun.getSize(new THREE.Vector3());
  expect(Math.min(tam.x, tam.z), `${a.name} invade ${b.name}`).toBeLessThan(0.02);
}
afterEach(() => liberarCache());

describe("espacio libre del exterior", () => {
  it("separa las huellas construidas de invernadero, reciclador y hábitat", () => {
    const m = crearMateriales();
    const inv = armarModulo(m, "invernadero");
    const rec = armarModulo(m, "reciclador_agua");
    const h = lugar("habitat");
    const habitat = crearHabitat(m); habitat.position.set(h.mx, 0, h.mz);
    // Solo sólido: no confundir la placa de reserva o el marco de instalación con el edificio.
    inv.raiz.remove(inv.andamio, inv.vivos); rec.raiz.remove(rec.andamio, rec.vivos);
    separados(inv.raiz, rec.raiz);
    separados(habitat, rec.raiz);
    separados(habitat, inv.raiz);
  });

  it("no encaja la torre dentro del hábitat y mantiene libre la plataforma solar", () => {
    const m = crearMateriales();
    const torre = crearTorreControl(m);
    torre.position.set(decorado("torre").x, 0, decorado("torre").z);
    const h = lugar("habitat");
    const habitat = crearHabitat(m); habitat.position.set(h.mx, 0, h.mz);
    separados(torre, habitat);
    const solar = armarModulo(m, "panel_solar");
    const escudo = armarModulo(m, "escudo");
    solar.raiz.remove(solar.andamio, solar.vivos); escudo.raiz.remove(escudo.andamio, escudo.vivos);
    separados(solar.raiz, escudo.raiz);
  });

  it("ningún par de módulos construidos comparte volumen de su huella", () => {
    const m = crearMateriales();
    const solidos = MODULOS_BASE.map(id => {
      const modulo = armarModulo(m, id);
      modulo.raiz.remove(modulo.andamio, modulo.vivos);
      return modulo.raiz;
    });
    for (let i = 0; i < solidos.length; i++)
      for (let j = i + 1; j < solidos.length; j++) separados(solidos[i]!, solidos[j]!);
  });

  it("las consolas no invaden los módulos", () => {
    const m = crearMateriales();
    const modulos = MODULOS_BASE.map(id => {
      const modulo = armarModulo(m, id);
      modulo.raiz.remove(modulo.andamio, modulo.vivos);
      return modulo.raiz;
    });
    for (const c of CONSOLAS) {
      const l = lugar(c.lugar);
      const consola = crearConsola(m);
      consola.position.set(l.mx, 0, l.mz);
      consola.rotation.y = giroHacia(l, l);
      consola.scale.setScalar(c.escala);
      for (const modulo of modulos) separados(consola, modulo);
    }
  });

  it("las balizas no invaden ninguna rama del pavimento", () => {
    for (const [x, z] of posicionesBalizas()) expect(sobreCamino(x, z, 0.25)).toBe(false);
  });
});

describe("base compacta sobre LUGARES (exterior/03, mapa-base-jezero.svg)", () => {
  it("cada módulo se arma en el anclaje de su lugar", () => {
    const m = crearMateriales();
    for (const id of MODULOS_BASE) {
      const a = ANCLAJES_MODULOS[id];
      const mod = armarModulo(m, id);
      expect([mod.raiz.position.x, mod.raiz.position.z], id).toEqual([a.x, a.z]);
      const c = caja(mod.raiz).getCenter(new THREE.Vector3());
      expect(Math.hypot(c.x - a.x, c.z - a.z), `${id} descentrado`).toBeLessThan(1.2);
    }
  });

  it("el decorado queda fuera del círculo caminable y sin solaparse", () => {
    for (const d of DECORADO) expect(Math.hypot(d.x, d.z) - d.radio, d.id).toBeGreaterThan(TERRENO.limite);
    for (let i = 0; i < DECORADO.length; i++)
      for (let j = i + 1; j < DECORADO.length; j++) {
        const a = DECORADO[i]!, b = DECORADO[j]!;
        expect(Math.hypot(a.x - b.x, a.z - b.z), `${a.id}/${b.id}`).toBeGreaterThan(a.radio + b.radio);
      }
  });

  it("los sectores siguen el plano: torre detrás y a la izquierda del hábitat, nave arriba-izquierda, energía a la izquierda, refugio abajo-izquierda, invernadero y segunda cúpula arriba-derecha", () => {
    const h = lugar("habitat"), sol = lugar("panel_solar"), inv = ANCLAJES_MODULOS.invernadero;
    const t = decorado("torre"), nave = decorado("plataforma_nave"), e = decorado("energia"), r = decorado("refugio");
    expect(t.x).toBeLessThan(h.mx);
    expect(t.z).toBeLessThan(h.mz);
    // La cápsula queda al otro lado de la torre, hacia el hábitat; la parabólica, detrás del panel solar.
    expect(decorado("capsula").x).toBeGreaterThan(t.x);
    const p = decorado("parabolica");
    expect(p.x < sol.mx && p.z < sol.mz).toBe(true);
    const c = decorado("cupula");
    expect(c.x > 0 && c.z < inv.z).toBe(true);
    expect(nave.x < 0 && nave.z < 0).toBe(true);
    expect(e.x).toBeLessThan(sol.mx);
    expect(r.x < 0 && r.z > 0).toBe(true);
    expect(inv.x > 0 && inv.z < 0).toBe(true);
  });

  it("los anillos unen los lugares en el orden del plano", () => {
    const en = (id: LugarId) => (p: readonly [number, number]) => Math.hypot(p[0] - lugar(id).x, p[1] - lugar(id).z) < 1e-9;
    const pares: [LugarId, LugarId][] = [
      ["taller", "panel_solar"], ["taller", "escudo"], ["escudo", "habitat"],
      ["sensor", "reciclador_agua"], ["reciclador_agua", "invernadero"], ["invernadero", "antena"], ["taller", "banco"],
    ];
    for (const [a, b] of pares) expect(CAMINOS.some((t) => t.some(en(a)) && t.some(en(b))), `${a} → ${b}`).toBe(true);
  });

  it("ningún eje de camino atraviesa un sólido de TERRENO", () => {
    for (const tramo of CAMINOS)
      for (let i = 1; i < tramo.length; i++)
        for (const c of TERRENO.circulos)
          expect(distanciaTramo(c.x, c.z, tramo[i - 1]!, tramo[i]!), `tramo ${tramo[i - 1]} → ${tramo[i]}`).toBeGreaterThan(c.r + 0.2);
  });
});
