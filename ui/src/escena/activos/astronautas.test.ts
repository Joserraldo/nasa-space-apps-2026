import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { crearMateriales } from "../materiales";
import { liberarCache, liberarEscena, liberarMateriales } from "../liberar";
import { crearAstronauta, dibujarRostro, posturaDe, rostroDe, type ContextoRostro, type GestoAstronauta, type LienzoRostro } from "./astronautas";
import { triangulos } from "./rigido";

const GESTOS: readonly GestoAstronauta[] = ["idle", "walk", "wave", "inspect", "kneel", "talk"];

function contexto(alBorrar: () => void = () => {}, colores = new Set<string>()): ContextoRostro {
  return new Proxy({} as Record<string, unknown>, {
    get: (o, k) => (k in o ? o[k as string] : k === "clearRect" ? alBorrar : () => {}),
    set: (o, k, v) => ((o[k as string] = v), (k === "fillStyle" || k === "strokeStyle") && colores.add(String(v)), true),
  }) as unknown as ContextoRostro;
}

function limpiar(m: ReturnType<typeof crearMateriales>) {
  liberarMateriales(Object.values(m));
  liberarCache();
}

describe("niño astronauta", () => {
  it("es liviano: 3 draw calls (cuerpo, rostro, casco) y menos de 1000 triángulos", () => {
    const m = crearMateriales();
    const nino = crearAstronauta(m, { lienzo: () => ({ width: 0, height: 0, getContext: () => contexto() }) });
    let mallas = 0;
    nino.raiz.traverse((o) => { if (o instanceof THREE.Mesh) mallas++; });
    expect(mallas).toBe(3);
    expect(triangulos(nino.raiz)).toBeLessThan(1000);
    expect(nino.raiz.getObjectByName("Casco")).toBeDefined();
    expect((nino.raiz.getObjectByName("Casco") as THREE.Mesh).material).toBe(m.Glass);
    nino.liberar();
    limpiar(m);
  });

  it("pivotes Root > Rig > Cadera > Torso > Cabeza, con hombros, muslos y rodillas", () => {
    const m = crearMateriales();
    const nino = crearAstronauta(m, { lienzo: () => null });
    const { cadera, torso, cabeza, hombros, rodillas } = nino.pivotes;
    expect(nino.raiz.getObjectByName("Rig")?.getObjectByName("Cadera")).toBe(cadera);
    expect(torso.parent).toBe(cadera);
    expect(cabeza.parent).toBe(torso);
    expect(hombros.every((h) => h.parent === torso)).toBe(true);
    expect(rodillas.every((r) => r.parent?.parent === cadera)).toBe(true);
    nino.liberar();
    limpiar(m);
  });

  it("cada gesto de personajes/08 tiene una postura distinta", () => {
    const firmas = GESTOS.map((g) => JSON.stringify(posturaDe(g, 0.4, 1)));
    expect(new Set(firmas).size).toBe(GESTOS.length);
    expect(posturaDe("wave", 0, 0).hombroIz).toBeGreaterThan(2);
    expect(posturaDe("kneel", 0, 0).caderaY).toBeLessThan(-0.1);
    expect(posturaDe("inspect", 0, 0).tableta).toBe(1);
  });

  it("camina solo al moverse y la tableta aparece solo al inspeccionar", () => {
    const m = crearMateriales();
    const nino = crearAstronauta(m, { lienzo: () => null });
    nino.animar(0.1, { velocidad: 1.2, movimientoReducido: false });
    expect(nino.gesto()).toBe("walk");
    nino.animar(0.1, { velocidad: 0, movimientoReducido: true });
    expect(nino.gesto()).toBe("idle");
    expect(nino.pivotes.tableta.scale.x).toBeLessThan(0.01);
    nino.fijarGesto("inspect");
    nino.animar(0.1, { velocidad: 0, movimientoReducido: true });
    expect(nino.pivotes.tableta.scale.x).toBe(1);
    nino.liberar();
    limpiar(m);
  });

  it("con movimiento reducido la postura queda fija, sin parpadeo ni boca animada", () => {
    const m = crearMateriales();
    const nino = crearAstronauta(m, { lienzo: () => null });
    nino.fijarGesto("talk");
    nino.animar(0.3, { velocidad: 0, movimientoReducido: true });
    const foto = () => [nino.pivotes.cabeza.rotation.z, nino.pivotes.hombros[1].rotation.z, nino.pivotes.cadera.position.y];
    const antes = foto();
    for (let i = 0; i < 40; i++) nino.animar(0.1, { velocidad: 0, movimientoReducido: true });
    expect(foto()).toEqual(antes);
    expect(nino.rostro()).toEqual({ expresion: "neutral", boca: "sonrisa", parpadeo: false });
    nino.liberar();
    limpiar(m);
  });

  it("rostros de personajes/09: expresiones, habla cerrada/abierta/redonda y parpadeo", () => {
    expect(rostroDe("idle", "happy", 1, false).boca).toBe("feliz");
    expect(rostroDe("idle", "curious", 1, false).boca).toBe("o");
    expect(rostroDe("idle", "concerned", 1, false).boca).toBe("preocupada");
    const bocas = new Set(Array.from({ length: 12 }, (_, i) => rostroDe("talk", "neutral", i * 0.16 + 0.01, false).boca));
    expect(bocas).toEqual(new Set(["sonrisa", "abierta", "redonda"]));
    expect(rostroDe("idle", "neutral", 3.75, false).parpadeo).toBe(true);
    const colores = new Set<string>();
    dibujarRostro(contexto(() => {}, colores), rostroDe("idle", "happy", 1, false));
    expect([...colores].sort()).toEqual(["#1C1248", "#53306D", "#6E4250"]); // espacio, ciruela, cabello-nino
  });

  it("el rostro se redibuja solo si cambia y liberar suelta lo propio sin tocar lo compartido", () => {
    let dibujos = 0;
    const ctx = contexto(() => dibujos++);
    const lienzo: LienzoRostro = { width: 0, height: 0, getContext: () => ctx };
    const m = crearMateriales();
    const nino = crearAstronauta(m, { lienzo: () => lienzo });
    expect(dibujos).toBe(1);
    for (let i = 0; i < 10; i++) nino.animar(0.016, { velocidad: 0, movimientoReducido: true });
    expect(dibujos).toBe(1);
    nino.fijarExpresion("concerned");
    expect(dibujos).toBe(2);
    const r = liberarEscena(nino.raiz);
    expect(r.materiales).toBe(2); // facetado y rostro; el vidrio es el slot compartido
    nino.liberar();
    limpiar(m);
  });
});
