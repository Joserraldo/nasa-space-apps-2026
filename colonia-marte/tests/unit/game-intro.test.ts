import { describe, expect, it } from "vitest";
import nw15 from "../../data/layouts/rooms/nw-15.json";
import nw16 from "../../data/layouts/rooms/nw-16.json";
import nw17 from "../../data/layouts/rooms/nw-17.json";
import tomasJson from "../../data/shots/intro.json";
import { bakeRoomAO } from "../../tools/bake-room-ao";
import { ShotTrajectory } from "../../src/camera/trajectory";
import { validateShotTrajectory } from "../../src/camera/validation";
import { buildRoomFromLayout, parseRoomLayout } from "../../src/catalog/layout";
import { existe, traducir } from "../../src/game/i18n";
import { cargarIntro, momento } from "../../src/game/intro";
import { MISION_VIAJE_MARTE } from "../../src/game/motor";
import { createProductionRegistry } from "../../src/kit/pieces";
import type { BufferGeometry, Mesh } from "three";

const intro = cargarIntro();

describe("intro", () => {
  it("siete tomas en las escenas pedidas y la decisión antes del minuto", () => {
    expect(intro.tomas.map((t) => t.escenario)).toEqual(["space", "nw-15", "nw-16", "nw-16", "nw-16", "nw-16", "nw-17"]);
    expect(intro.decisionEn).toBe(44);
    expect(intro.duracion).toBeLessThanOrEqual(90);
  });

  it("la única decisión son las dos opciones de la misión", () => {
    const decisiones = intro.tomas.filter((t) => t.decision);
    expect(decisiones).toHaveLength(1);
    expect(decisiones[0]!.decision!.map((r) => r.id)).toEqual(MISION_VIAJE_MARTE.decisionInicial.opciones.map((o) => o.id));
  });

  it("cada línea existe en los dos idiomas, tiene 12 palabras como máximo y cabe antes de la siguiente", () => {
    const claves = [
      ...intro.tomas.flatMap((t) => [...t.lineas.map((l) => l.linea), ...(t.decision?.map((r) => r.texto) ?? []), ...(t.fuente ? [t.fuente.aviso, t.fuente.clave] : [])]),
      ...Object.values(intro.despues).flat().map((l) => l.linea),
    ];
    for (const idioma of ["en", "es"] as const)
      for (const clave of claves) {
        expect(existe(clave, idioma), `${idioma} ${clave}`).toBe(true);
        if (!clave.startsWith("fuente.")) expect(traducir(idioma, clave).split(/\s+/).length, `${idioma} ${clave}`).toBeLessThanOrEqual(12);
      }
    for (const t of intro.tomas)
      t.lineas.forEach((l, i) => expect((t.lineas[i + 1]?.en ?? t.plano.duration) - l.en, `${t.id} ${l.linea}`).toBeGreaterThanOrEqual(2.5));
  });

  it("el momento sigue el tiempo y se queda en la decisión", () => {
    expect(momento(intro, 0).toma.id).toBe("espacio");
    expect(momento(intro, 0).linea).toBeNull();
    expect(momento(intro, 24).linea?.linea).toBe("intro.nia");
    expect(momento(intro, 43.9).decidiendo).toBe(false);
    expect(momento(intro, 500)).toMatchObject({ decidiendo: true, toma: { id: "decision" } });
  });

  it("rechaza un guion que no coincide con las tomas", () => {
    expect(() => cargarIntro(tomasJson, { tomas: [], despues: {} })).toThrow(/no coinciden/);
  });

  it("ninguna cámara atraviesa las piezas de su sala", () => {
    const registry = createProductionRegistry();
    const salas = { "nw-15": nw15, "nw-16": nw16, "nw-17": nw17 } as const;
    for (const [id, json] of Object.entries(salas)) {
      const sala = buildRoomFromLayout(parseRoomLayout(json, registry), registry);
      const horneada = bakeRoomAO(sala.staticGroup, { samples: 1 });
      const mallas = horneada.group.children as Mesh<BufferGeometry>[];
      for (const toma of intro.tomas.filter((t) => t.escenario === id)) {
        const r = validateShotTrajectory(new ShotTrajectory(toma.plano), mallas, []);
        expect(r.ok ? "libre" : `choca en ${r.point.toArray().map((n) => n.toFixed(2))}`, toma.id).toBe("libre");
      }
    }
  }, 60_000);
});
