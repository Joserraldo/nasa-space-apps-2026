import { afterEach, describe, expect, it, vi } from "vitest";
import {
  PROGRESO_MAX_BYTES,
  consultarSesion,
  deserializarProgreso,
  esClaveValida,
  esUsuarioValido,
  serializarProgreso,
} from "./cuenta.js";
import { aterrizar, avanzarTick, modulosColocados } from "@solar-shield/engine";
import { MISION_JEZERO } from "@solar-shield/missions";
import { inicial, reducir, type Juego } from "./reductor.js";

const bytes = (v: unknown) => new TextEncoder().encode(JSON.stringify(v)).length;

/** Partida larga (más de 20 KB sin compactar): aterrizaje, dos módulos y muchos ticks. */
function juegoLargo(): Juego {
  let j = reducir(inicial(), { tipo: "fase", fase: "modulos" });
  j = { ...j, estado: aterrizar(j.estado, MISION_JEZERO.sitiosCandidatos[0]!.id) };
  j = reducir(j, { tipo: "modulo", modulo: "panel_solar" });
  j = reducir(j, { tipo: "modulo", modulo: "escudo" });
  let s = j.estado;
  while (bytes({ datos: { ...j, estado: s } }) <= PROGRESO_MAX_BYTES) {
    s = avanzarTick({ ...s, pausado: false, resultado: "en_curso", recursos: { energia: 90, soporte_vital: 90, blindaje: 90 } });
  }
  // Partida aún en curso (si no, el motor ignora todo por haber terminado y el test no probaría nada).
  return { ...j, estado: { ...s, resultado: "en_curso" }, fase: "base" };
}

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

  it("una partida larga se guarda compactada sin perder módulos ni el aterrizaje", () => {
    const j = juegoLargo();
    const guardado = serializarProgreso(j);
    expect(guardado).not.toBeNull();
    expect(bytes({ datos: guardado })).toBeLessThanOrEqual(PROGRESO_MAX_BYTES);
    const r = deserializarProgreso(JSON.parse(JSON.stringify(guardado)))!;
    expect(r.estado.resultado).toBe("en_curso");
    expect(r.colocados).toEqual(["panel_solar", "escudo"]);
    expect(modulosColocados(r.estado)).toEqual(["panel_solar", "escudo"]);
    expect(r.estado.recursos).toEqual(j.estado.recursos);
    // El aterrizaje ya cobrado y los módulos ya puestos siguen contando para el motor.
    expect(aterrizar(r.estado, MISION_JEZERO.sitiosCandidatos[0]!.id)).toBe(r.estado);
    expect(reducir({ ...r, fase: "modulos" }, { tipo: "modulo", modulo: "panel_solar" }).estado).toBe(r.estado);
  });

  it("rechaza guardados con estado o sitio mal formados", () => {
    const guardado = serializarProgreso(reducir(inicial(), { tipo: "fase", fase: "modulos" }))!;
    expect(deserializarProgreso({ ...guardado, estado: { ...guardado.estado, recursos: { energia: "mucha" } } })).toBeNull();
    expect(deserializarProgreso({ ...guardado, estado: { ...guardado.estado, causas: null } })).toBeNull();
    expect(deserializarProgreso({ ...guardado, sitio: { id: 3 } })).toBeNull();
    expect(deserializarProgreso(guardado)).not.toBeNull();
  });

  it("en modo invitado no llama a /api/auth/me si no hay pista de sesion", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    expect(await consultarSesion()).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
