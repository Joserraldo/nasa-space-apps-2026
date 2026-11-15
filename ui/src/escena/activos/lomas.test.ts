import { describe, expect, it } from "vitest";
import { crearMateriales } from "../materiales";
import { liberarEscena, liberarMateriales } from "../liberar";
import { DECORADO, armarEdificios } from "./baseExterior";
import { GRAVILLA, crearLomas } from "./terreno";

describe("vista de juego: lomas, cúpulas dobles y fila de paneles", () => {
  it("crearLomas hace una sola malla con caras y colores de vértice", () => {
    const m = crearMateriales();
    const malla = crearLomas(m, [{ x: 0, z: 0, radio: 4, alto: 1, semilla: 1 }, { x: 20, z: 0, radio: 6, alto: 3, semilla: 2 }]);
    expect(malla.geometry.getAttribute("position").count).toBeGreaterThan(300);
    expect(malla.geometry.getAttribute("color")).toBeDefined();
    liberarEscena(malla);
    liberarMateriales(Object.values(m));
  });

  it("el decorado incluye las dos cúpulas, la fila de paneles, la antena y la base de montaña", () => {
    const ids = DECORADO.map((d) => d.id);
    for (const id of ["cupula", "cupula2", "energia", "parabolica", "base_montana"]) expect(ids).toContain(id);
  });

  it("la base lleva las lomas y la gravilla es abundante", () => {
    const m = crearMateriales();
    const g = armarEdificios(m);
    expect(g.getObjectByName("Mounds")).toBeDefined();
    expect(GRAVILLA.n).toBeGreaterThanOrEqual(1000);
    liberarEscena(g);
    liberarMateriales(Object.values(m));
  });
});
