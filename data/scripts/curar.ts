/**
 * data/raw (DONKI tal cual) + curated/config.json → data/curated/<id>.json + index.json.
 * Uso: npm run curar. No llama a la red. Todo número sale de raw; si algo no cuadra, falla.
 *
 * Reglas (documentadas en docs/science/pipeline.md):
 *  - FLR: hora = peakTime; clase = classType. CME: hora = startTime; velocidad = la que se usó
 *    como entrada en la última simulación WSA-ENLIL de esa CME; si no hubo simulación, la del
 *    análisis isMostAccurate más reciente (time21_5). SEP: hora = eventTime; se rechazan
 *    instrumentos "MODEL:" (son pronósticos, no mediciones). GST: hora = startTime; kpMax = máx. Kp.
 *  - Cadena: cada fase debe estar enlazada en DONKI (linkedEvents) con alguna fase anterior.
 *  - RAD: si RadLab cubre la ventana, medicionMarte (ver medicionMarte()); factor ≥ 1,5 → "observado".
 *  - Marte: la última WSA-ENLIL completada que usa la CME como entrada (las corridas nuevas
 *    reemplazan a las viejas). Si su impactList incluye Mars → "modelado"; si no → "escenario".
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { DonkiCME, DonkiEnlil, DonkiFLR, DonkiGST, DonkiSEP } from "../src/donki";
import { RadlabRespuesta } from "../src/radlab";
import { TormentaSchema, UMBRAL_OBSERVADO, type Fase, type Tormenta } from "../src/tormenta";
import { leerConfig, RAIZ } from "./config";

type Crudo = Record<string, unknown> & { linkedEvents?: { activityID: string }[] | null };

function cargar(grupo: string) {
  const dir = join(RAIZ, "raw", grupo);
  const leer = <T extends z.ZodTypeAny>(f: string, s: T): z.infer<T>[] =>
    z.array(s).parse(JSON.parse(readFileSync(join(dir, `${f}.json`), "utf-8")));
  return {
    FLR: leer("FLR", DonkiFLR),
    CME: leer("CME", DonkiCME),
    SEP: leer("SEP", DonkiSEP),
    GST: leer("GST", DonkiGST),
    ENLIL: leer("WSAEnlilSimulations", DonkiEnlil),
    RAD: existsSync(join(dir, "RAD.json")) ? RadlabRespuesta.parse(JSON.parse(readFileSync(join(dir, "RAD.json"), "utf-8"))) : null,
    consultadoEl: JSON.parse(readFileSync(join(dir, "consulta.json"), "utf-8")).consultadoEl as string,
  };
}
type Grupo = ReturnType<typeof cargar>;

const tipoDeId = (id: string) => {
  const m = /-(FLR|CME|SEP|GST)-\d{3}$/.exec(id);
  if (!m) throw new Error(`ID sin tipo reconocible: ${id}`);
  return m[1] as Fase["tipo"];
};
const nombres = (x: { instruments: { displayName: string }[] }) => x.instruments.map((i) => i.displayName);

type Enlil = z.infer<typeof DonkiEnlil>;

/** Última simulación WSA-ENLIL completada que usa esta CME (por hora de inicio). */
function ultimaEnlil(g: Grupo, horaCme: string): Enlil | undefined {
  return g.ENLIL.filter((s) => (s.cmeInputs ?? []).some((i) => i.cmeStartTime === horaCme))
    .sort((a, b) => a.modelCompletionTime.localeCompare(b.modelCompletionTime))
    .pop();
}

export function velocidadCme(c: z.infer<typeof DonkiCME>, sim?: Enlil): number | undefined {
  const entrada = sim?.cmeInputs?.find((i) => i.cmeStartTime === c.startTime)?.speed;
  if (entrada) return entrada;
  const buenos = (c.cmeAnalyses ?? []).filter((a) => a.isMostAccurate && a.speed);
  return buenos.sort((a, b) => String(a.time21_5 ?? "").localeCompare(String(b.time21_5 ?? ""))).pop()?.speed ?? undefined;
}

