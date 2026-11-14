/**
 * Login opcional y progreso guardado (decisión de Santiago, 14 nov).
 * - El invitado no toca esta API: su progreso vive solo en el navegador y se pierde al salir.
 * - Datos mínimos (niños de 7–12): nombre de usuario sin correo; contraseña con PBKDF2-SHA256 y sal.
 * - Sesión opaca: token aleatorio en cookie HttpOnly + Secure + SameSite=Lax; en D1 solo su hash.
 *   Se eligió sobre JWT porque se puede revocar (logout real) sin listas negras ni claves de firma.
 * - Protección CSRF: cookie SameSite=Lax + las rutas que cambian datos exigen JSON y el mismo Origin.
 */

/** Lo mínimo de D1 que se usa (así las pruebas pueden darle una base SQLite real). */
export interface D1Like {
  prepare(sql: string): {
    bind(...valores: unknown[]): {
      first<T = Record<string, unknown>>(): Promise<T | null>;
      run(): Promise<unknown>;
    };
  };
}

export interface EnvCuentas {
  DB?: D1Like;
}

export const COOKIE = "ss_sesion";
export const DIAS_SESION = 30;
export const ITERACIONES = 100_000; // máximo que permite PBKDF2 en Workers
export const MAX_INTENTOS = 10;
export const MAX_PROGRESO_BYTES = 20_000;
const USUARIO_VALIDO = /^[a-z0-9_]{3,20}$/i;

const enc = new TextEncoder();

const json = (cuerpo: unknown, status = 200, extra: Record<string, string> = {}): Response =>
  new Response(JSON.stringify(cuerpo), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...extra },
  });

function b64url(bytes: ArrayBuffer | Uint8Array): string {
  const u = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (const b of u) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function aleatorio(n: number): Uint8Array {
  const u = new Uint8Array(n);
  crypto.getRandomValues(u);
  return u;
}

async function sha256(texto: string): Promise<string> {
  return b64url(await crypto.subtle.digest("SHA-256", enc.encode(texto)));
}

async function derivar(clave: string, sal: string, iteraciones: number): Promise<string> {
  const base = await crypto.subtle.importKey("raw", enc.encode(clave), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: enc.encode(sal), iterations: iteraciones },
    base,
    256,
  );
  return b64url(bits);
}

