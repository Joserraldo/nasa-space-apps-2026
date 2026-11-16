import { describe, expect, it } from "vitest";
import { crearRegistroSistemas, sistemasAutomaticos, type ContextoSistema, type SistemaEscena } from "./escena3d";

/** Contexto falso: el registro no toca WebGL, solo lo pasa a los sistemas. */
const ctx = { pedido: {}, jugador: { x: 0, z: 0, rumbo: 0 }, ahora: 0 } as unknown as ContextoSistema;

function sistema(id: string, registro: string[], falla?: "montar" | "actualizar"): SistemaEscena {
  return {
    id,
    montar(c) {
      expect(c).toBe(ctx);
      registro.push(`montar ${id}`);
      if (falla === "montar") throw new Error("montar");
    },
    actualizar(dt, c) {
      expect(c).toBe(ctx);
      registro.push(`actualizar ${id} ${dt}`);
      if (falla === "actualizar") throw new Error("actualizar");
    },
    dispose() {
      registro.push(`dispose ${id}`);
    },
  };
}

describe("ganchos de sistemas (A0)", () => {
  it("monta, actualiza con dt y el contexto, y libera en orden inverso", () => {
    const r: string[] = [];
    const reg = crearRegistroSistemas(ctx, () => undefined);
    reg.agregar(sistema("a", r));
    reg.agregar(sistema("b", r));
    reg.actualizar(0.016);
    reg.dispose();
    expect(r).toEqual(["montar a", "montar b", "actualizar a 0.016", "actualizar b 0.016", "dispose b", "dispose a"]);
    expect(reg.ids()).toEqual([]);
  });

  it("quitar un sistema lo libera una sola vez y deja de actualizarlo", () => {
    const r: string[] = [];
    const reg = crearRegistroSistemas(ctx, () => undefined);
    const quitar = reg.agregar(sistema("a", r));
    quitar();
    quitar();
    reg.actualizar(1);
    expect(r).toEqual(["montar a", "dispose a"]);
  });

  it("un sistema que lanza se desmonta, se avisa y los demás siguen", () => {
    const r: string[] = [];
    const fallos: string[] = [];
    const reg = crearRegistroSistemas(ctx, (id) => fallos.push(id));
    reg.agregar(sistema("malo", r, "actualizar"));
    reg.agregar(sistema("bueno", r));
    reg.actualizar(1);
    reg.actualizar(2);
    expect(fallos).toEqual(["malo"]);
    expect(reg.ids()).toEqual(["bueno"]);
    expect(r.filter((l) => l.startsWith("actualizar"))).toEqual(["actualizar malo 1", "actualizar bueno 1", "actualizar bueno 2"]);
  });

  it("si falla al montar no queda montado y se libera", () => {
    const r: string[] = [];
    const fallos: string[] = [];
    const reg = crearRegistroSistemas(ctx, (id) => fallos.push(id));
    reg.agregar(sistema("malo", r, "montar"));
    expect(reg.ids()).toEqual([]);
    expect(fallos).toEqual(["malo"]);
    expect(r).toEqual(["montar malo", "dispose malo"]);
  });

  it("no acepta dos sistemas con el mismo id", () => {
    const reg = crearRegistroSistemas(ctx, () => undefined);
    reg.agregar(sistema("a", []));
    expect(() => reg.agregar(sistema("a", []))).toThrow(/repetido/);
  });

  it("los automáticos de escena/sistemas/ tienen id único", () => {
    const ids = sistemasAutomaticos().map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
