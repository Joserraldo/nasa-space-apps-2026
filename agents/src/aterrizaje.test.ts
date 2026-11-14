import { describe, expect, it } from "vitest";
import en from "../i18n/en.json";
import es from "../i18n/es.json";
import { consejosAterrizaje, type SitioCandidato } from "./index.js";

// Formas como las de data/terreno/jezero (puntajes 0-1); valores de prueba.
const sitios: SitioCandidato[] = [
  { id: "llanura-central", nombreKey: "datos.terreno.sitio.llanura-central.nombre", puntajes: { plano: 0.9, luz: 0.8, blindaje: 0.2 } },
  { id: "pie-de-la-pared-sur", nombreKey: "datos.terreno.sitio.pie-de-la-pared-sur.nombre", puntajes: { plano: 0.5, luz: 0.4, blindaje: 0.9 } },
  { id: "sobre-el-borde-oeste", nombreKey: "datos.terreno.sitio.sobre-el-borde-oeste.nombre", puntajes: { plano: 0.2, luz: 0.95, blindaje: 0.1 } },
];

describe("consejos de aterrizaje", () => {
  const d = consejosAterrizaje(sitios);
  it("cada voz recomienda el mejor sitio en su criterio", () => {
    expect(d.map((x) => [x.experto, x.lineas[0]?.vars?.sitioKey])).toEqual([
      ["ingeniera", "datos.terreno.sitio.sobre-el-borde-oeste.nombre"],
      ["doctora", "datos.terreno.sitio.pie-de-la-pared-sur.nombre"],
      ["ia_base", "datos.terreno.sitio.llanura-central.nombre"],
      ["ia_base", undefined],
    ]);
  });
  it("si discrepan, Iris dice que ningún sitio es perfecto", () => {
    expect(d[3]?.lineas[0]?.clave).toBe("agentes.aterrizaje.cierre.discrepan");
  });
  it("si un sitio gana en todo, coinciden", () => {
    const uno = consejosAterrizaje([sitios[0]!]);
    expect(uno[3]?.lineas[0]?.clave).toBe("agentes.aterrizaje.cierre.coinciden");
  });
  it("sin sitios no hay consejos; claves en en y es", () => {
    expect(consejosAterrizaje([])).toEqual([]);
    for (const x of d) for (const l of x.lineas) {
      expect(en[l.clave as keyof typeof en], l.clave).toBeDefined();
      expect(es[l.clave as keyof typeof es], l.clave).toBeDefined();
    }
  });
});
