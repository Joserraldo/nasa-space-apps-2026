import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import type { DatabaseSync as TipoDatabaseSync } from "node:sqlite";
import { beforeEach, describe, expect, it } from "vitest";
import { COOKIE, MAX_INTENTOS, type D1Like } from "./cuentas.js";
import { enrutar, type Env } from "./index.js";

// vitest no resuelve "node:sqlite" como import; se carga con require (es parte de Node 22).
const { DatabaseSync } = createRequire(import.meta.url)("node:sqlite") as { DatabaseSync: typeof TipoDatabaseSync };

/** D1 de mentira sobre SQLite real, con la migración de verdad. */
function baseDePrueba(): D1Like {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec(readFileSync(new URL("../migrations/0001_usuarios_sesiones_progreso.sql", import.meta.url), "utf8"));
  return {
    prepare(sql: string) {
      return {
        bind(...v: unknown[]) {
          const st = db.prepare(sql);
          const args = v as (string | number | null)[];
          return {
            first: async <T,>() => (st.get(...args) as T | undefined) ?? null,
            run: async () => st.run(...args),
          };
        },
      };
    },
  };
}

const BASE = "https://juego.dev";
const pantalla = { fetch: async () => new Response("ui") };
let env: Env;

function pedir(ruta: string, o: { metodo?: string; cuerpo?: unknown; cookie?: string; origen?: string; tipo?: string } = {}) {
  const headers: Record<string, string> = {};
  if (o.cuerpo !== undefined) headers["content-type"] = o.tipo ?? "application/json";
  if (o.cookie) headers.cookie = o.cookie;
  if (o.origen) headers.origin = o.origen;
  return enrutar(
    new Request(BASE + ruta, {
      method: o.metodo ?? (o.cuerpo !== undefined ? "POST" : "GET"),
      headers,
      body: o.cuerpo === undefined ? null : typeof o.cuerpo === "string" ? o.cuerpo : JSON.stringify(o.cuerpo),
    }),
    env,
  );
}

function cookieDe(r: Response): string {
  const set = r.headers.get("set-cookie") ?? "";
  return set.split(";")[0]!;
}

beforeEach(() => {
  env = { ASSETS: pantalla, ENTORNO: "local", DB: baseDePrueba() };
});

describe("cuentas: registro, login, sesión y progreso", () => {
  it("registra, guarda progreso y lo recupera después de volver a entrar", async () => {
    const reg = await pedir("/api/auth/register", { cuerpo: { usuario: "Astro_7", clave: "marte-2026" } });
    expect(reg.status).toBe(201);
    expect(await reg.json()).toEqual({ usuario: "astro_7" });
    const set = reg.headers.get("set-cookie")!;
    expect(set).toContain("HttpOnly");
    expect(set).toContain("Secure");
    expect(set).toContain("SameSite=Lax");

    const guardar = await pedir("/api/progress", { metodo: "PUT", cuerpo: { datos: { rango: "piloto", misiones: ["jezero"] } }, cookie: cookieDe(reg) });
    expect(guardar.status).toBe(200);

    await pedir("/api/auth/logout", { cuerpo: {}, cookie: cookieDe(reg) });
    expect((await pedir("/api/progress", { cookie: cookieDe(reg) })).status).toBe(401); // la sesión vieja ya no sirve

    const login = await pedir("/api/auth/login", { cuerpo: { usuario: "astro_7", clave: "marte-2026" } });
    expect(login.status).toBe(200);
    const recuperado = await (await pedir("/api/progress", { cookie: cookieDe(login) })).json();
    expect(recuperado.datos).toEqual({ rango: "piloto", misiones: ["jezero"] });
    expect((await (await pedir("/api/auth/me", { cookie: cookieDe(login) })).json()).usuario).toBe("astro_7");
  });

  it("no guarda la contraseña en claro y no deja repetir el usuario", async () => {
    await pedir("/api/auth/register", { cuerpo: { usuario: "luna", clave: "clave-secreta-1" } });
    const otra = await pedir("/api/auth/register", { cuerpo: { usuario: "LUNA", clave: "otra-clave-22" } });
    expect(otra.status).toBe(409);
    const fila = await env.DB!.prepare("SELECT * FROM usuarios WHERE usuario = ?").bind("luna").first<Record<string, unknown>>();
    expect(JSON.stringify(fila)).not.toContain("clave-secreta-1");
    expect(Object.keys(fila!)).not.toContain("correo");
  });

  it("login con clave mala y con usuario inexistente dan el mismo error", async () => {
    await pedir("/api/auth/register", { cuerpo: { usuario: "rover", clave: "perseverance" } });
    const mala = await pedir("/api/auth/login", { cuerpo: { usuario: "rover", clave: "equivocada" } });
    const nadie = await pedir("/api/auth/login", { cuerpo: { usuario: "nadie", clave: "equivocada" } });
    expect(mala.status).toBe(401);
    expect(await mala.json()).toEqual(await nadie.json());
  });

  it("limita los intentos de login", async () => {
    await pedir("/api/auth/register", { cuerpo: { usuario: "iris", clave: "correcta-123" } });
    for (let i = 0; i < MAX_INTENTOS; i++) await pedir("/api/auth/login", { cuerpo: { usuario: "iris", clave: "mal-mal-mal" } });
    const bloqueado = await pedir("/api/auth/login", { cuerpo: { usuario: "iris", clave: "correcta-123" } });
    expect(bloqueado.status).toBe(429);
  });

  it("rechaza cambios desde otro sitio o sin JSON (CSRF)", async () => {
    const otroSitio = await pedir("/api/auth/register", { cuerpo: { usuario: "malo", clave: "12345678" }, origen: "https://evil.example" });
    expect(otroSitio.status).toBe(403);
    const formulario = await pedir("/api/auth/register", { cuerpo: "usuario=x&clave=y", tipo: "application/x-www-form-urlencoded" });
    expect(formulario.status).toBe(403);
  });

  it("sin sesión no hay progreso, y valida tamaño y forma", async () => {
    expect((await pedir("/api/progress")).status).toBe(401);
    const reg = await pedir("/api/auth/register", { cuerpo: { usuario: "cadete", clave: "abcdefgh" } });
    const grande = await pedir("/api/progress", { metodo: "PUT", cuerpo: { datos: { x: "a".repeat(25_000) } }, cookie: cookieDe(reg) });
    expect(grande.status).toBe(413);
    const malo = await pedir("/api/progress", { metodo: "PUT", cuerpo: { datos: 5 }, cookie: cookieDe(reg) });
    expect(malo.status).toBe(400);
  });

  it("valida el nombre de usuario y la clave al registrarse", async () => {
    expect((await pedir("/api/auth/register", { cuerpo: { usuario: "a", clave: "12345678" } })).status).toBe(400);
    expect((await pedir("/api/auth/register", { cuerpo: { usuario: "bien", clave: "corta" } })).status).toBe(400);
    expect((await pedir("/api/auth/register", { cuerpo: { usuario: "con espacio", clave: "12345678" } })).status).toBe(400);
  });

  it("sin base de datos responde 503 en vez de romperse", async () => {
    env = { ASSETS: pantalla };
    expect((await pedir("/api/auth/me")).status).toBe(503);
  });

  it("la cookie se llama como se documenta", () => {
    expect(COOKIE).toBe("ss_sesion");
  });
});
