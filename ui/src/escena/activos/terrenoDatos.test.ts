import { describe, expect, it } from "vitest";
import { leerDem, mallaTerreno, rocasBasalticas, submuestrear } from "./terrenoDatos";

describe("DEM de Jezero", () => {
  it("lee Int16LE y produce una malla y rocas deterministas", () => {
    const buffer = new Int16Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]).buffer;
    const alturas = leerDem(buffer, 4, 4);
    expect([...alturas]).toEqual([...Array(16).keys()]);
    const rejilla = submuestrear(alturas, 4, 4, 3);
    const opciones = { metrosPorPixel: 1, escalaVertical: 1, tamañoMundo: 4 };
    expect(mallaTerreno(rejilla.alturas, rejilla.ancho, rejilla.alto, opciones).triangulos).toBe(2);
    expect(rocasBasalticas(42, 3, rejilla, opciones)).toEqual(rocasBasalticas(42, 3, rejilla, opciones));
  });
});
