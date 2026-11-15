import { afterEach, describe, expect, it, vi } from "vitest";
import {
  PROGRESO_MAX_BYTES,
  consultarSesion,
  deserializarProgreso,
  esClaveValida,
  esUsuarioValido,
  serializarProgreso,
} from "./cuenta.js";
import { inicial, reducir } from "./reductor.js";

describe("cuenta opcional e invitado (#109)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("valida usuario sin correo y clave segun reglas del Worker", () => {
    expect(esUsuarioValido("astronauta_1")).toBe(true);
    expect(esUsuarioValido("ab")).toBe(false);
    expect(esUsuarioValido("con@correo.com")).toBe(false);
    expect(esClaveValida("12345678")).toBe(true);
    expect(esClaveValida("1234567")).toBe(false);
  });

  it("serializa progreso jugable dentro de 20 KB y lo valida al restaurar", () => {
    let j = reducir(inicial(), { tipo: "fase", fase: "modulos" });
    j = reducir(j, { tipo: "modulo", modulo: "panel_solar" });
    const guardado = serializarProgreso(j);
    expect(guardado).not.toBeNull();
    expect(new TextEncoder().encode(JSON.stringify({ datos: guardado })).length).toBeLessThanOrEqual(PROGRESO_MAX_BYTES);

    const restaurado = deserializarProgreso(guardado);
    expect(restaurado?.fase).toBe("modulos");
    expect(restaurado?.colocados).toEqual(["panel_solar"]);
    expect(deserializarProgreso({ v: 99 })).toBeNull();
  });

  it("en modo invitado no llama a /api/auth/me si no hay pista de sesion", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    expect(await consultarSesion()).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
