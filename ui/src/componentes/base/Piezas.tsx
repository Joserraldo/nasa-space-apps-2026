import type { PendingEffect, Resource } from "@solar-shield/contracts";
import { IA } from "@solar-shield/design";
import { useT } from "../../i18n.js";
import { Icono, type NombreIcono } from "./Iconos.js";
import "./facetas.css";

/**
 * Compuestos de la interfaz (APLICACION §5): placa de recurso, fila de costo, efecto pendiente y
 * mensaje. Solo pintan lo que les pasan; los números son siempre los del motor.
 */

export const RECURSOS: readonly Resource[] = ["energia", "soporte_vital", "blindaje"];
export const ICONO_RECURSO: Record<Resource, NombreIcono> = { energia: "energia", soporte_vital: "vida", blindaje: "escudo" };
/**
 * Por debajo de esto el recurso está bajo: se dice con icono y texto, no solo con color.
 * Es el mismo umbral de peligro que usa el motor (design/ia.ts), para que la placa y Iris coincidan.
 */
export const UMBRAL_BAJO = IA.umbralPeligro;

const signo = (n: number) => (n > 0 ? `+${n}` : `${n}`);

export interface ResourcePlaqueProps {
  recurso: Resource;
  /** Valor real del motor, siempre. */
  value: number;
  /** De `estado.efectosPendientes`; aquí solo se muestran los de este recurso que no estén ocultos. */
  pending?: readonly PendingEffect[];
  /** Cambios recientes con su causa (de `novedades()`): se anuncian una vez por grupo. */
  feedback?: readonly { id: string; delta: number; causaKey: string }[];
}

export function ResourcePlaque({ recurso, value, pending = [], feedback = [] }: ResourcePlaqueProps) {
  const { t } = useT();
  const v = Math.round(value);
  const nombre = t(`ui.recurso.${recurso}`);
  const llegando = pending.filter((p) => p.recurso === recurso && !p.oculto).reduce((s, p) => s + p.delta, 0);
  const bajo = v < UMBRAL_BAJO;
  return (
    <div className="fc">
      <div className="fc-cara placa" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={v} aria-label={nombre}
        aria-valuetext={bajo ? t("ui.comun.recurso.valor_bajo", { valor: v }) : String(v)}>
        <Icono nombre={ICONO_RECURSO[recurso]} tam={30} />
        <span className="placa-texto"><span className="placa-nombre">{nombre}</span><span className="placa-valor">{v}</span></span>
        <span className="placa-capa" aria-live="polite">
          {bajo && <span className="placa-bajo"><Icono nombre="aviso" tam={16} />{t("ui.comun.recurso.bajo")}</span>}
          {feedback.map((f) => (
            <span key={f.id} className={`placa-delta delta ${f.delta < 0 ? "delta-menos" : "delta-mas"}`}>{signo(f.delta)} {t(f.causaKey)}</span>
          ))}
          {llegando !== 0 && <span>{t("ui.comun.recurso.llegando", { delta: signo(llegando) })}</span>}
        </span>
      </div>
    </div>
  );
}

function Lista({ d }: { d: Partial<Record<Resource, number>> }) {
  const { t } = useT();
  const filas = RECURSOS.filter((r) => d[r]);
  if (filas.length === 0) return <p>{t("ui.comun.costo.nada")}</p>;
  return (
    <ul>
      {filas.map((r) => (
        <li key={r}>
          <Icono nombre={ICONO_RECURSO[r]} tam={20} />
          <span>{t(`ui.recurso.${r}`)}</span>
          <span className={`delta ${d[r]! < 0 ? "delta-menos" : "delta-mas"}`}>{signo(d[r]!)}</span>
        </li>
      ))}
    </ul>
  );
}

/** Costo inmediato y efecto posterior en bloques separados (DISEÑO §5.1). */
export function CostRow({ inmediato, retrasado }: { inmediato: Partial<Record<Resource, number>>; retrasado: Partial<Record<Resource, number>> }) {
  const { t } = useT();
  return (
    <div className="costos">
      <section className="costos-bloque"><h4>{t("ui.comun.costo.ahora")}</h4><Lista d={inmediato} /></section>
      <section className="costos-bloque"><h4>{t("ui.comun.costo.despues")}</h4><Lista d={retrasado} /></section>
    </div>
  );
}

export type TipoMensaje = "exito" | "aviso" | "error" | "pendiente";
const ICONO_MENSAJE: Record<TipoMensaje, NombreIcono> = { exito: "check_exito", aviso: "aviso", error: "error", pendiente: "reloj" };

/** Mensaje de estado: siempre icono y texto, nunca solo color. No es un botón. */
export function Mensaje({ tipo, tituloKey, detalleKey, vars }: { tipo: TipoMensaje; tituloKey: string; detalleKey?: string; vars?: Record<string, string | number> }) {
  const { t } = useT();
  return (
    <div className="fc">
      <div className={`fc-cara fc-chico mensaje mensaje-${tipo}`} role={tipo === "error" ? "alert" : "status"}>
        <Icono nombre={ICONO_MENSAJE[tipo]} tam={28} />
        <span className="oculto-visual">{t(`ui.comun.mensaje.${tipo}`)}</span>
        <span className="mensaje-titulo">{t(tituloKey, vars)}</span>
        {detalleKey && <span className="mensaje-detalle">{t(detalleKey, vars)}</span>}
      </div>
    </div>
  );
}

/** Un efecto en camino: reloj fijo y turnos que faltan (no gira ni cuenta segundos). Los ocultos no dicen qué traen. */
export function EfectoPendiente({ efecto, tick }: { efecto: PendingEffect; tick: number }) {
  const { t } = useT();
  const turnos = Math.max(0, efecto.aplicaEnTick - tick);
  return efecto.oculto
    ? <Mensaje tipo="pendiente" tituloKey="ui.comun.pendiente.oculto" detalleKey="ui.comun.pendiente.turnos" vars={{ n: turnos }} />
    : <Mensaje tipo="pendiente" tituloKey="ui.comun.pendiente.titulo" detalleKey="ui.comun.pendiente.detalle"
        vars={{ delta: signo(efecto.delta), recursoKey: `ui.recurso.${efecto.recurso}`, n: turnos }} />;
}
