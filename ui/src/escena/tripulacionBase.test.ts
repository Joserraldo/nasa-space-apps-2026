import { describe, expect, it, vi } from "vitest";
import { partidaDorada } from "@solar-shield/engine";
import { crearMateriales } from "./materiales";
import { armarEscena } from "./armado";
import { ANCLAJES_EXPERTAS, DOCK_IRIS, INICIO_JUGADOR } from "./mundo";
import { vistaEscena } from "./vista";

describe("tripulación montada en el escenario vigente", () => {
  it("monta al niño, la Ingeniera e Iris una sola vez y conserva sus anclajes al actualizar", () => {
    const a = armarEscena(crearMateriales(), null);
    const t = a.tripulacion;
    expect(t).toBeDefined();
    expect(t.grupo.parent).toBe(a.escena);
    expect(t.jugador.grupo.position.x).toBe(INICIO_JUGADOR.x);
    expect(t.jugador.grupo.position.z).toBe(INICIO_JUGADOR.z);
    expect(t.ingeniera.grupo.position.x).toBe(ANCLAJES_EXPERTAS.ingeniera.x);
    expect(t.iris.grupo.position.z).toBe(DOCK_IRIS.z);
    const v = vistaEscena(partidaDorada(), { fase: "base", colocados: [] });
    const antes = JSON.stringify(v);
    a.aplicarVista(v);
    a.animar(1000, true);
    a.aplicarVista(v);
    expect(a.tripulacion).toBe(t);
    expect(JSON.stringify(v)).toBe(antes);
    a.liberar();
  });

  it("refleja offline/avería de Iris, respeta movimiento reducido y libera los esqueletos una vez", () => {
    const a = armarEscena(crearMateriales(), null);
    const t = a.tripulacion;
    const v = vistaEscena(partidaDorada(), { fase: "base", colocados: [] });
    a.aplicarVista({ ...v, iris: { nivel: "offline", averiada: false } });
    a.animar(1000, true);
    expect(t.iris.grupo.getObjectByName("iris-cara-apagada")!.visible).toBe(true);
    a.aplicarVista({ ...v, iris: { nivel: "danada", averiada: true } });
    a.animar(1000, true);
    expect(t.iris.grupo.getObjectByName("iris-cara-error")!.visible).toBe(true);
    const reposo = t.ingeniera.huesos.torso.rotation.x;
    a.animar(8000, true);
    expect(t.ingeniera.huesos.torso.rotation.x).toBe(reposo);
    const recursos = t.grupo.children.flatMap(p => {
      const salida: { dispose(): void }[] = [];
      p.traverse(o => { if ("skeleton" in o) salida.push(o.skeleton as { dispose(): void }); });
      return salida;
    });
    const liberar = recursos.map(r => vi.spyOn(r, "dispose"));
    a.liberar();
    a.liberar();
    expect(t.grupo.parent).toBeNull();
    for (const espia of liberar) expect(espia).toHaveBeenCalledTimes(1);
  });

  it("el niño cambia a caminar, la Ingeniera se vuelve hacia él al acercarse e Iris pone la cara de su modo", () => {
    const a = armarEscena(crearMateriales(), null);
    const t = a.tripulacion;
    const v = vistaEscena(partidaDorada(), { fase: "base", colocados: [] });
    a.aplicarVista(v);
    a.animar(1000, false);
    const muslo = t.jugador.huesos.musloI.rotation.x;
    t.actores.caminando = true;
    a.animar(1250, false);
    expect(t.jugador.huesos.musloI.rotation.x).not.toBe(muslo);

    // Lejos: la Ingeniera conserva su rumbo; cerca: gira hacia el niño.
    const inicial = t.ingeniera.grupo.rotation.y;
    const q = t.ingeniera.grupo.position;
    t.jugador.grupo.position.set(q.x + 1.5, 0, q.z);
    for (let ms = 1300; ms < 3000; ms += 16) a.animar(ms, false);
    expect(t.ingeniera.grupo.rotation.y).not.toBeCloseTo(inicial, 2);
    expect(Math.cos(t.ingeniera.grupo.rotation.y - Math.PI / 2)).toBeGreaterThan(0.99);

    t.actores.modoIris = "llego";
    a.animar(3100, true);
    expect(t.iris.grupo.getObjectByName("iris-cara-feliz")!.visible).toBe(true);
    a.aplicarVista({ ...v, iris: { nivel: "offline", averiada: false } });
    a.animar(3200, true);
    expect(t.iris.grupo.getObjectByName("iris-cara-apagada")!.visible).toBe(true);
    a.liberar();
  });
});
