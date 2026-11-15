import { useMemo, useState } from "react";
import type { Equipment, GameState, Resource } from "@solar-shield/contracts";
import { costoDe, puedeAplicar } from "@solar-shield/engine";
import { MISION_JEZERO } from "@solar-shield/missions";
import { useT } from "../i18n.js";
import { EscenaBase } from "../escena/EscenaBase.js";
import { hayGraficos3D, prefiereMenosMovimiento } from "../escena/soporte.js";
import { vistaEscena } from "../escena/vista.js";
import { cargarAjustes } from "../juego/ajustes.js";
import type { EventoFeedback } from "../juego/eventos.js";
import { ExpertPortrait } from "../componentes/base/ExpertPortrait.js";
import { FacetButton } from "../componentes/base/FacetButton.js";
import { Icono } from "../componentes/base/Iconos.js";
import { CostRow, ICONO_RECURSO, Mensaje, RECURSOS } from "../componentes/base/Piezas.js";
import "../componentes/base/facetas.css";
import "./modulos.css";

/**
 * E5, paso 4 (ESCENAS §2.7, fila "E5 a E7"; MECANICAS §3.2). La base de Jezero (`EscenaBase`) va
 * detrás, como la consola de `mundo/01`; sin WebGL queda un respaldo 2D con el módulo elegido en
 * cian. Encima, la lista de módulos con la familia de `ui/03` y, a la derecha, el panel de decisión
 * (panel 02 de `ui/04`): nombre, `Costs now` / `Later` y la
 * acción principal. Costo y beneficio salen de `costoDe` (motor + misión); si el motor no deja
 * colocar, `puedeAplicar` da el motivo escrito. El reductor vuelve a comprobar antes de marcar
 * un módulo como colocado. Reemplaza a `ColocarModulos.tsx` (FLUJO §2.3).
 */

const mision = MISION_JEZERO;
const SIN_EVENTOS: readonly EventoFeedback[] = [];
const sinEfecto = () => undefined;
/** Quién aconseja cada módulo (sin mapeo en agents/): el escudo es protección de la tripulación; el resto, la Ingeniera. */
const expertaDe = (m: Equipment) => (m === "escudo" ? "doctora" : "ingeniera") as "doctora" | "ingeniera";
const accionDe = (modulo: Equipment) => ({ tipo: "colocar_modulo", modulo }) as const;

/** Icono del recurso que más sube el módulo, leído de su beneficio (sin dibujos inventados). */
function iconoDe(modulo: Equipment) {
  const { retrasado } = costoDe(accionDe(modulo), mision);
  let mejor: Resource = "energia";
  for (const r of RECURSOS) if ((retrasado[r] ?? 0) > (retrasado[mejor] ?? 0)) mejor = r;
  return ICONO_RECURSO[mejor];
}

