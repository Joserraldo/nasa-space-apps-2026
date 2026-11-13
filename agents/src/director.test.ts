import { describe, expect, it } from "vitest";
import { partidaDorada, paso, tormentaActiva } from "@solar-shield/engine";
import { dialogosDelPaso, encolar, vistaVisible, type Dialogo } from "./index.js";

describe("director con la partida dorada real del motor", () => {
  it("antes del paso 5 nadie ve la tormenta", () => {
    const s = partidaDorada();
    expect(tormentaActiva(s)).toBe(false);
    expect(vistaVisible(s, tormentaActiva(s)).tormenta).toBeNull();
    expect(dialogosDelPaso(s, { tormentaAntes: false, tormentaAhora: false })).toEqual([]);
  });

  it("cuando se revela: escena de los dos expertos y luego Iris con el número falso", () => {
    let s = partidaDorada();
    let antes = tormentaActiva(s);
    let dialogos: Dialogo[] = [];
    for (let i = 0; i < 20 && dialogos.length === 0; i++) {
      s = paso(s);
      const ahora = tormentaActiva(s);
      dialogos = dialogosDelPaso(s, { tormentaAntes: antes, tormentaAhora: ahora });
      antes = ahora;
    }
    expect(dialogos.map((d) => d.experto)).toEqual(["meteorologa", "doctora", "ingeniera", "ia_base", "ia_base"]);
    const iris = dialogos[4] as Dialogo & { falla?: { forma: string; valorReal: number; valorDicho: number } };
    expect(iris.falla?.forma).toBe("numero_falso");
    expect(iris.falla?.valorReal).toBe(Math.round(s.recursos.blindaje));
    expect(Math.abs(iris.falla!.valorDicho - iris.falla!.valorReal)).toBeGreaterThanOrEqual(40);
    expect(dialogos[1]?.fuente?.url).toBeTruthy();
  });

  it("no repite la escena en los pasos siguientes", () => {
    const s = partidaDorada();
    expect(dialogosDelPaso(s, { tormentaAntes: true, tormentaAhora: true })).toEqual([]);
  });
});

describe("cola de diálogos", () => {
  const d = (experto: Dialogo["experto"], prioridad: Dialogo["prioridad"]): Dialogo => ({ experto, prioridad, lineas: [] });
  it("lo normal va al final", () => {
    expect(encolar([d("doctora", "charla")], [d("ingeniera", "consejo")]).map((x) => x.experto)).toEqual(["doctora", "ingeniera"]);
  });
  it("una alerta pasa delante de lo pendiente menos urgente, en su propio orden", () => {
    const cola = [d("doctora", "charla"), d("ingeniera", "consejo")];
    const r = encolar(cola, [d("meteorologa", "alerta"), d("doctora", "consejo")]);
    expect(r.map((x) => `${x.experto}:${x.prioridad}`)).toEqual(["meteorologa:alerta", "doctora:consejo", "doctora:charla", "ingeniera:consejo"]);
  });
});
