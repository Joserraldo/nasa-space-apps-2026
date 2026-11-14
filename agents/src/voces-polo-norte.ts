import type { Action, SourceCard } from "@solar-shield/contracts";
import type { Dialogo } from "./dialogo.js";
import { escenaTormenta, type EscenaTormenta, type OpcionDilemaVista } from "./escenas.js";
import type { VistaAgente } from "./expertos.js";
import { escenaPolvo, type EscenaPolvo } from "./polvo.js";

/**
 * Voces de la misión Marte polo norte (propuesta de datos en #97, plan en docs/ideas/voces-misiones-datos.md §3).
 * Depende de que diseño apruebe la misión. Regla de oro: RAD midió la tormenta en el cráter Gale, nunca "aquí en el polo".
 */
export type ZonaPoloNorte = "borde-sur" | "franja-media" | "junto-al-casquete";

// TODO: de #97 de datos — latitudes de las 3 zonas; en develop data/ solo trae regionPoloNorte() a 82° N.
export const LATITUD_ZONA_POLO_NORTE: Record<ZonaPoloNorte, number> = { "borde-sur": 70, "franja-media": 76, "junto-al-casquete": 82 };

/**
 * Lo arma quien integra con @solar-shield/data (agents no depende de data):
 * `solMaxGrados[z] = solMaxVerano(LATITUD_ZONA_POLO_NORTE[z])` y `fuente` = la de `regionPoloNorte()` (NSSDC, inclinación 25,19°).
 * Sin contexto, la Ingeniera no dice grados: solo "más Sol / menos Sol".
 */
export interface ContextoZonasPoloNorte {
  solMaxGrados: Record<ZonaPoloNorte, number>;
  fuente: SourceCard;
}

const zonaKey = (z: ZonaPoloNorte) => `agentes.polo_norte.zona.${z}`;

/** Paso 3 (sin mapa): cada experto defiende una franja; ninguna gana en todo. */
export function consejosZonasPoloNorte(c?: ContextoZonasPoloNorte): Dialogo[] {
  const ingeniera: Dialogo = c
    ? {
        experto: "ingeniera",
        prioridad: "consejo",
        fuente: c.fuente,
        lineas: [
          { clave: "agentes.polo_norte.zonas.ingeniera", vars: { zonaKey: zonaKey("borde-sur"), grados: Math.round(c.solMaxGrados["borde-sur"]) } },
          { clave: "agentes.polo_norte.zonas.ingenieraPoco", vars: { zonaKey: zonaKey("junto-al-casquete"), grados: Math.round(c.solMaxGrados["junto-al-casquete"]) } },
        ],
      }
    : { experto: "ingeniera", prioridad: "consejo", lineas: [{ clave: "agentes.polo_norte.zonas.ingenieraSinCifra", vars: { zonaKey: zonaKey("borde-sur") } }] };
  return [
    ingeniera,
    { experto: "doctora", prioridad: "consejo", lineas: [{ clave: "agentes.polo_norte.zonas.doctora", vars: { zonaKey: zonaKey("junto-al-casquete") } }] },
    { experto: "meteorologa", prioridad: "consejo", lineas: [{ clave: "agentes.polo_norte.zonas.meteorologa" }, { clave: "agentes.polo_norte.zonas.eje" }] },
  ];
}

/** Paso 4b (mala suerte): escarcha en los paneles. Misma decisión que el polvo; que la escarcha tape paneles es escenario de juego. */
export function escenaEscarcha(v: VistaAgente): EscenaPolvo | null {
  const e = escenaPolvo(v);
  if (!e) return null;
  const dialogos = e.dialogos.map((d): Dialogo => {
    if (d.experto === "ingeniera")
      return { ...d, lineas: [{ clave: "agentes.polo_norte.escarcha.alerta", vars: { energia: Math.round(v.recursos.energia) } }, { clave: "agentes.polo_norte.escarcha.limpiar" }] };
    if (d.experto === "meteorologa") return { ...d, lineas: [{ clave: "agentes.polo_norte.escarcha.frio" }] };
    return d;
  });
  return { dialogos, opciones: e.opciones };
}

/**
 * Paso 6, dilema de la batería: la Doctora cita a RAD "lejos, en Gale"; la Ingeniera defiende guardar la batería.
 * @param dilema `dilemaPaso6.opciones` de la misión cuando diseño la pase a missions/.
 */
export function escenaTormentaPoloNorte(v: VistaAgente, dilema?: readonly OpcionDilemaVista[]): EscenaTormenta | null {
  const t = v.tormenta;
  if (!t) return null;
  const medicion = t.medicionMarte ? { factor: t.medicionMarte.factor, lugar: "gale_lejos" as const, fuente: t.fuente } : undefined;
  const e = escenaTormenta(v, dilema, medicion);
  if (!e) return null;
  const dialogos = e.dialogos.map((d): Dialogo =>
    d.experto === "ingeniera" ? { ...d, lineas: [{ clave: "agentes.polo_norte.dilema.ingeniera" }, ...d.lineas.slice(1)] } : d,
  );
  return { ...e, dialogos };
}

/** Paso 7: empieza la noche polar. El panel da 0 (lo aplica el motor); aquí solo se cuenta, con el tiempo comprimido dicho. */
export function avisoNochePolar(v: VistaAgente): Dialogo[] {
  // "Casi dos años de la Tierra": 686,980 / 365,256 = 1,88 [V] NSSDC. La frase no lleva cifra, solo la fuente.
  const fuenteAnio: SourceCard = {
    nombreKey: "fuente.nssdc",
    url: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html",
    idFuente: "marsfact-anio",
    consultadoEl: "2026-11-14",
    dueno: "NASA NSSDC",
    estadoDato: "curado",
  };
  const esperar: Action = { tipo: "esperar" };
  return [
    {
      experto: "ingeniera",
      prioridad: "alerta",
      accion: esperar,
      lineas: [{ clave: "agentes.polo_norte.noche.ingeniera", vars: { energia: Math.round(v.recursos.energia) } }],
    },
    { experto: "ia_base", prioridad: "charla", fuente: fuenteAnio, lineas: [{ clave: "agentes.polo_norte.tiempo" }] },
  ];
}
