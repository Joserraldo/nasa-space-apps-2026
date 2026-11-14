import { manejar as clasificar, type Env as EnvClasificar } from "./clasificar.js";
import { cuentas, type EnvCuentas } from "./cuentas.js";

/**
 * Punto de entrada del Worker: /api/* lo resuelve el código; todo lo demás es la pantalla (ui/dist).
 * Nada de lógica de juego aquí: el motor corre en el navegador.
 */
export interface Fetcher {
  fetch(req: Request): Promise<Response>;
}

export interface Env extends EnvClasificar, EnvCuentas {
  ASSETS: Fetcher;
  ENTORNO?: string;
}

const json = (cuerpo: unknown, status = 200): Response =>
  new Response(JSON.stringify(cuerpo), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

export async function enrutar(req: Request, env: Env, f: typeof fetch = fetch): Promise<Response> {
  const { pathname } = new URL(req.url);
  if (!pathname.startsWith("/api/")) return env.ASSETS.fetch(req);

  if (pathname === "/api/health") {
    // Solo dice QUÉ está configurado, nunca el valor de una clave.
    return json({ ok: true, entorno: env.ENTORNO ?? "local", modelo: Boolean(env.BAI_API_KEY), baseDeDatos: Boolean(env.DB) });
  }
  if (pathname === "/api/clasificar") return clasificar(req, env, f);
  const cuenta = await cuentas(req, env, pathname);
  if (cuenta) return cuenta;
  return json({ error: "no_encontrado" }, 404);
}

export default { fetch: (req: Request, env: Env) => enrutar(req, env) };
