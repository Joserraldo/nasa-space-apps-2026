import { describe, expect, it } from "vitest";
import { aterrizar } from "@solar-shield/engine";
import { MISION_JEZERO } from "@solar-shield/missions";
import { CLAVE_PARTIDA, cargarPartida, guardarPartida } from "./guardado.js";
import { inicial, reducir, type Juego } from "./reductor.js";

function almacenFalso(inicialDatos: Record<string, string> = {}) {
  const datos = new Map(Object.entries(inicialDatos));
  return {
    datos,
    getItem: (k: string) => datos.get(k) ?? null,
    setItem: (k: string, v: string) => void datos.set(k, v),
    removeItem: (k: string) => void datos.delete(k),
  };
}

/** Partida con sitio elegido y un módulo colocado, en el paso de módulos. */
function enModulos(): Juego {
  const j = inicial();
  const sitio = MISION_JEZERO.sitiosCandidatos[0]!;
  const conSitio: Juego = { ...j, fase: "modulos", estado: aterrizar(j.estado, sitio.id) };
  return reducir(conSitio, { tipo: "modulo", modulo: "panel_solar" });
}

describe("partida guardada en el navegador", () => {
  it("sin nada guardado no hay partida que continuar", () => {
    expect(cargarPartida(almacenFalso())).toBeNull();
    expect(cargarPartida(undefined)).toBeNull();
  });

  it("la portada no guarda ni borra la partida anterior", () => {
    const almacen = almacenFalso();
    guardarPartida(almacen, enModulos());
    guardarPartida(almacen, inicial());
    expect(cargarPartida(almacen)?.fase).toBe("modulos");
  });

  it("guarda una partida en curso y la recupera con los mismos recursos y módulos", () => {
    const almacen = almacenFalso();
    const j = enModulos();
    guardarPartida(almacen, j);
    const vuelta = cargarPartida(almacen);
    expect(vuelta?.fase).toBe("modulos");
    expect(vuelta?.estado.recursos).toEqual(j.estado.recursos);
    expect(vuelta?.estado.tick).toBe(j.estado.tick);
    expect(vuelta?.colocados).toEqual(["panel_solar"]);
  });

  it("una partida terminada se borra: no queda nada que continuar", () => {
    const almacen = almacenFalso();
    const j = enModulos();
    guardarPartida(almacen, j);
    guardarPartida(almacen, { ...j, fase: "final", estado: { ...j.estado, resultado: "fallo" } });
    expect(almacen.datos.has(CLAVE_PARTIDA)).toBe(false);
    expect(cargarPartida(almacen)).toBeNull();
  });

  it("con la decisión de la tormenta registrada se guarda ya en la base: no se decide dos veces", () => {
    const almacen = almacenFalso();
    const j = enModulos();
    guardarPartida(almacen, { ...j, fase: "tormenta", registro: j.estado });
    const vuelta = cargarPartida(almacen);
    expect(vuelta?.fase).toBe("base");
    expect(vuelta?.registro).toBeNull();
    expect(vuelta?.estado.pausado).toBe(false);
  });

  it("datos dañados o de otra versión se descartan sin romper", () => {
    expect(cargarPartida(almacenFalso({ [CLAVE_PARTIDA]: "{no es json" }))).toBeNull();
    expect(cargarPartida(almacenFalso({ [CLAVE_PARTIDA]: JSON.stringify({ v: 99, fase: "base" }) }))).toBeNull();
    expect(cargarPartida(almacenFalso({ [CLAVE_PARTIDA]: JSON.stringify({ v: 1, fase: "base", estado: { tick: "x" } }) }))).toBeNull();
  });

  it("si el almacenamiento falla, guardar y cargar no lanzan", () => {
    const roto = {
      getItem: () => { throw new Error("bloqueado"); },
      setItem: () => { throw new Error("lleno"); },
      removeItem: () => { throw new Error("bloqueado"); },
    };
    expect(() => guardarPartida(roto, enModulos())).not.toThrow();
    expect(cargarPartida(roto)).toBeNull();
  });
});
