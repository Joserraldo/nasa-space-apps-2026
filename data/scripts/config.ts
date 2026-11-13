import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

export const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");

const Fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const ENDPOINTS = ["FLR", "CME", "SEP", "GST", "WSAEnlilSimulations"] as const;

export const ConfigSchema = z
  .object({
    descargas: z.array(
      z.object({
        grupo: z.string().regex(/^[a-z0-9-]+$/),
        ventanas: z.record(z.enum(ENDPOINTS), z.tuple([Fecha, Fecha])),
      }),
    ),
    rutaDorada: z.string(),
    tormentas: z.array(
      z.object({
        id: z.string().regex(/^[a-z0-9-]+$/),
        grupo: z.string(),
        /** IDs reales de DONKI en orden temporal. */
        fases: z.array(z.string()).min(1),
      }),
    ),
  })
  .superRefine((c, ctx) => {
    const grupos = new Set(c.descargas.map((d) => d.grupo));
    for (const t of c.tormentas)
      if (!grupos.has(t.grupo)) ctx.addIssue({ code: "custom", message: `${t.id}: grupo ${t.grupo} no existe` });
    if (!c.tormentas.some((t) => t.id === c.rutaDorada))
      ctx.addIssue({ code: "custom", message: "rutaDorada no está en tormentas" });
  });
export type Config = z.infer<typeof ConfigSchema>;

export const leerConfig = (): Config =>
  ConfigSchema.parse(JSON.parse(readFileSync(join(RAIZ, "curated", "config.json"), "utf-8")));