/** Comparación en tiempo constante para no filtrar información por la duración. */
function iguales(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

function leerCookie(req: Request, nombre: string): string | null {
  const c = req.headers.get("cookie") ?? "";
  for (const parte of c.split(";")) {
    const [k, ...v] = parte.trim().split("=");
    if (k === nombre) return v.join("=") || null;
  }
  return null;
}

function cookieSesion(token: string, maxAge: number): string {
  return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

/** Rechaza peticiones que cambian datos si no son JSON o vienen de otro sitio (CSRF). */
function origenValido(req: Request): boolean {
  const tipo = req.headers.get("content-type") ?? "";
  if (!tipo.toLowerCase().startsWith("application/json")) return false;
  const origen = req.headers.get("origin");
  if (!origen) return true; // peticiones del mismo sitio sin Origin (algunos navegadores en GET/POST same-origin)
  try {
    return new URL(origen).host === new URL(req.url).host;
  } catch {
    return false;
  }
}

async function leerJson(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const v = await req.json();
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function credenciales(cuerpo: Record<string, unknown> | null): { usuario: string; clave: string } | null {
  const usuario = cuerpo?.usuario;
  const clave = cuerpo?.clave;
  if (typeof usuario !== "string" || !USUARIO_VALIDO.test(usuario)) return null;
  if (typeof clave !== "string" || clave.length < 8 || clave.length > 72) return null;
  return { usuario: usuario.toLowerCase(), clave };
}

async function abrirSesion(db: D1Like, usuarioId: string, usuario: string, status = 200): Promise<Response> {
  const token = b64url(aleatorio(32));
  const expira = new Date(Date.now() + DIAS_SESION * 86_400_000).toISOString();
  await db.prepare("INSERT INTO sesiones (token_hash, usuario_id, expira) VALUES (?, ?, ?)").bind(await sha256(token), usuarioId, expira).run();
  return json({ usuario }, status, { "set-cookie": cookieSesion(token, DIAS_SESION * 86_400) });
}

/** Usuario de la sesión de la cookie, o null si no hay sesión válida. */
async function sesionActual(req: Request, db: D1Like): Promise<{ id: string; usuario: string } | null> {
  const token = leerCookie(req, COOKIE);
  if (!token) return null;
  const fila = await db
    .prepare(
      "SELECT u.id AS id, u.usuario AS usuario, s.expira AS expira FROM sesiones s JOIN usuarios u ON u.id = s.usuario_id WHERE s.token_hash = ?",
    )
    .bind(await sha256(token))
    .first<{ id: string; usuario: string; expira: string }>();
  if (!fila || Date.parse(fila.expira) < Date.now()) return null;
  return { id: fila.id, usuario: fila.usuario };
}

async function dentroDelLimite(db: D1Like, usuario: string): Promise<boolean> {
  const ventana = Math.floor(Date.now() / 900_000); // 15 min
  const clave = `login:${usuario}`;
  const fila = await db.prepare("SELECT n, ventana FROM intentos WHERE clave = ?").bind(clave).first<{ n: number; ventana: number }>();
  if (fila && fila.ventana === ventana && fila.n >= MAX_INTENTOS) return false;
  const n = fila && fila.ventana === ventana ? fila.n + 1 : 1;
  await db
    .prepare("INSERT INTO intentos (clave, n, ventana) VALUES (?, ?, ?) ON CONFLICT(clave) DO UPDATE SET n = excluded.n, ventana = excluded.ventana")
    .bind(clave, n, ventana)
    .run();
  return true;
}

/** Rutas /api/auth/* y /api/progress. Devuelve null si la ruta no es de este módulo. */
export async function cuentas(req: Request, env: EnvCuentas, ruta: string): Promise<Response | null> {
  if (!ruta.startsWith("/api/auth/") && ruta !== "/api/progress") return null;
  const db = env.DB;
  if (!db) return json({ error: "sin_base_de_datos" }, 503);
  const cambia = req.method !== "GET";
  if (cambia && !origenValido(req)) return json({ error: "origen" }, 403);

  if (ruta === "/api/auth/register" && req.method === "POST") {
    const c = credenciales(await leerJson(req));
    if (!c) return json({ error: "datos", detalle: "usuario: 3–20 letras, números o _; clave: 8–72 caracteres" }, 400);
    const existe = await db.prepare("SELECT id FROM usuarios WHERE usuario = ?").bind(c.usuario).first();
    if (existe) return json({ error: "usuario_ocupado" }, 409);
    const id = crypto.randomUUID();
    const sal = b64url(aleatorio(16));
    const hash = await derivar(c.clave, sal, ITERACIONES);
    await db
      .prepare("INSERT INTO usuarios (id, usuario, clave_hash, clave_sal, iteraciones) VALUES (?, ?, ?, ?, ?)")
      .bind(id, c.usuario, hash, sal, ITERACIONES)
      .run();
    return abrirSesion(db, id, c.usuario, 201);
  }

  if (ruta === "/api/auth/login" && req.method === "POST") {
    const c = credenciales(await leerJson(req));
    if (!c) return json({ error: "credenciales" }, 401);
    if (!(await dentroDelLimite(db, c.usuario))) return json({ error: "demasiados_intentos" }, 429);
    const u = await db
      .prepare("SELECT id, usuario, clave_hash, clave_sal, iteraciones FROM usuarios WHERE usuario = ?")
      .bind(c.usuario)
      .first<{ id: string; usuario: string; clave_hash: string; clave_sal: string; iteraciones: number }>();
    // Mismo error si el usuario no existe o la clave está mal: no se revela cuál de las dos falló.
    if (!u || !iguales(await derivar(c.clave, u.clave_sal, u.iteraciones), u.clave_hash)) return json({ error: "credenciales" }, 401);
    return abrirSesion(db, u.id, u.usuario);
  }

  if (ruta === "/api/auth/logout" && req.method === "POST") {
    const token = leerCookie(req, COOKIE);
    if (token) await db.prepare("DELETE FROM sesiones WHERE token_hash = ?").bind(await sha256(token)).run();
    return json({ ok: true }, 200, { "set-cookie": cookieSesion("", 0) });
  }

  if (ruta === "/api/auth/me" && req.method === "GET") {
    const s = await sesionActual(req, db);
    return s ? json({ usuario: s.usuario }) : json({ error: "sin_sesion" }, 401);
  }

  if (ruta === "/api/progress") {
    const s = await sesionActual(req, db);
    if (!s) return json({ error: "sin_sesion" }, 401);
    if (req.method === "GET") {
      const fila = await db.prepare("SELECT datos, actualizado FROM progreso WHERE usuario_id = ?").bind(s.id).first<{ datos: string; actualizado: string }>();
      return json(fila ? { datos: JSON.parse(fila.datos), actualizado: fila.actualizado } : { datos: null });
    }
    if (req.method === "PUT") {
      const texto = await req.text();
      if (texto.length > MAX_PROGRESO_BYTES) return json({ error: "muy_grande" }, 413);
      let cuerpo: unknown;
      try {
        cuerpo = JSON.parse(texto);
      } catch {
        return json({ error: "json" }, 400);
      }
      const datos = (cuerpo as { datos?: unknown })?.datos;
      if (datos === undefined || datos === null || typeof datos !== "object") return json({ error: "datos" }, 400);
      await db
        .prepare(
          "INSERT INTO progreso (usuario_id, datos, actualizado) VALUES (?, ?, datetime('now')) ON CONFLICT(usuario_id) DO UPDATE SET datos = excluded.datos, actualizado = excluded.actualizado",
        )
        .bind(s.id, JSON.stringify(datos))
        .run();
      return json({ ok: true });
    }
  }

  return json({ error: "metodo" }, 405);
}