function fase(g: Grupo, id: string): { fase: Fase; crudo: Crudo; region: number | null } {
  const tipo = tipoDeId(id);
  const falta = () => new Error(`${id} no está en raw (¿ventana corta?)`);
  if (tipo === "FLR") {
    const f = g.FLR.find((x) => x.flrID === id) ?? (() => { throw falta(); })();
    return {
      fase: { tipo, idFuente: id, hora: f.peakTime ?? f.beginTime, claseGoes: f.classType, observadoEn: "Sol", instrumentos: nombres(f), url: f.link },
      crudo: f, region: f.activeRegionNum,
    };
  }
  if (tipo === "CME") {
    const c = g.CME.find((x) => x.activityID === id) ?? (() => { throw falta(); })();
    return {
      fase: { tipo, idFuente: id, hora: c.startTime, velocidadKmS: velocidadCme(c, ultimaEnlil(g, c.startTime)), observadoEn: "Sol", instrumentos: nombres(c), url: c.link },
      crudo: c, region: c.activeRegionNum,
    };
  }
  if (tipo === "SEP") {
    const s = g.SEP.find((x) => x.sepID === id) ?? (() => { throw falta(); })();
    if (nombres(s).some((n) => n.startsWith("MODEL:"))) throw new Error(`${id}: es un modelo, no una medición`);
    return { fase: { tipo, idFuente: id, hora: s.eventTime, observadoEn: "Tierra", instrumentos: nombres(s), url: s.link }, crudo: s, region: null };
  }
  const t = g.GST.find((x) => x.gstID === id) ?? (() => { throw falta(); })();
  return {
    fase: { tipo, idFuente: id, hora: t.startTime, kpMax: Math.max(...t.allKpIndex.map((k) => k.kpIndex)), observadoEn: "Tierra", instrumentos: [...new Set(t.allKpIndex.map((k) => `Kp: ${k.source}`))], url: t.link },
    crudo: t, region: null,
  };
}

const DIA_MS = 86_400_000;
const r1 = (x: number) => Math.round(x * 10) / 10;

/**
 * RAD en Marte alrededor de la hora t0 (inicio de la tormenta):
 *  fondo = media de las muestras en los 5 días antes; pico = la mayor media diaria (UTC) en los
 *  3 días después; factor = pico / fondo. Solo si hay muestras en ambos lados.
 *  (Primero se probó con 5 días después: le atribuía al X9.3 del 6 sep 2017 el pico del 11 sep,
 *  que es del X8.2 del 10 sep. Con 3 días cada pico queda con su tormenta.)
 */
export function medicionMarte(g: Grupo, t0: string, url: string) {
  if (!g.RAD) return undefined;
  const ini = Date.parse(t0);
  const muestras = g.RAD.data.map(([ts, , v]) => ({ t: Date.parse(`${ts}Z`), dia: ts.slice(0, 10), v }));
  const antes = muestras.filter((m) => m.t >= ini - 5 * DIA_MS && m.t < ini);
  const despues = muestras.filter((m) => m.t >= ini && m.t < ini + 3 * DIA_MS);
  if (antes.length < 20 || despues.length < 20) return undefined;
  const fondo = antes.reduce((s, m) => s + m.v, 0) / antes.length;
  const porDia = new Map<string, number[]>();
  for (const m of despues) porDia.set(m.dia, [...(porDia.get(m.dia) ?? []), m.v]);
  const [diaPico, valores] = [...porDia].sort((a, b) => b[1].reduce((s, v) => s + v, 0) / b[1].length - a[1].reduce((s, v) => s + v, 0) / a[1].length)[0];
  const pico = valores.reduce((s, v) => s + v, 0) / valores.length;
  return {
    instrumento: "MSL-RAD-Surface" as const,
    unidad: "µGy/h" as const,
    fondo: r1(fondo),
    pico: r1(pico),
    picoMuestra: r1(Math.max(...valores)),
    diaPico,
    factor: r1(pico / fondo),
    url,
  };
}

