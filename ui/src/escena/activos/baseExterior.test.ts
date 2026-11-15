import * as THREE from "three";
import { afterEach, describe, expect, it } from "vitest";
import { crearMateriales } from "../materiales";
import { liberarCache } from "../liberar";
import { crearHabitat, crearTorreControl } from "./edificios";
import { CONSOLAS, EDIFICIOS } from "./baseExterior";
import { MODULOS_BASE } from "./modulos";
import { crearConsola } from "./piezasComunes";
import { armarModulo, giroHacia } from "./modulosArmados";
import { posicionesBalizas, sobreCamino } from "./caminos";
import { lugar } from "../mundo";

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
    torre.position.set(EDIFICIOS.torre.x, 0, EDIFICIOS.torre.z);
    torre.scale.setScalar(EDIFICIOS.escalaTorre);
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
