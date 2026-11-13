import { describe, expect, it } from "vitest";
import { EquipmentSchema } from "@solar-shield/contracts";
import en from "../i18n/en.json";
import es from "../i18n/es.json";
import { areaUrgente, explicarSistema, guiaIris, type VistaAgente } from "./index.js";

const vista = (r: Partial<VistaAgente["recursos"]> = {}, tormenta: VistaAgente["tormenta"] = null): VistaAgente => ({
  recursos: { energia: 60, soporte_vital: 70, blindaje: 50, ...r },
  tripulacion: [],
  equipos: {},
  tormenta,
});
const existe = (clave: string) => {
  expect(en[clave as keyof typeof en], clave).toBeDefined();
  expect(es[clave as keyof typeof es], clave).toBeDefined();
};

describe("Iris niveles 1-2", () => {
  it("prioriza el problema más urgente", () => {
    expect(areaUrgente(vista())).toBe("calma");
    expect(areaUrgente(vista({ blindaje: 10, energia: 10 }))).toBe("energia");
    expect(areaUrgente(vista({ soporte_vital: 5 }))).toBe("soporte");
  });
  it("tutorial: dice a quién llamar", () => {
    const d = guiaIris(vista({ energia: 10 }), "tutorial")!;
    expect(d.lineas[0]).toEqual({ clave: "agentes.iris.tutorial.energia", vars: { expertoKey: "agentes.nombre.ingeniera" } });
  });
  it("pistas: solo insinúa, sin nombrar al experto", () => {
    const d = guiaIris(vista({ energia: 10 }), "pistas")!;
    expect(d.lineas[0]).toEqual({ clave: "agentes.iris.pista.energia" });
  });
  it("offline y dañada no guían", () => {
    expect(guiaIris(vista(), "offline")).toBeNull();
    expect(guiaIris(vista(), "danada")).toBeNull();
  });
  it("todas las áreas y todos los sistemas tienen texto en en y es", () => {
    for (const a of ["tormenta", "energia", "blindaje", "soporte", "calma"]) {
      existe(`agentes.iris.tutorial.${a}`);
      existe(`agentes.iris.pista.${a}`);
    }
    for (const e of EquipmentSchema.options) existe(explicarSistema(e).lineas[0]!.clave);
  });
});