function llegadaMarte(g: Grupo, cme?: Fase) {
  if (!cme) return undefined;
  const ultima = ultimaEnlil(g, cme.hora);
  const marte = ultima?.impactList?.find((i) => i.location === "Mars");
  return ultima && marte ? { idFuente: ultima.simulationID, hora: marte.arrivalTime, rozando: marte.isGlancingBlow, url: ultima.link } : undefined;
}

export function curar(): Tormenta[] {
  const cfg = leerConfig();
  const grupos = new Map(cfg.descargas.map((d) => [d.grupo, cargar(d.grupo)]));
  return cfg.tormentas.map((t) => {
    const g = grupos.get(t.grupo)!;
    const fases = t.fases.map((id) => fase(g, id));
    fases.forEach((f, i) => {
      if (i === 0) return;
      const previos = new Set(t.fases.slice(0, i));
      const enlazada =
        (f.crudo.linkedEvents ?? []).some((l) => previos.has(l.activityID)) ||
        fases.slice(0, i).some((p) => (p.crudo.linkedEvents ?? []).some((l) => l.activityID === f.fase.idFuente));
      if (!enlazada) throw new Error(`${t.id}: ${f.fase.idFuente} no está enlazada en DONKI con las fases anteriores`);
    });
    const marte = llegadaMarte(g, fases.find((f) => f.fase.tipo === "CME")?.fase);
    const consulta = JSON.parse(readFileSync(join(RAIZ, "raw", t.grupo, "consulta.json"), "utf-8"));
    const medicion = medicionMarte(g, fases[0].fase.hora, consulta.consultas?.RAD ?? "https://visualization.osdr.nasa.gov/radlab/");
    const observado = Boolean(medicion && medicion.factor >= UMBRAL_OBSERVADO);
    const tieneKp = fases.some((f) => f.fase.tipo === "GST");
    return TormentaSchema.parse({
      version: "0.2.0",
      id: t.id,
      estadoDato: "curado",
      nombreKey: `datos.tormenta.${t.id}.nombre`,
      queOcurrioKey: `datos.tormenta.${t.id}.queOcurrio`,
      marcoMarte: observado ? "observado" : marte ? "modelado" : "escenario",
      llegadaMarte: marte,
      medicionMarte: medicion,
      regionActiva: fases.find((f) => f.region)?.region ?? null,
      fases: fases.map((f) => f.fase),
      fuente: {
        nombreKey: "fuente.donki",
        dueno: [
          "NASA CCMC (DONKI)",
          tieneKp ? "índice Kp: NOAA" : "",
          medicion ? "radiación en Marte: RAD de MSL Curiosity (NASA) vía OSDR RadLab" : "",
        ].filter(Boolean).join("; "),
        url: "https://ccmc.gsfc.nasa.gov/tools/DONKI/",
        consultadoEl: g.consultadoEl,
      },
    });
  });
}

if (process.argv[1]?.endsWith("curar.ts")) {
  const cfg = leerConfig();
  const tormentas = curar();
  for (const t of tormentas)
    writeFileSync(join(RAIZ, "curated", `${t.id}.json`), JSON.stringify(t, null, 2) + "\n");
  writeFileSync(
    join(RAIZ, "curated", "index.json"),
    JSON.stringify({ rutaDorada: cfg.rutaDorada, orden: tormentas.map((t) => t.id) }, null, 2) + "\n",
  );
  for (const t of tormentas)
    console.log(`${t.id}: ${t.fases.map((f) => f.claseGoes ?? (f.velocidadKmS && `${f.velocidadKmS}km/s`) ?? (f.kpMax !== undefined ? `Kp${f.kpMax}` : f.tipo)).join(" → ")} | Marte: ${t.marcoMarte}${t.llegadaMarte ? ` ${t.llegadaMarte.hora}${t.llegadaMarte.rozando ? " (rozando)" : ""}` : ""}`);
}
