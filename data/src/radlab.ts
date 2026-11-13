/** Respuesta de OSDR RadLab (formato "split" de pandas) para RAD en la superficie de Marte. */
import { z } from "zod";

export const RadlabRespuesta = z.object({
  columns: z.tuple([z.literal("timestamp"), z.literal("instrument_id"), z.literal("absorbed_dose_rate")]),
  data: z.array(z.tuple([z.string(), z.literal("MSL-RAD-Surface"), z.number()])),
});
export type RadlabRespuesta = z.infer<typeof RadlabRespuesta>;

/** Unidad de absorbed_dose_rate en RadLab (documentación de la Data API): µGy/h. Dosis ABSORBIDA, nunca mSv. */
export const UNIDAD_RAD = "µGy/h" as const;
