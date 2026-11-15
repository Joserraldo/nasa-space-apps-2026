import { useState } from "react";
import type { Equipment, GameState, Resource } from "@solar-shield/contracts";
import { costoDe, puedeAplicar } from "@solar-shield/engine";
import { MISION_JEZERO } from "@solar-shield/missions";
import { useT } from "../i18n.js";
import { FacetButton } from "../componentes/base/FacetButton.js";
import { Icono } from "../componentes/base/Iconos.js";
import { CostRow, ICONO_RECURSO, Mensaje, RECURSOS } from "../componentes/base/Piezas.js";
import "../componentes/base/facetas.css";
import "./modulos.css";

/**
 * E5, paso 4 (ESCENAS §2.7, fila "E5 a E7"; MECANICAS §3.2). Lista de módulos con la familia de
 * `ui/03` y, a la derecha, el panel de decisión de `ui/01`: nombre, `Costs now` / `Later` y la
 * acción principal. Costo y beneficio salen de `costoDe` (motor + misión); si el motor no deja
 * colocar, `puedeAplicar` da el motivo escrito. El reductor vuelve a comprobar antes de marcar
 * un módulo como colocado. Reemplaza a `ColocarModulos.tsx` (FLUJO §2.3).
 */

const mision = MISION_JEZERO;
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

  const puesto = colocados.includes(elegido);
  const { inmediato, retrasado } = costoDe(accionDe(elegido), mision);
  const permiso = puedeAplicar(estado, accionDe(elegido), mision);
  const motivoKey = permiso.ok ? undefined
    : faltan <= 0 ? "ui.paso.4.motivo.lleno"
      : `ui.comun.motivo.${permiso.motivo}${permiso.recurso ? `.${permiso.recurso}` : ""}`;

  function colocar() {
    onColocar(elegido);
    setUltimo(elegido);
    // Pasa al siguiente módulo libre para que la próxima decisión ya muestre su costo.
    const quedan = faltan - 1;
    const siguiente = mision.modulosDisponibles.find((m) => m !== elegido && !colocados.includes(m));
    if (quedan > 0 && siguiente) setElegido(siguiente);
  }

  return (
    <section className="modulos-e5" aria-labelledby="modulos-titulo">
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
            const sel = m === elegido;
            const listo = colocados.includes(m);
            return (
              <li key={m}>
                <button type="button" className={`modulos-ficha${sel ? " modulos-ficha-sel" : ""}${listo ? " modulos-ficha-lista" : ""}`}
                  aria-pressed={sel} onClick={() => setElegido(m)}>
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

        <FacetButton variant="primary" icon="jugar" labelKey="ui.paso.4.listo" className="modulos-listo"
          disabled={faltan > 0} disabledReasonKey="ui.paso.4.motivo.faltan" onClick={onListo} />
      </div>

      <aside className="fc modulos-panel" aria-labelledby="modulos-panel-titulo">
        <div className="fc-cara modulos-panel-cara">
          <header className="modulos-panel-cab">
            <span className="modulos-panel-icono" aria-hidden="true"><Icono nombre={iconoDe(elegido)} tam={40} /></span>
            <h3 id="modulos-panel-titulo">{t(`ui.paso.4.modulo.${elegido}`)}</h3>
          </header>
          <p className="modulos-panel-desc">{t(`agentes.iris.sistema.${elegido}`)}</p>
          <CostRow inmediato={inmediato} retrasado={retrasado} />
          <FacetButton variant="primary" icon="check" className="modulos-colocar"
            labelKey={puesto ? "ui.paso.4.colocado" : "ui.paso.4.colocar"} selected={puesto || undefined}
            disabled={!puesto && !permiso.ok} disabledReasonKey={motivoKey}
            onClick={() => { if (!puesto) colocar(); }} />
          {ultimo && colocados.includes(ultimo) && (
            <Mensaje tipo="exito" tituloKey="ui.paso.4.puesto" detalleKey="ui.comun.pendiente.titulo"
              vars={{ moduloKey: `ui.paso.4.modulo.${ultimo}` }} />
          )}
        </div>
      </aside>
    </section>
  );
}
