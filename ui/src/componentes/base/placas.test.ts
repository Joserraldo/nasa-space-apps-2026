import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const leer = (ruta: string) => readFileSync(new URL(ruta, import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
const orbita = leer("../../pantallas/orbita.css");
const hud = leer("../hud.css");

describe("placas de la órbita (ui/05, '02 HUD')", () => {
  it("la placa es una grilla: icono a la izquierda, nombre y valor apilados a la derecha", () => {
    const placa = orbita.match(/\.orbita-placas \.placa\s*\{([^}]*)\}/)?.[1] ?? "";
    expect(placa).toMatch(/display:\s*grid/);
    expect(placa).toMatch(/grid-template-columns:\s*auto/);
    expect(orbita).toMatch(/\.orbita-placas \.placa-texto\s*\{[^}]*display:\s*grid/);
  });

  it("ocultar el nombre largo en pantallas chicas vale solo para el HUD, no para la órbita", () => {
    for (const m of hud.matchAll(/([^{}]*)\{\s*display:\s*none;?\s*\}/g)) {
      if (/\.placa-nombre(?!-)/.test(m[1]!)) expect(m[1]).toContain(".hud-placas");
    }
  });
});
