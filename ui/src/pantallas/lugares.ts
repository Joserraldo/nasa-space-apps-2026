import type { Entrada } from "@solar-shield/agents";
import type { BaseAction, GameState } from "@solar-shield/contracts";
import { telemetriaPendiente, tormentaActiva } from "@solar-shield/engine";
import type { NombreIcono } from "../componentes/base/Iconos.js";
import type { LugarObjetivo } from "../escena/vista.js";

/**
 * Qué hace "usar" cada lugar de la base (tecla E, botón de acción táctil o la escena), según la tabla
 * de ESCENAS §3.2. Puro: no aplica nada. Si hay acción, la pantalla abre el único `ConfirmarAccion`;
 * si hay experta, abre su consulta. Acercarse a un lugar nunca cobra (MECANICAS §5).
 */
export interface UsoLugar {
  /** Plan que se abre en `ConfirmarAccion`; el motor decide si se puede y cuánto cuesta. */
  accion: BaseAction | null;
  /** Consulta que se abre junto al plan, o sola si el lugar no tiene acción. */
  consulta: Entrada | null;
  /** Texto del aviso `[E]` (completo) y del botón táctil (verbo corto, la lámina dice "Inspect"). */
  labelKey: string;
  icono: NombreIcono;
}

export function usoDelLugar(l: LugarObjetivo, estado: GameState): UsoLugar {
  switch (l) {
    case "mesa": {
      // La consola de enlace: con la tormenta encima envía la telemetría; si no, se espera un turno.
      const tele = tormentaActiva(estado) && !telemetriaPendiente(estado);
      return tele
        ? { accion: { tipo: "enviar_telemetria" }, consulta: null, labelKey: "ui.hud.usar.mesa_telemetria", icono: "satelite" }
        : { accion: { tipo: "esperar" }, consulta: null, labelKey: "ui.hud.usar.mesa", icono: "reloj" };
    }
    case "habitat":
      return { accion: { tipo: "refugiarse" }, consulta: { experto: "doctora" }, labelKey: "ui.hud.usar.habitat", icono: "vida" };
    case "taller":
      return estado.iaBase === "danada"
        ? { accion: { tipo: "reparar", equipo: "ia_base" }, consulta: { experto: "ingeniera" }, labelKey: "ui.hud.usar.taller_reparar", icono: "llave" }
        : { accion: null, consulta: { experto: "ingeniera" }, labelKey: "ui.hud.usar.taller", icono: "tripulacion" };
    case "escudo":
      return { accion: { tipo: "subir_escudo", nivel: 1 }, consulta: null, labelKey: "ui.hud.usar.escudo", icono: "escudo" };
    case "panel_solar":
      return { accion: { tipo: "salida_exterior", objetivo: "panel_solar" }, consulta: null, labelKey: "ui.hud.usar.panel_solar", icono: "llave" };
    case "sensor":
      return { accion: null, consulta: { experto: "meteorologa" }, labelKey: "ui.hud.usar.sensor", icono: "sol" };
    default:
      // Sin acción ni experta (reciclador, invernadero, antena, banco): Iris, la guía, cuenta qué es.
      return { accion: null, consulta: { experto: "ia_base" }, labelKey: "ui.hud.usar.iris", icono: "planeta" };
  }
}

/** El mundo no se mueve ni se "usa" mientras haya algo abierto encima o se esté escribiendo. */
export function mundoBloqueado(abierto: {
  dialogo: boolean; plan: boolean; registro: boolean; panel: boolean; novedad: boolean; campo: boolean;
}): boolean {
  return abierto.dialogo || abierto.plan || abierto.registro || abierto.panel || abierto.novedad || abierto.campo;
}
