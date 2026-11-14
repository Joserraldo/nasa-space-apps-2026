/**
 * Registro interno de una tormenta (lo que guardamos en data/mock y data/curated).
 * Es más rico que el contrato: de aquí se DERIVA el SpaceWeatherEvent con `aConvenio()`.
 * Textos visibles: solo claves i18n (data/i18n/{es,en}.json).
 */
import { z } from "zod";
import type { SpaceWeatherKind } from "./contrato";

/** Mismo enum que el contrato (local para no mezclar dos copias de zod). La línea siguiente falla al compilar si difieren. */
const SpaceWeatherKindSchema = z.enum(["CME", "FLR", "SEP", "GST", "RBE"]);
type Igual<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
const _mismoEnum: Igual<z.infer<typeof SpaceWeatherKindSchema>, SpaceWeatherKind> = true;
void _mismoEnum;

/** Una tormenta cuenta como "observada en Marte" si RAD sube al menos 1,5× sobre su fondo. */
export const UMBRAL_OBSERVADO = 1.5;

export const VERSION_REGISTRO = "0.2.0" as const;

/** Hora UTC como la da DONKI: 2024-05-10T15:00Z (con o sin segundos). */
export const HoraUtc = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?Z$/, "hora UTC estilo DONKI");

export const FaseSchema = z.object({
  tipo: SpaceWeatherKindSchema,
  /** ID real de DONKI; en mocks empieza por "MOCK-". */
  idFuente: z.string().min(1),
  hora: HoraUtc,
  claseGoes: z.string().regex(/^[ABCMX]\d+(\.\d+)?$/).optional(),
  velocidadKmS: z.number().positive().optional(),
  kpMax: z.number().min(0).max(9).optional(),
  observadoEn: z.enum(["Sol", "Tierra", "Marte"]),
  instrumentos: z.array(z.string()),
  url: z.string().url(),
});
export type Fase = z.infer<typeof FaseSchema>;

export const TormentaSchema = z
  .object({
    version: z.literal(VERSION_REGISTRO),
    id: z.string().regex(/^[a-z0-9-]+$/),
    estadoDato: z.enum(["mock", "curado"]),
    nombreKey: z.string(),
    queOcurrioKey: z.string(),
    /**
     * observado = medido en Marte · modelado = la simulación WSA-ENLIL de DONKI predice llegada a Marte
     * · escenario = pasó cerca de la Tierra y el juego imagina que llega a la base.
     */
    marcoMarte: z.enum(["observado", "modelado", "escenario"]),
    /** Llegada a Marte según WSA-ENLIL (modelo, no medición). Solo con marcoMarte "modelado". */
    llegadaMarte: z
      .object({ idFuente: z.string(), hora: HoraUtc, rozando: z.boolean(), url: z.string().url() })
      .optional(),
    /**
     * Medición real de RAD (Curiosity, cráter Gale) vía OSDR RadLab, si hay datos en la ventana.
     * Dosis ABSORBIDA en µGy/h (medias diarias UTC). Se incluye aunque no haya aumento.
     */
    medicionMarte: z
      .object({
        instrumento: z.literal("MSL-RAD-Surface"),
        unidad: z.literal("µGy/h"),
        fondo: z.number().positive(),
        pico: z.number().positive(),
        picoMuestra: z.number().positive(),
        diaPico: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        factor: z.number().positive(),
        url: z.string().url(),
      })
      .optional(),
    /** Numeración de DONKI (5 cifras: 13664 = "AR 3664" de NOAA). */
    regionActiva: z.number().int().positive().nullable(),
    fases: z.array(FaseSchema).min(1),
    fuente: z.object({
      nombreKey: z.string(),
      dueno: z.string(),
      url: z.string().url(),
      consultadoEl: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    }),
  })
  .superRefine((t, ctx) => {
    const mock = t.fases.map((f) => f.idFuente.startsWith("MOCK-"));
    if (t.estadoDato === "mock" && mock.includes(false))
      ctx.addIssue({ code: "custom", message: "un mock solo lleva IDs MOCK-" });
    if (t.estadoDato === "curado" && mock.includes(true))
      ctx.addIssue({ code: "custom", message: "un curado no lleva IDs MOCK-" });
    if (t.marcoMarte === "modelado" && !t.llegadaMarte)
      ctx.addIssue({ code: "custom", message: "modelado necesita llegadaMarte" });
    if (t.estadoDato === "curado" && t.marcoMarte === "observado" && !(t.medicionMarte && t.medicionMarte.factor >= UMBRAL_OBSERVADO))
      ctx.addIssue({ code: "custom", message: "observado necesita una medición en Marte con factor ≥ 1,5" });
    const horas = t.fases.map((f) => f.hora);
    if (horas.join() !== [...horas].sort().join())
      ctx.addIssue({ code: "custom", message: "fases fuera de orden" });
    for (const f of t.fases) {
      if (f.tipo === "FLR" && !f.claseGoes) ctx.addIssue({ code: "custom", message: `${f.idFuente}: FLR sin clase` });
      if (f.tipo === "GST" && f.kpMax === undefined) ctx.addIssue({ code: "custom", message: `${f.idFuente}: GST sin Kp` });
      if (f.tipo === "GST" && f.observadoEn !== "Tierra")
        ctx.addIssue({ code: "custom", message: "el Kp mide la Tierra: GST siempre es observadoEn Tierra" });
    }
  });
export type Tormenta = z.infer<typeof TormentaSchema>;
