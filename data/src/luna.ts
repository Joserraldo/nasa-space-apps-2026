/**
 * Las tormentas curadas vistas desde la Luna: CRaTER, a bordo del Lunar Reconnaissance Orbiter (NASA),
 * vía OSDR RadLab (`CRaTER-D1D2`, dosis ABSORBIDA en µGy/h). Lo escribe scripts/luna.ts.
 * Ojo: CRaTER mide en ÓRBITA alrededor de la Luna, no en la superficie. ui y agentes deben decirlo así.
 */
import { z } from "zod";
import type { SourceCard } from "./contrato";

const Fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const MedicionLunaSchema = z.object({
  /** ID de la tormenta en curated/ (mismo t0 = hora de su primera fase). */
  id: z.string(),
  t0: z.string(),
  instrumento: z.literal("CRaTER-D1D2"),
  unidad: z.literal("µGy/h"),
  fondo: z.number().positive(),
  pico: z.number().positive(),
  picoMuestra: z.number().positive(),
  diaPico: Fecha,
  factor: z.number().positive(),
  /** false si en los 5 días del fondo ya había otra tormenta (el factor sale más bajo de lo real). */
  fondoTranquilo: z.boolean(),
  url: z.string().url(),
});
export type MedicionLuna = z.infer<typeof MedicionLunaSchema>;

export const LunaSchema = z.object({
  version: z.literal("0.1.0"),
  consultadoEl: Fecha,
  lugar: z.literal("órbita lunar"),
  mediciones: z.array(MedicionLunaSchema).min(1),
  /** Tormentas curadas sin datos de CRaTER en RadLab (p. ej. octubre de 2024). */
  sinDatos: z.array(z.string()),
});
export type Luna = z.infer<typeof LunaSchema>;

/**
 * El fondo es "tranquilo" si ninguna media diaria de esos 5 días supera el doble de la mediana
 * de las medias diarias de esa ventana (si una tormenta anterior lo infla, deja de serlo).
 */
export function fondoTranquilo(mediasDiarias: number[]): boolean {
  const s = [...mediasDiarias].sort((a, b) => a - b);
  const med = s[Math.floor(s.length / 2)] ?? 0;
  return med > 0 && s.every((x) => x <= 2 * med);
}

export function fuenteCrater(m: MedicionLuna, consultadoEl: string): SourceCard {
  return {
    nombreKey: "fuente.crater",
    url: m.url,
    idFuente: `crater-${m.id}`,
    consultadoEl,
    dueno: "NASA (LRO/CRaTER) vía OSDR RadLab",
    estadoDato: "curado",
  };
}
