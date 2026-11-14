import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DATOS_USADOS_KEYS, ID_RUTA_DORADA, tarjetaTormenta, tormentasCuradas, tormentasMock } from "../src";

const read = (p: string) => JSON.parse(readFileSync(join(__dirname, "..", p), "utf-8"));
const en: Record<string, string> = read("i18n/en.json");
const es: Record<string, string> = read("i18n/es.json");

/** Pinta una línea como lo haría ui: resuelve la clave, rellena {var}, traduce vars que terminan en Key. */
function pintar(dic: Record<string, string>, clave: string, vars: Record<string, string | number> = {}): string {
  const plantilla = dic[clave];
  if (!plantilla) throw new Error(`falta la clave ${clave}`);
  return plantilla.replace(/\{(\w+)\}/g, (_, v: string) => {
    const valor = vars[v];
    if (valor === undefined) throw new Error(`${clave}: falta la variable ${v}`);
    return v.endsWith("Key") ? pintar(dic, String(valor)) : String(valor);
  });
}

describe("tarjeta de fuente (ruta dorada, #41)", () => {
  const dorada = tormentasCuradas.find((t) => t.id === ID_RUTA_DORADA)!;

  it("la tarjeta del 20 may 2024 lleva ID, fecha, medición real y etiqueta de curado", () => {
    const c = tarjetaTormenta(dorada);
    const texto = c.lineas.map((l) => pintar(en, l.clave, l.vars)).join("\n");
    expect(texto).toContain("2024-05-20T05:36:00-CME-001");
    expect(texto).toContain("2024-05-20");
    expect(texto).toContain("19");
    expect(texto).toContain("79.7");
    expect(c.etiquetaKey).toBe("datos.etiqueta.curado");
    expect(c.url).toMatch(/^https:\/\/ccmc\.gsfc\.nasa\.gov\//);
  });

  it("todas las tarjetas (curadas y mock) se pintan completas en en y es, sin variables sueltas", () => {
    for (const t of [...tormentasCuradas, ...tormentasMock]) {
      const c = tarjetaTormenta(t);
      for (const dic of [en, es]) {
        for (const k of [c.tituloKey, c.queOcurrioKey, c.etiquetaKey, c.avisoKey]) expect(dic[k], k).toBeTruthy();
        for (const l of c.lineas) expect(pintar(dic, l.clave, l.vars)).not.toMatch(/\{\w+\}/);
      }
    }
  });

  it("'qué datos usamos' existe en en y es, en orden", () => {
    for (const k of DATOS_USADOS_KEYS) {
      expect(en[k], k).toBeTruthy();
      expect(es[k], k).toBeTruthy();
    }
  });
});
