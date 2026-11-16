import { describe, expect, it } from "vitest";
import { CLAVE_AJUSTES, ajustesPorDefecto, cargarAjustes, guardarAjustes } from "./ajustes";

function almacenEnMemoria() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
}

describe("ajustes del jugador", () => {
  it("por defecto en inglés, salvo navegador en español", () => {
    expect(ajustesPorDefecto().idioma).toBe("en");
    expect(ajustesPorDefecto({ idiomaNavegador: "es-CO" }).idioma).toBe("es");
    expect(ajustesPorDefecto({ idiomaNavegador: "fr" }).idioma).toBe("en");
  });

  it("respeta prefers-reduced-motion del navegador", () => {
    expect(ajustesPorDefecto({ prefiereMovimientoReducido: true }).movimientoReducido).toBe(true);
  });

  it("guarda y vuelve a cargar lo mismo", () => {
    const a = almacenEnMemoria();
    const ajustes = { idioma: "es" as const, sonido: false, movimientoReducido: true, calidad: "baja" as const, camara: "primera" as const };
    guardarAjustes(a, ajustes);
    expect(cargarAjustes(a)).toEqual(ajustes);
  });

  it("ignora datos corruptos o campos inválidos", () => {
    const a = almacenEnMemoria();
    a.setItem(CLAVE_AJUSTES, "{no es json");
    expect(cargarAjustes(a)).toEqual(ajustesPorDefecto());
    a.setItem(CLAVE_AJUSTES, JSON.stringify({ idioma: "de", sonido: false, calidad: "ultra" }));
    expect(cargarAjustes(a)).toEqual({ ...ajustesPorDefecto(), sonido: false });
  });

  it("la cámara arranca en tercera persona, se guarda y un valor desconocido vuelve al defecto (#372)", () => {
    expect(ajustesPorDefecto().camara).toBe("tercera");
    const a = almacenEnMemoria();
    a.setItem(CLAVE_AJUSTES, JSON.stringify({ ...ajustesPorDefecto(), camara: "aerea" }));
    expect(cargarAjustes(a).camara).toBe("tercera");
    // Ajustes guardados antes de que existiera `camara`: se conservan y la cámara queda en tercera.
    a.setItem(CLAVE_AJUSTES, JSON.stringify({ idioma: "es", sonido: false, movimientoReducido: false, calidad: "alta" }));
    expect(cargarAjustes(a)).toEqual({ idioma: "es", sonido: false, movimientoReducido: false, calidad: "alta", camara: "tercera" });
  });

  it("sin almacenamiento o si falla, el juego sigue", () => {
    const roto = { getItem: () => { throw new Error("bloqueado"); }, setItem: () => { throw new Error("bloqueado"); } };
    expect(cargarAjustes(roto)).toEqual(ajustesPorDefecto());
    expect(() => guardarAjustes(roto, ajustesPorDefecto())).not.toThrow();
    expect(cargarAjustes(undefined)).toEqual(ajustesPorDefecto());
  });
});
