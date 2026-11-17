import { describe, expect, it } from "vitest";
import { aplicarAccion, partidaDeMision, partidaDorada } from "@solar-shield/engine";
import {
  MISION_JEZERO,
  MISION_LUNA_POLO_SUR,
  MISION_LUNA_VISIBLE,
  MISION_MARTE_POLO_NORTE,
  MISION_OUTPOST_SORPRESA,
} from "@solar-shield/missions";
import en from "../i18n/en.json";
import es from "../i18n/es.json";
import { conversar, type VistaAgente } from "./index.js";
import { averiaDeSitio, irisDanada, lecturaFalsa, lecturaIris } from "./iris.js";

// P0.5: la avería de Iris sale de la misión del sitio, no de una constante escondida.
const MISIONES = [MISION_JEZERO, MISION_MARTE_POLO_NORTE, MISION_LUNA_POLO_SUR, MISION_LUNA_VISIBLE, MISION_OUTPOST_SORPRESA];

describe("averiaDeSitio: cada misión lee mal lo suyo", () => {
  it("devuelve la averiaIris de las 5 misiones", () => {
    for (const mision of MISIONES) {
      expect(averiaDeSitio(mision.sitio)).toEqual(mision.averiaIris);
    }
  });
});

describe("lecturaFalsa: exagera y, si no cabe, se queda corta", () => {
  it("(52, 20) → 72 y (90, 20) → 70", () => {
    expect(lecturaFalsa(52, 20)).toBe(72);
    expect(lecturaFalsa(90, 20)).toBe(70);
  });
  it("es determinista", () => {
    for (const real of [0, 10, 52, 90, 100]) expect(lecturaFalsa(real, 20)).toBe(lecturaFalsa(real, 20));
  });
});

describe("Jezero: IRIS dañada lee mal el blindaje y la Ingeniera la verifica", () => {
  const s = partidaDorada();
  const opciones = { tormentaActiva: true, averiaRevelada: true };
  const d = conversar({ experto: "ia_base" }, s, { ...opciones, vecesFallaIris: 0 }) as {
    falla?: { forma: string; recurso: string; valorReal: number; valorDicho: number };
    lineas: { clave: string }[];
  };
  const averia = averiaDeSitio(s.sitio);
  const valorReal = Math.round(s.recursos.blindaje);

  it("su falla es un número falso sobre el blindaje", () => {
    expect(d.falla).toEqual({ forma: "numero_falso", recurso: "blindaje", valorReal, valorDicho: lecturaFalsa(valorReal, 20) });
    expect(d.lineas[1]?.clave).toBe("agentes.iris.falla.numero");
  });

  it("la Ingeniera compara lo dicho con el medidor y propone repararla", () => {
    const v = conversar({ experto: "ingeniera" }, s, opciones);
    expect(v.experto).toBe("ingeniera");
    expect(v.accion).toEqual({ tipo: "reparar", equipo: "ia_base" });
    expect(v.lineas[0]).toEqual({
      clave: "agentes.iris.verificar.numero",
      vars: { dicho: d.falla?.valorDicho, real: valorReal },
    });
    expect(averia.reparaCon).toBe("ingeniera");
  });
});

describe("Polo norte: el recurso mal leído sale de la misión", () => {
  const s = partidaDeMision(MISION_MARTE_POLO_NORTE);
  const averia = MISION_MARTE_POLO_NORTE.averiaIris;

  it("es la energía, con error 20 y su propia clave", () => {
    expect(averia.recursoMalLeido).toBe("energia");
    expect(averia.errorLectura).toBe(20);
    const d = conversar({ experto: "ia_base" }, s, { tormentaActiva: true, averiaRevelada: true }) as {
      falla?: { recurso: string; valorReal: number; valorDicho: number };
      lineas: { clave: string }[];
    };
    const valorReal = Math.round(s.recursos.energia);
    expect(d.falla).toEqual({ forma: "numero_falso", recurso: "energia", valorReal, valorDicho: lecturaFalsa(valorReal, 20) });
    expect(d.lineas[1]?.clave).toBe("agentes.iris.falla.numero.energia");
  });
});

describe("antes de la revelación no hay avería visible", () => {
  const s = partidaDorada();

  it("la Ingeniera responde como siempre y no verifica a Iris", () => {
    const d = conversar({ experto: "ingeniera" }, s, { tormentaActiva: true, averiaRevelada: false });
    expect(d.lineas[0]?.clave).toMatch(/^agentes\.ingeniera\.energia\./);
  });

  it("IRIS no da una lectura falsa", () => {
    const d = conversar({ experto: "ia_base" }, s, { tormentaActiva: true, averiaRevelada: false }) as { falla?: unknown };
    expect(d.falla).toBeUndefined();
  });
});

describe("reparar restaura la lectura", () => {
  const r = aplicarAccion(partidaDorada(), { tipo: "reparar", equipo: "ia_base" });

  it("la IA deja de estar dañada y vuelve a leer bien el medidor", () => {
    expect(r.iaBase).not.toBe("danada");
    const lectura = lecturaIris(r, averiaDeSitio(r.sitio));
    expect(lectura.falsa).toBe(false);
    expect(lectura.recurso).toBe("blindaje");
    expect(lectura.valor).toBe(Math.round(r.recursos.blindaje));
  });

  it("IRIS ya contesta sin falla", () => {
    const d = conversar({ experto: "ia_base" }, r, { tormentaActiva: true, averiaRevelada: true }) as { falla?: unknown };
    expect(d.falla).toBeUndefined();
  });
});

describe("sin avería explícita, irisDanada conserva su comportamiento", () => {
  it("blindaje 30 → dice 75", () => {
    const v: VistaAgente & { rngEstado: number } = {
      recursos: { energia: 60, soporte_vital: 70, blindaje: 30 },
      tripulacion: [],
      tormenta: null,
      equipos: {},
      rngEstado: 7,
    };
    expect(irisDanada(v).falla).toEqual({ forma: "numero_falso", recurso: "blindaje", valorReal: 30, valorDicho: 75 });
  });
});

describe("i18n: las 12 claves nuevas existen con las mismas variables", () => {
  const claves = [
    "agentes.iris.falla.numero.energia",
    "agentes.iris.falla.numero.soporte_vital",
    "agentes.iris.falla.numeroConsejo.energia",
    "agentes.iris.falla.numeroConsejo.soporte_vital",
    "agentes.iris.verificar.numero.energia",
    "agentes.iris.verificar.numero.soporte_vital",
  ];

  const variables = (texto: string) => [...texto.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

  it("en.json y es.json tienen las 6 claves y las mismas variables", () => {
    for (const clave of claves) {
      const enTexto = en[clave as keyof typeof en];
      const esTexto = es[clave as keyof typeof es];
      expect(enTexto, clave).toBeDefined();
      expect(esTexto, clave).toBeDefined();
      expect(variables(esTexto), clave).toEqual(variables(enTexto));
    }
  });
});