export function PantallaModulos({ estado, colocados, onColocar, onListo }: {
  estado: GameState;
  colocados: Equipment[];
  onColocar: (m: Equipment) => void;
  onListo: () => void;
}) {
  const { t } = useT();
  const total = mision.modulosAColocar;
  const faltan = total - colocados.length;
  const [elegido, setElegido] = useState<Equipment>(mision.modulosDisponibles[0]!);
  const [ultimo, setUltimo] = useState<Equipment | null>(null);

  const [sinGl, setSinGl] = useState(() => !hayGraficos3D());
  const [ajustes] = useState(() => cargarAjustes(typeof localStorage === "undefined" ? undefined : localStorage,
    { prefiereMovimientoReducido: prefiereMenosMovimiento() }));
  const [abierto, setAbierto] = useState(true);
  const puesto = colocados.includes(elegido);
  // La escena no tiene prop de resaltado (issue para Daniel): el módulo elegido y aún sin colocar
  // se ve como "instalando" (andamio teal) en su anclaje; cuando exista la prop, se reemplaza.
  const vista = useMemo(() => vistaEscena(estado, { fase: "modulos", colocados, instalando: puesto || !abierto ? null : elegido }),
    [estado, colocados, elegido, puesto, abierto]);
  const { inmediato, retrasado } = costoDe(accionDe(elegido), mision);
  const permiso = puedeAplicar(estado, accionDe(elegido), mision);
  const motivoKey = permiso.ok ? undefined
    : faltan <= 0 ? "ui.paso.4.motivo.lleno"
      : `ui.comun.motivo.${permiso.motivo}${permiso.recurso ? `.${permiso.recurso}` : ""}`;

  function colocar() {
    onColocar(elegido);
    setUltimo(elegido);
    setAbierto(true);
    // Pasa al siguiente módulo libre para que la próxima decisión ya muestre su costo.
    const quedan = faltan - 1;
    const siguiente = mision.modulosDisponibles.find((m) => m !== elegido && !colocados.includes(m));
    if (quedan > 0 && siguiente) setElegido(siguiente);
  }

  return (
    <section className="modulos-e5" aria-labelledby="modulos-titulo">
      <div className="modulos-mundo" data-escena="modulos" aria-hidden="true">
        {sinGl ? (
          <span className="modulos-mundo-2d" />
        ) : (
          <EscenaBase vista={vista} eventos={SIN_EVENTOS} calidad={ajustes.calidad} camara="tercera"
            movimientoReducido={ajustes.movimientoReducido} onLugarCercano={sinEfecto} onUsar={sinEfecto}
            onCalidad={sinEfecto} onWebGLPerdido={() => setSinGl(true)} />
        )}
      </div>
      <div className="modulos-izq">
        <div className="fc">
          <div className="fc-cara modulos-cabeza">
            <h2 id="modulos-titulo">{t("ui.paso.4.titulo", { n: total })}</h2>
            <p>{t("ui.paso.4.texto")}</p>
            <p className="modulos-progreso" aria-live="polite">
              {Array.from({ length: total }, (_, i) => (
                <span key={i} className={`modulos-hueco${i < colocados.length ? " modulos-hueco-lleno" : ""}`} aria-hidden="true" />
              ))}
              {t("ui.paso.4.progreso", { n: colocados.length, total })}
            </p>
          </div>
        </div>

        <ul className="modulos-lista" aria-label={t("ui.paso.4.lista")}>
          {mision.modulosDisponibles.map((m) => {
            const sel = abierto && m === elegido;
            const listo = colocados.includes(m);
            return (
              <li key={m}>
                <button type="button" className={`modulos-ficha${sel ? " modulos-ficha-sel" : ""}${listo ? " modulos-ficha-lista" : ""}`}
                  aria-pressed={sel} onClick={() => { setElegido(m); setAbierto(true); }}>
                  <span className="fc">
                    <span className="fc-cara fc-chico modulos-ficha-cara">
                      <Icono nombre={iconoDe(m)} tam={30} />
                      <span className="modulos-ficha-nombre">{t(`ui.paso.4.modulo.${m}`)}</span>
                      {listo && <span className="modulos-ficha-estado"><Icono nombre="check_exito" tam={18} />{t("ui.paso.4.colocado")}</span>}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {sinGl && abierto && <span className="modulos-ancla" aria-hidden="true"><Icono nombre={iconoDe(elegido)} tam={48} /></span>}

        <div className="modulos-base">
          <FacetButton variant="primary" icon="jugar" labelKey="ui.paso.4.listo" className="modulos-listo"
            disabled={faltan > 0} disabledReasonKey="ui.paso.4.motivo.faltan" onClick={onListo} />
        </div>
      </div>

      <aside className="fc modulos-panel" aria-labelledby="modulos-panel-titulo">
        <div className="fc-cara modulos-panel-cara">
          {!abierto ? (
            <>
              <h3 id="modulos-panel-titulo">{t("ui.paso.4.titulo", { n: total })}</h3>
              <p className="modulos-panel-desc">{t("ui.paso.4.elige")}</p>
            </>
          ) : (<>
          <header className="modulos-panel-cab">
            <ExpertPortrait persona={expertaDe(elegido)} compacto />
            <h3 id="modulos-panel-titulo">{t(`ui.paso.4.modulo.${elegido}`)}</h3>
            <span className="modulos-experta">{t(`ui.comun.retrato.${expertaDe(elegido)}.nombre`)}</span>
          </header>
          <div className="modulos-panel-cuerpo">
          <p className="modulos-panel-desc">{t(`agentes.iris.sistema.${elegido}`)}</p>
          <CostRow inmediato={inmediato} retrasado={retrasado} />
          {ultimo && colocados.includes(ultimo) && (
            <Mensaje tipo="exito" tituloKey="ui.paso.4.puesto" detalleKey="ui.comun.pendiente.titulo"
              vars={{ moduloKey: `ui.paso.4.modulo.${ultimo}` }} />
          )}
          </div>
          <div className="modulos-acciones">
            <FacetButton variant="primary" icon="check" className="modulos-colocar"
              labelKey={puesto ? "ui.paso.4.colocado" : "ui.paso.4.colocar"} selected={puesto || undefined}
              disabled={!puesto && !permiso.ok} disabledReasonKey={motivoKey}
              onClick={() => { if (!puesto) colocar(); }} />
            <FacetButton labelKey="ui.comun.atras" onClick={() => setAbierto(false)} />
          </div>
          </>)}
          {/* "Ask another expert" (ui/04) queda pendiente: no hay flujo para cambiar de experta en esta fase. */}
        </div>
      </aside>
    </section>
  );
}
