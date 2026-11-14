import { CLASSIFIER_FALLBACK, ClassifierOutputSchema, type ClassifierOutput } from "@solar-shield/contracts";

/** Capa 2 del PLAN §2.3: el modelo solo clasifica a JSON. Nunca habla ni inventa cifras. Solo usa fetch (Workers y Node). */

export interface OpcionesClasificador {
  baseUrl: string;
  apiKey: string;
  model: string;
  fetch?: typeof fetch;
  timeoutMs?: number;
  /** Para registrar el reintento sin json_schema. Nunca recibe la clave. */
  log?: (mensaje: string) => void;
}

export interface ResultadoClasificador {
  salida: ClassifierOutput;
  /** true si el JSON llegó válido a la primera (sin caer al respaldo). */
  valido: boolean;
  usoJsonObject: boolean;
  tokens: number | null;
  error?: string;
}

export const PROMPT_SISTEMA = `Eres un clasificador de frases de ninos en un juego espacial. Responde SOLO JSON, sin texto extra.
Campos: experto, accion, parametros, confianza (0 a 1).
accion y su experto: repartir_energia/reparar/estado_energia -> ingeniera; estado_salud/ir_al_refugio/explicar_dosis -> doctora; pronostico/explicar_evento -> meteorologa; que_pasa_si -> matematico; ayuda/repetir/saludo/fuera_de_tema -> ia_base.
parametros (solo estos valores, o {}):
- repartir_energia: destino = blindaje|soporte_vital, cantidad = poco|medio|mucho
- reparar: equipo = panel_solar|bateria|reciclador_agua|invernadero|escudo|antena|ia_base
- que_pasa_si: accion = una de las acciones anteriores si la dice (ej. ir_al_refugio)
Si la frase no trata del juego (chistes, deportes, etc.) usa accion fuera_de_tema, experto ia_base, parametros {}.
Entiende espanol e ingles. Nunca pongas numeros en parametros.`;

const EXPERTOS = ["ingeniera", "doctora", "meteorologa", "matematico", "control_mision", "ia_base"];
const ACCIONES = [
  "repartir_energia", "reparar", "estado_energia", "estado_salud", "ir_al_refugio", "explicar_dosis",
  "pronostico", "explicar_evento", "que_pasa_si", "ayuda", "repetir", "saludo", "fuera_de_tema",
];

/** Escrito a mano desde ClassifierOutputSchema (sin dependencias nuevas). `fuente` y `version` los fija el código. */
export const JSON_SCHEMA_CLASIFICADOR = {
  type: "object",
  properties: {
    experto: { type: "string", enum: EXPERTOS },
    accion: { type: "string", enum: ACCIONES },
    parametros: { type: "object", additionalProperties: { type: "string" } },
    confianza: { type: "number", minimum: 0, maximum: 1 },
  },
  required: ["experto", "accion", "parametros", "confianza"],
  additionalProperties: false,
} as const;

interface Respuesta { contenido: string | null; tokens: number | null; status: number }

export async function clasificarConModelo(texto: string, o: OpcionesClasificador): Promise<ResultadoClasificador> {
  const f = o.fetch ?? fetch;
  const timeoutMs = o.timeoutMs ?? 1500;
  const llamar = async (formato: unknown): Promise<Respuesta> => {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), timeoutMs);
    try {
      const r = await f(`${o.baseUrl.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${o.apiKey}` },
        body: JSON.stringify({
          model: o.model,
          messages: [{ role: "system", content: PROMPT_SISTEMA }, { role: "user", content: texto }],
          response_format: formato,
          max_tokens: 80,
          temperature: 0,
        }),
        signal: ctl.signal,
      });
      if (!r.ok) return { contenido: null, tokens: null, status: r.status };
      const j = (await r.json()) as { choices?: { message?: { content?: string } }[]; usage?: { total_tokens?: number } };
      return { contenido: j.choices?.[0]?.message?.content ?? null, tokens: j.usage?.total_tokens ?? null, status: r.status };
    } finally {
      clearTimeout(t);
    }
  };
  const fallo = (error: string, usoJsonObject: boolean, tokens: number | null = null): ResultadoClasificador =>
    ({ salida: CLASSIFIER_FALLBACK, valido: false, usoJsonObject, tokens, error });

  let usoJsonObject = false;
  try {
    let r = await llamar({ type: "json_schema", json_schema: { name: "clasificacion", strict: true, schema: JSON_SCHEMA_CLASIFICADOR } });
    if (r.status === 400) {
      o.log?.(`${o.model}: json_schema rechazado (400), reintento con json_object`);
      usoJsonObject = true;
      r = await llamar({ type: "json_object" });
    }
    if (r.contenido === null) return fallo(`http ${r.status}`, usoJsonObject, r.tokens);
    const limpio = r.contenido.replace(/^\s*```(?:json)?\s*|\s*```\s*$/g, "").trim();
    const p = ClassifierOutputSchema.safeParse({ ...(JSON.parse(limpio) as object), version: "0", fuente: "modelo" });
    if (!p.success) return fallo("schema invalido", usoJsonObject, r.tokens);
    return { salida: p.data, valido: true, usoJsonObject, tokens: r.tokens };
  } catch (e) {
    return fallo(e instanceof Error && e.name === "AbortError" ? "timeout" : "error de red o JSON roto", usoJsonObject);
  }
}
