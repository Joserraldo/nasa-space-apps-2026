import { describe, expect, it } from "vitest";
import { partidaDorada } from "@solar-shield/engine";
import { GESTOS, type Gesto } from "./personajes/animaciones";
import { TIEMPOS, gestoDe, reaccionDe, type ActorCoreografia, type Situacion } from "./coreografia";
import { vistaEscena, type VistaEscena } from "./vista";

const base: VistaEscena = vistaEscena(partidaDorada(), { fase: "base", colocados: [] });
const sit = (o: Partial<Situacion> = {}): Situacion => ({ t: 0, vista: base, hablando: null, reaccion: null, cerca: -1, caminando: false, ...o });
const ACTORES: ActorCoreografia[] = ["nino", "ingeniera", "doctora", "meteorologa"];
const EXPERTAS: ActorCoreografia[] = ["ingeniera", "doctora", "meteorologa"];
/** Gestos de un actor muestreados cada 0,1 s durante `s` segundos. */
const muestras = (a: ActorCoreografia, o: Partial<Situacion>, s = 20) =>
  Array.from({ length: s * 10 }, (_, i) => gestoDe(a, sit({ ...o, t: i / 10 })));

describe("coreografía de la tripulación (A7)", () => {
  it("la tabla usa los 14 gestos", () => {
    const vistos = new Set<Gesto>();
    const conModulo = (estado: "instalando" | "averiado") => ({ ...base, modulos: { ...base.modulos, panel_solar: estado } });
    const casos: Partial<Situacion>[] = [
      {}, { caminando: true }, { hablando: "ingeniera" }, { hablando: "doctora", cerca: 5 }, { cerca: 0.5 }, { cerca: 3 },
      { reaccion: { tipo: "averia", hace: 0.5 } }, { reaccion: { tipo: "tormenta", hace: 0.5 } },
      { reaccion: { tipo: "beneficio", hace: 0.5 } }, { reaccion: { tipo: "fallo", hace: 0.5 } },
      { vista: conModulo("instalando") }, { vista: conModulo("averiado") },
      { vista: { ...base, tormenta: { anunciada: true, activa: false } } }, { vista: { ...base, tormenta: { anunciada: true, activa: true } } },
    ];
    for (const a of ACTORES) for (const c of casos) for (const g of muestras(a, c)) vistos.add(g);
    expect([...vistos].sort()).toEqual([...GESTOS].sort());
  });

  it("ningún actor queda quieto mientras habla: nunca reposa y cambia de gesto", () => {
    for (const a of EXPERTAS) {
      const g = muestras(a, { hablando: a, cerca: 10 });
      expect(g, a).not.toContain("reposo");
      expect(new Set(g).size, a).toBeGreaterThan(1);
      expect(g.every((x) => x === "hablar" || x === "explicar"), a).toBe(true);
    }
  });

  it("al llegar el niño la experta saluda y después explica; si habla otra, escucha", () => {
    for (const a of EXPERTAS) {
      expect(gestoDe(a, sit({ cerca: 0.2 })), a).toBe("saludar");
      expect(gestoDe(a, sit({ cerca: TIEMPOS.saludo + 0.1 })), a).toBe("explicar");
      const otra = a === "doctora" ? "ingeniera" : "doctora";
      expect(gestoDe(a, sit({ cerca: 3, hablando: otra })), a).toBe("escuchar");
    }
    expect(gestoDe("nino", sit({ hablando: "meteorologa" }))).toBe("escuchar");
  });

  it("cada experta reacciona según su rol, y la reacción se apaga sola", () => {
    const tormenta = { reaccion: { tipo: "tormenta" as const, hace: 0.3 } };
    expect(gestoDe("doctora", sit(tormenta))).toBe("tranquilizar");
    expect(gestoDe("meteorologa", sit(tormenta))).toBe("alertar");
    expect(gestoDe("ingeniera", sit({ reaccion: { tipo: "averia", hace: 0.3 } }))).toBe("alertar");
    expect(gestoDe("nino", sit({ reaccion: { tipo: "beneficio", hace: 0.3 } }))).toBe("confirmar");
    expect(gestoDe("doctora", sit({ reaccion: { tipo: "tormenta", hace: TIEMPOS.reaccion + 0.1 } }))).not.toBe("tranquilizar");
  });

  it("en su estación cada experta hace su trabajo, y los reposos no coinciden entre actores", () => {
    const averiada = { ...base, iris: { nivel: base.iris.nivel, averiada: true } };
    expect(muestras("ingeniera", { vista: averiada })).toContain("reparar");
    expect(muestras("doctora", { vista: { ...base, tormenta: { anunciada: true, activa: true } } })).toContain("tranquilizar");
    expect(muestras("meteorologa", {})).toContain("observar");
    // Mismo instante, distintas variaciones: no se mueven todos a la vez.
    const instantes = Array.from({ length: 70 }, (_, i) => i / 10);
    const juntos = instantes.filter((t) => EXPERTAS.every((a) => gestoDe(a, sit({ t })) !== "reposo")).length;
    expect(juntos).toBeLessThan(instantes.length / 4);
  });

  it("solo los eventos que se ven en el cuerpo provocan reacción (los recursos de cada turno no)", () => {
    expect(reaccionDe({ tipo: "averia" })).toBe("averia");
    expect(reaccionDe({ tipo: "tormenta_llego" })).toBe("tormenta");
    expect(reaccionDe({ tipo: "efecto_llego" })).toBe("beneficio");
    expect(reaccionDe({ tipo: "fin", resultado: "exito" })).toBe("exito");
    expect(reaccionDe({ tipo: "fin", resultado: "fallo" })).toBe("fallo");
    expect(reaccionDe({ tipo: "recurso" })).toBeNull();
  });
});
