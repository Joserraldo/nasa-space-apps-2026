import { describe, expect, it } from "vitest";
import { partidaDorada } from "@solar-shield/engine";
import { vistaEscena } from "./vista";

describe("vistaEscena", () => {
  it("al empezar solo existe la IA de la base", () => {
    const v = vistaEscena(partidaDorada(), { fase: "modulos", colocados: [] });
    expect(v.modulos.ia_base).toBe("funcionando");
    expect(v.modulos.panel_solar).toBe("ausente");
    expect(Object.keys(v.modulos)).toHaveLength(7);
    expect(v.lugarObjetivo).toBeNull();
  });

  it("distingue instalando, funcionando y averiado", () => {
    const estado = partidaDorada();
    const roto = { ...estado, equipos: { ...estado.equipos, antena: "averiado" as const } };
    const v = vistaEscena(roto, { fase: "base", colocados: ["panel_solar", "antena"], instalando: "escudo" });
    expect(v.modulos.panel_solar).toBe("funcionando");
    expect(v.modulos.antena).toBe("averiado");
    expect(v.modulos.escudo).toBe("instalando");
  });

  it("no adelanta la avería guionada de Iris hasta que se revela", () => {
    const estado = partidaDorada();
    expect(estado.equipos.ia_base).toBe("averiado");
    expect(vistaEscena(estado, { fase: "base", colocados: [] }).iris.averiada).toBe(false);
  });

  it("refleja la tormenta y a Iris sin leer nada más", () => {
    const estado = partidaDorada();
    const v = vistaEscena({ ...estado, tick: 99 }, { fase: "tormenta", colocados: [], lugarObjetivo: "sensor", averiaRevelada: true });
    expect(v.tormenta.anunciada).toBe(estado.tormenta !== null);
    expect(v.tormenta.activa).toBe(estado.tormenta !== null);
    expect(v.iris.averiada).toBe(true);
    expect(v.lugarObjetivo).toBe("sensor");
  });

  it("es pura: no muta el estado", () => {
    const estado = partidaDorada();
    const copia = structuredClone(estado);
    vistaEscena(estado, { fase: "base", colocados: ["bateria"] });
    expect(estado).toEqual(copia);
  });
});
