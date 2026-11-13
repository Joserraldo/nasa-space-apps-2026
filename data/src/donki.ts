/**
 * Esquemas Zod de las respuestas crudas de DONKI. Solo los campos que usamos;
 * el resto se tolera (passthrough) porque DONKI añade campos sin avisar.
 * Campos comprobados contra respuestas reales del 2026-11-13 (ver samples/README.md).
 */
import { z } from "zod";

const Instrument = z.object({ displayName: z.string() }).passthrough();
const Linked = z.array(z.object({ activityID: z.string() }).passthrough()).nullable().optional();

export const DonkiFLR = z
  .object({
    flrID: z.string(),
    beginTime: z.string(),
    peakTime: z.string().nullable(),
    endTime: z.string().nullable(),
    classType: z.string(),
    sourceLocation: z.string().nullable(),
    activeRegionNum: z.number().int().nullable(),
    instruments: z.array(Instrument),
    linkedEvents: Linked,
    link: z.string().url(),
  })
  .passthrough();

export const DonkiCME = z
  .object({
    activityID: z.string(),
    startTime: z.string(),
    sourceLocation: z.string().nullable(),
    activeRegionNum: z.number().int().nullable(),
    instruments: z.array(Instrument),
    cmeAnalyses: z
      .array(
        z
          .object({
            isMostAccurate: z.boolean(),
            speed: z.number().nullable(),
            halfAngle: z.number().nullable(),
            type: z.string().nullable(),
          })
          .passthrough(),
      )
      .nullable(),
    linkedEvents: Linked,
    link: z.string().url(),
  })
  .passthrough();

export const DonkiGST = z
  .object({
    gstID: z.string(),
    startTime: z.string(),
    allKpIndex: z.array(
      z.object({ observedTime: z.string(), kpIndex: z.number(), source: z.string() }).passthrough(),
    ),
    linkedEvents: Linked,
    link: z.string().url(),
  })
  .passthrough();

export const DonkiSEP = z
  .object({
    sepID: z.string(),
    eventTime: z.string(),
    instruments: z.array(Instrument),
    linkedEvents: Linked,
    link: z.string().url(),
  })
  .passthrough();

export const DonkiEnlil = z
  .object({
    simulationID: z.string(),
    modelCompletionTime: z.string(),
    link: z.string().url(),
    cmeInputs: z
      .array(z.object({ cmeStartTime: z.string(), speed: z.number().nullable(), isMostAccurate: z.boolean() }).passthrough())
      .nullable(),
    impactList: z
      .array(z.object({ location: z.string(), arrivalTime: z.string(), isGlancingBlow: z.boolean() }).passthrough())
      .nullable(),
  })
  .passthrough();
