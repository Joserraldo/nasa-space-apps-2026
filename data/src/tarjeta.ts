/**
 * Tarjeta de fuente de una tormenta, lista para que ui la pinte (ruta dorada, #41).
 * Mismo formato que los diálogos de agentes: líneas { clave, vars }. ui resuelve cada clave en
 * i18n (en base, es segundo) y rellena {var}; una var que termina en `Key` es otra clave i18n.
 * Todas las cifras salen de la tormenta curada (nada se escribe a mano).
 */
import type { Tormenta } from "./tormenta";

export interface LineaTarjeta {
  clave: string;
  vars?: Record<string, string | number>;
}

export interface TarjetaFuente {
  tituloKey: string;
  queOcurrioKey: string;
  lineas: LineaTarjeta[];
  /** Enlace a la página pública del evento en DONKI. */
  url: string;
  /** "Real curated data, not live" o "Made-up test data". */
  etiquetaKey: string;
  /** "Unofficial project, not endorsed by NASA." */
  avisoKey: string;
}

const TIPO_KEY: Record<string, string> = {
  FLR: "datos.tarjeta.tipo.FLR",
  CME: "datos.tarjeta.tipo.CME",
  SEP: "datos.tarjeta.tipo.SEP",
  GST: "datos.tarjeta.tipo.GST",
  RBE: "datos.tarjeta.tipo.RBE",
};

export function tarjetaTormenta(t: Tormenta): TarjetaFuente {
  const principal = t.fases.find((f) => f.tipo === "CME") ?? t.fases[0]!;
  const lineas: LineaTarjeta[] = [
    { clave: "datos.tarjeta.fecha", vars: { fecha: t.fases[0]!.hora.slice(0, 10) } },
    { clave: "datos.tarjeta.id", vars: { id: principal.idFuente } },
  ];
  for (const f of t.fases) {
    const vars: Record<string, string | number> = { tipoKey: TIPO_KEY[f.tipo]! };
    if (f.claseGoes) lineas.push({ clave: "datos.tarjeta.fase.clase", vars: { ...vars, clase: f.claseGoes } });
    else if (f.velocidadKmS) lineas.push({ clave: "datos.tarjeta.fase.velocidad", vars: { ...vars, velocidad: f.velocidadKmS } });
    else if (f.kpMax !== undefined) lineas.push({ clave: "datos.tarjeta.fase.kp", vars: { ...vars, kp: f.kpMax } });
    else lineas.push({ clave: "datos.tarjeta.fase.simple", vars });
  }
  lineas.push({ clave: `datos.marco.${t.marcoMarte}` });
  if (t.medicionMarte) {
    const m = t.medicionMarte;
    lineas.push(
      m.factor >= 1.5
        ? { clave: "datos.tarjeta.medicion", vars: { pico: m.pico, fondo: m.fondo, factor: Math.round(m.factor), dia: m.diaPico } }
        : { clave: "datos.medicion.sinAumento" },
    );
  }
  if (t.llegadaMarte) lineas.push({ clave: "datos.tarjeta.modelo", vars: { fecha: t.llegadaMarte.hora.slice(0, 10) } });
  lineas.push({ clave: "datos.tarjeta.fuente", vars: { duenoKey: t.fuente.nombreKey, consultado: t.fuente.consultadoEl } });
  if (t.medicionMarte) lineas.push({ clave: "datos.medicion.rad" });
  return {
    tituloKey: t.nombreKey,
    queOcurrioKey: t.queOcurrioKey,
    lineas,
    url: principal.url,
    etiquetaKey: t.estadoDato === "curado" ? "datos.etiqueta.curado" : "datos.etiqueta.mock",
    avisoKey: "datos.aviso",
  };
}

/** Texto "Qué datos de NASA usamos y por qué", en orden, para la pantalla final y el formulario. */
export const DATOS_USADOS_KEYS = [
  "datos.usados.titulo",
  "datos.usados.donki",
  "datos.usados.radlab",
  "datos.usados.trek",
  "datos.usados.dosis",
  "datos.usados.osdr",
  "datos.usados.noEnVivo",
] as const;
