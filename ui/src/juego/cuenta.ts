import type { PuntajeSitio } from "@solar-shield/engine";
import type { Equipment, GameState } from "@solar-shield/contracts";
import type { Fase, Juego } from "./reductor.js";

/** Limite de carga del Worker (`/api/progress`) definido en `infra/worker/src/cuentas.ts`. */
export const PROGRESO_MAX_BYTES = 20_000;

const USUARIO_RE = /^[a-z0-9_]{3,20}$/i;
const FASES_VALIDAS: readonly Fase[] = ["inicio", "satelite", "sitio", "modulos", "base", "tormenta", "final"];
const SESION_PISTA_KEY = "ss_sesion_activa";

export interface JuegoGuardado {
  v: 1;
  fase: Fase;
  estado: GameState;
  colocados: Equipment[];
  sitio: PuntajeSitio | null;
  tormentaVista: boolean;
}

export type ResultadoAuth =
  | { ok: true; usuario: string }
  | { ok: false; errorKey: string };

export type ResultadoProgreso =
  | { ok: true; datos: Juego | null; actualizado?: string }
  | { ok: false; errorKey: string };

/** Valida nombre de usuario segun la regla del Worker (sin correo ni nombre real). */
export function esUsuarioValido(usuario: string): boolean {
  return USUARIO_RE.test(usuario.trim());
}

/** Valida longitud de clave segun la regla del Worker (8 a 72 caracteres). */
export function esClaveValida(clave: string): boolean {
  return clave.length >= 8 && clave.length <= 72;
}

/** Solo recuerda si hubo login previo en este navegador; nunca guarda tokens ni claves. */
export function tienePistaSesion(): boolean {
  try {
    return typeof localStorage !== "undefined" && localStorage.getItem(SESION_PISTA_KEY) === "1";
  } catch {
    return false;
  }
}

export function marcarPistaSesion(activa: boolean): void {
  try {
    if (typeof localStorage === "undefined") return;
    if (activa) localStorage.setItem(SESION_PISTA_KEY, "1");
    else localStorage.removeItem(SESION_PISTA_KEY);
  } catch {
    // Entornos sin almacenamiento persistente siguen operando en memoria.
  }
}

/** Empaqueta el progreso jugable cumpliendo el tope de 20 KB de `/api/progress`. */
export function serializarProgreso(j: Juego): JuegoGuardado | null {
  const recorteCausas = (causas: GameState["causas"], max: number): JuegoGuardado => ({
    v: 1,
    fase: j.fase,
    estado: max < causas.length ? { ...j.estado, causas: causas.slice(-max) } : j.estado,
    colocados: j.colocados,
    sitio: j.sitio,
    tormentaVista: j.tormentaVista,
  });

  const completo = recorteCausas(j.estado.causas, j.estado.causas.length);
  if (bytesJson({ datos: completo }) <= PROGRESO_MAX_BYTES) return completo;

  const compacto = recorteCausas(j.estado.causas, 30);
  return bytesJson({ datos: compacto }) <= PROGRESO_MAX_BYTES ? compacto : null;
}

function bytesJson(valor: unknown): number {
  return new TextEncoder().encode(JSON.stringify(valor)).length;
}

/** Valida de forma defensiva el objeto recuperado de D1 antes de aplicarlo en UI. */
export function deserializarProgreso(crudo: unknown): Juego | null {
  if (!crudo || typeof crudo !== "object" || Array.isArray(crudo)) return null;
  const d = crudo as Partial<JuegoGuardado>;
  if (d.v !== 1 || !d.fase || !FASES_VALIDAS.includes(d.fase)) return null;
  if (!d.estado || typeof d.estado !== "object") return null;
  const est = d.estado as Partial<GameState>;
  if (!est.recursos || typeof est.tick !== "number" || typeof est.resultado !== "string") return null;
  if (!Array.isArray(d.colocados)) return null;
  return {
    fase: d.fase,
    estado: d.estado,
    colocados: d.colocados,
    sitio: d.sitio ?? null,
    ultimas: null,
    tormentaVista: Boolean(d.tormentaVista),
  };
}

