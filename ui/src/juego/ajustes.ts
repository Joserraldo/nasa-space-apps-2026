import type { Idioma } from "../i18n";

/**
 * Contrato de ajustes del jugador (FLUJO §3). Lo define integración (José); lo
 * consume la interfaz (Jaime) para el panel de ajustes, y la escena lee `calidad`.
 *
 * Se guardan en `localStorage` del navegador, nunca en un servidor: no hay datos
 * personales. Si el almacenamiento falla (modo privado, bloqueado) se usan los
 * valores por defecto y el juego sigue.
 */
export type CalidadGrafica = "alta" | "media" | "baja";
/** Cámara del mundo: tercera persona (detrás del niño) o primera (sus ojos). Igual que `CamaraEscena`. */
export type CamaraJugador = "tercera" | "primera";

export interface AjustesJugador {
  idioma: Idioma;
  sonido: boolean;
  movimientoReducido: boolean;
  calidad: CalidadGrafica;
  /** Cámara elegida en el menú o con `V` (#372). Cambiarla no toca la partida. */
  camara: CamaraJugador;
}

export const CLAVE_AJUSTES = "solar-shield.ajustes.v2";
const CLAVE_AJUSTES_ANTERIOR = "solar-shield.ajustes.v1";

/** Lo que el navegador dice del jugador; se pasa desde afuera para poder probarlo. */
export interface EntornoNavegador {
  idiomaNavegador?: string;
  prefiereMovimientoReducido?: boolean;
}

type Almacen = Pick<Storage, "getItem" | "setItem">;

/** Inglés es la base: solo arranca en español si el navegador lo pide. Calidad alta por defecto en computador. */
export function ajustesPorDefecto(entorno: EntornoNavegador = {}): AjustesJugador {
  return {
    idioma: entorno.idiomaNavegador?.toLowerCase().startsWith("es") ? "es" : "en",
    sonido: true,
    movimientoReducido: entorno.prefiereMovimientoReducido ?? false,
    calidad: "alta",
    camara: "tercera",
  };
}

export function cargarAjustes(almacen: Almacen | undefined, entorno: EntornoNavegador = {}): AjustesJugador {
  const base = ajustesPorDefecto(entorno);
  try {
    const crudo = almacen?.getItem(CLAVE_AJUSTES);
    if (crudo) return validar(JSON.parse(crudo), base);
    // Conserva "baja" explícita de v1 (p. ej. E2E sin GPU en CI o equipos lentos); "media" hereda "alta".
    const previo = almacen?.getItem(CLAVE_AJUSTES_ANTERIOR);
    if (!previo) return base;
    const dato = JSON.parse(previo) as { calidad?: unknown } | null;
    const v1 = validar(dato, base);
    return dato?.calidad === "baja" ? v1 : { ...v1, calidad: base.calidad };
  } catch {
    return base;
  }
}

export function guardarAjustes(almacen: Almacen | undefined, ajustes: AjustesJugador): void {
  try {
    almacen?.setItem(CLAVE_AJUSTES, JSON.stringify(ajustes));
  } catch {
    // Sin almacenamiento los ajustes duran solo esta partida.
  }
}

/** Toma solo los campos válidos; lo demás queda en su valor por defecto. */
function validar(dato: unknown, base: AjustesJugador): AjustesJugador {
  if (typeof dato !== "object" || dato === null) return base;
  const d = dato as Partial<Record<keyof AjustesJugador, unknown>>;
  return {
    idioma: d.idioma === "en" || d.idioma === "es" ? d.idioma : base.idioma,
    sonido: typeof d.sonido === "boolean" ? d.sonido : base.sonido,
    movimientoReducido: typeof d.movimientoReducido === "boolean" ? d.movimientoReducido : base.movimientoReducido,
    calidad: d.calidad === "alta" || d.calidad === "media" || d.calidad === "baja" ? d.calidad : base.calidad,
    camara: d.camara === "tercera" || d.camara === "primera" ? d.camara : base.camara,
  };
}
