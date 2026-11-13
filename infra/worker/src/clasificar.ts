import { clasificarConAtajos, clasificarConModelo } from "@solar-shield/agents";

/**
 * POST /api/clasificar  { "texto": "..." }  →  ClassifierOutput (JSON estricto, validado con Zod).
 * - La clave sale SOLO de `env.BAI_API_KEY` (secreto de Cloudflare). Nunca llega al navegador.
 * - Al modelo solo le llega la frase: ni IP, ni identificadores, ni estado del juego.
 * - Límite de uso por IP en KV con la IP en hash (no se guarda la IP en claro).
 * - Primero regex sin costo; el modelo solo si los atajos no entienden. Sin clave → respaldo.
 */
export interface KV {
  get(clave: string): Promise<string | null>;
  put(clave: string, valor: string, o?: { expirationTtl?: number }): Promise<void>;
}

export interface Env {
  BAI_API_KEY?: string;
  BAI_BASE_URL?: string;
  BAI_MODEL?: string;
  LIMITE?: KV;
}

export const MAX_CARACTERES = 200;
export const LIMITE_POR_MINUTO = 20;

const json = (cuerpo: unknown, status = 200): Response =>
  new Response(JSON.stringify(cuerpo), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

async function hashIp(ip: string): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`solar-shield:${ip}`));
  return [...new Uint8Array(d)].slice(0, 12).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function dentroDelLimite(kv: KV | undefined, ip: string | null): Promise<boolean> {
  if (!kv || !ip) return true;
  const clave = `rl:${await hashIp(ip)}:${Math.floor(Date.now() / 60000)}`;
  const n = Number((await kv.get(clave)) ?? "0");
  if (n >= LIMITE_POR_MINUTO) return false;
  await kv.put(clave, String(n + 1), { expirationTtl: 120 });
  return true;
}

export async function manejar(req: Request, env: Env, f: typeof fetch = fetch): Promise<Response> {
  if (req.method !== "POST") return json({ error: "metodo" }, 405);
  let texto: unknown;
  try {
    texto = ((await req.json()) as { texto?: unknown }).texto;
  } catch {
    return json({ error: "json" }, 400);
  }
  if (typeof texto !== "string" || texto.trim() === "" || texto.length > MAX_CARACTERES) return json({ error: "texto" }, 400);

  const atajo = clasificarConAtajos(texto);
  if (atajo) return json(atajo);

  if (!(await dentroDelLimite(env.LIMITE, req.headers.get("cf-connecting-ip")))) return json({ error: "limite" }, 429);

  if (!env.BAI_API_KEY) {
    return json({ version: "0", experto: "ia_base", accion: "fuera_de_tema", parametros: {}, confianza: 0, fuente: "regex" });
  }
  const r = await clasificarConModelo(texto, {
    baseUrl: env.BAI_BASE_URL ?? "https://api.b.ai/v1",
    apiKey: env.BAI_API_KEY,
    model: env.BAI_MODEL ?? "qwen3.8-flash",
    fetch: f,
  });
  return json(r.salida);
}

export default { fetch: (req: Request, env: Env) => manejar(req, env) };