function mapearErrorCuenta(codigo: string | undefined, modo: "login" | "register" | "progress"): string {
  switch (codigo) {
    case "usuario_ocupado":
      return "ui.cuenta.error.ocupado";
    case "credenciales":
      return "ui.cuenta.error.credenciales";
    case "demasiados_intentos":
      return "ui.cuenta.error.intentos";
    case "datos":
      return modo === "register" ? "ui.cuenta.error.formato" : "ui.cuenta.error.credenciales";
    case "sin_base_de_datos":
    case "sin_sesion":
      return codigo === "sin_sesion" ? "ui.cuenta.error.sesion" : "ui.cuenta.error.red";
    case "muy_grande":
      return "ui.cuenta.error.tamano";
    default:
      return "ui.cuenta.error.red";
  }
}

async function pedirJson(url: string, init: RequestInit): Promise<{ ok: boolean; status: number; data: Record<string, unknown> | null }> {
  try {
    const res = await fetch(url, {
      ...init,
      credentials: "same-origin",
      headers: {
        "content-type": "application/json",
        ...(init.headers ?? {}),
      },
    });
    const tipo = res.headers.get("content-type") ?? "";
    const data = tipo.toLowerCase().includes("application/json")
      ? ((await res.json()) as Record<string, unknown>)
      : null;
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: null };
  }
}

export async function consultarSesion(): Promise<string | null> {
  if (!tienePistaSesion()) return null;
  const r = await pedirJson("/api/auth/me", { method: "GET" });
  if (r.ok && typeof r.data?.usuario === "string") return r.data.usuario;
  if (r.status === 401 || r.status === 404 || r.status === 503 || r.status === 0) marcarPistaSesion(false);
  return null;
}

export async function autenticarCuenta(modo: "login" | "register", usuario: string, clave: string): Promise<ResultadoAuth> {
  const limpio = usuario.trim().toLowerCase();
  if (!esUsuarioValido(limpio) || !esClaveValida(clave)) {
    return { ok: false, errorKey: "ui.cuenta.error.formato" };
  }
  const ruta = modo === "register" ? "/api/auth/register" : "/api/auth/login";
  const r = await pedirJson(ruta, { method: "POST", body: JSON.stringify({ usuario: limpio, clave }) });
  if (r.ok && typeof r.data?.usuario === "string") {
    marcarPistaSesion(true);
    return { ok: true, usuario: r.data.usuario };
  }
  return { ok: false, errorKey: mapearErrorCuenta(typeof r.data?.error === "string" ? r.data.error : undefined, modo) };
}

export async function cerrarSesionCuenta(): Promise<void> {
  marcarPistaSesion(false);
  await pedirJson("/api/auth/logout", { method: "POST", body: "{}" });
}

export async function leerProgresoCuenta(): Promise<ResultadoProgreso> {
  const r = await pedirJson("/api/progress", { method: "GET" });
  if (!r.ok) {
    if (r.status === 401) marcarPistaSesion(false);
    return { ok: false, errorKey: mapearErrorCuenta(typeof r.data?.error === "string" ? r.data.error : undefined, "progress") };
  }
  const juego = deserializarProgreso(r.data?.datos);
  const actualizado = typeof r.data?.actualizado === "string" ? r.data.actualizado : undefined;
  return { ok: true, datos: juego, ...(actualizado ? { actualizado } : {}) };
}

export async function guardarProgresoCuenta(j: Juego): Promise<{ ok: boolean; errorKey?: string }> {
  const payload = serializarProgreso(j);
  if (!payload) return { ok: false, errorKey: "ui.cuenta.error.tamano" };
  const r = await pedirJson("/api/progress", { method: "PUT", body: JSON.stringify({ datos: payload }) });
  if (r.ok) return { ok: true };
  if (r.status === 401) marcarPistaSesion(false);
  return { ok: false, errorKey: mapearErrorCuenta(typeof r.data?.error === "string" ? r.data.error : undefined, "progress") };
}
