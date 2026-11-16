import { useCallback, useEffect, useRef, useState } from "react";
import type { Equipment, GameState, Resource } from "@solar-shield/contracts";
import { costoDe, puedeAplicar } from "@solar-shield/engine";
import { MISION_JEZERO } from "@solar-shield/missions";
import { useT } from "../i18n.js";
import { ExpertPortrait } from "../componentes/base/ExpertPortrait.js";
import { FacetButton } from "../componentes/base/FacetButton.js";
import { Icono } from "../componentes/base/Iconos.js";
import { CostRow, ICONO_RECURSO, Mensaje, RECURSOS } from "../componentes/base/Piezas.js";
import "../componentes/base/facetas.css";
import { TarjetaDelFlujo, useTarjetaUnica } from "../componentes/TarjetaDelFlujo.js";
import { LUGARES } from "../escena/mundo.js";
import { useMundo } from "./MundoBase.js";
import "./modulos.css";

/**
 * E5, paso 4 (ESCENAS §2.7, fila "E5 a E7"; MECANICAS §3.2). Capa sobre el mundo compartido
 * (`MundoBase`, la misma escena que sigue en E6 y E7); sin WebGL queda el respaldo 2D con el módulo
 * elegido en cian. Sin lista ni panel fijos (PLAN-JUGABILIDAD E1): la decisión (panel 02 de `ui/04`:
 * nombre, `Costs now` / `Later` y la acción principal) aparece como tarjeta contextual al llegar a un
 * anclaje vacío o al preguntar a la Ingeniera. Costo y beneficio salen de `costoDe` (motor + misión); si el motor no deja
 * colocar, `puedeAplicar` da el motivo escrito. El reductor vuelve a comprobar antes de marcar
 * un módulo como colocado. Reemplaza a `ColocarModulos.tsx` (FLUJO §2.3).
 */

const mision = MISION_JEZERO;
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

type Tarjeta = { tipo: "elegir" } | { tipo: "modulo"; modulo: Equipment };

export function PantallaModulos({ estado, colocados, onColocar, onListo }: {
  estado: GameState;
  colocados: Equipment[];
  onColocar: (m: Equipment) => void;
  onListo: () => void;
}) {
  const { t } = useT();
  const total = mision.modulosAColocar;
  const faltan = total - colocados.length;
  const [ultimo, setUltimo] = useState<Equipment | null>(null);
  // E1: ninguna tarjeta fija. Aparece al llegar a un anclaje vacío ([E] Build) o al preguntar a la
  // Ingeniera (hasta que A6/A9 lleven esa charla al mundo); una a la vez y se cierra al decidir.
  const tarjeta = useTarjetaUnica<Tarjeta>();
  const elegido = tarjeta.abierta?.tipo === "modulo" ? tarjeta.abierta.modulo : null;
  const mostrada = tarjeta.mostrada;
  const botonera = useRef<HTMLDivElement>(null);
  // El botón que abrió la tarjeta se oculta mientras está abierta: si el foco se perdió al cerrar, va al
  // primer botón disponible de la base (invariante 3: abrir y cerrar devuelve el foco).
  const devolverFoco = useCallback(() => {
    const activo = document.activeElement;
    if (activo && activo !== document.body) return;
    botonera.current?.querySelector<HTMLElement>("button:not([disabled]):not([aria-disabled='true'])")?.focus({ preventScroll: true });
  }, []);

  const { sin3d: sinGl, cercano, fijarInstalando, fijarUso, usarCercano } = useMundo();
  /** Anclaje vacío al alcance en el mundo: ofrece `[E] Build` (solo con 3D). */
  const ancla = sinGl || faltan <= 0 ? null : (() => {
    const m = LUGARES.find((l) => l.id === cercano)?.modulo;
    return m && mision.modulosDisponibles.includes(m) && !colocados.includes(m) ? m : null;
  })();

  // La escena no tiene prop de resaltado (issue para Daniel): el módulo de la tarjeta abierta y aún
  // sin colocar se ve como "instalando" (andamio teal) en su anclaje.
  const instalando = elegido && !colocados.includes(elegido) ? elegido : null;
  useEffect(() => { fijarInstalando(instalando); }, [instalando, fijarInstalando]);
  useEffect(() => () => fijarInstalando(null), [fijarInstalando]);

  // E2: `[E] Build` llega por la única vía de MundoBase; aquí solo se abre la tarjeta del anclaje.
  const abrirAncla = useRef<() => void>(() => {});
  abrirAncla.current = () => { if (ancla && !tarjeta.abierta) tarjeta.abrir({ tipo: "modulo", modulo: ancla }); };
  useEffect(() => {
    fijarUso((i) => { if (i.tipo === "lugar") abrirAncla.current(); });
    return () => fijarUso(null);
  }, [fijarUso]);

  function colocar(m: Equipment) {
    onColocar(m);
    setUltimo(m);
    tarjeta.cerrar(); // se cierra al decidir
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

        {ultimo && colocados.includes(ultimo) && !tarjeta.abierta && (
          <Mensaje tipo="exito" tituloKey="ui.paso.4.puesto" detalleKey="ui.comun.pendiente.titulo"
            vars={{ moduloKey: `ui.paso.4.modulo.${ultimo}` }} />
        )}

        {sinGl && elegido && <span className="modulos-ancla" aria-hidden="true"><Icono nombre={iconoDe(elegido)} tam={48} /></span>}

        <div className="modulos-base" ref={botonera}>
          {ancla && !tarjeta.abierta && (
            <FacetButton variant="primary" icon="check" labelKey="ui.paso.4.construir"
              labelVars={{ moduloKey: `ui.paso.4.modulo.${ancla}` }}
              onClick={usarCercano} />
          )}
          {faltan > 0 && !tarjeta.abierta && (
            <FacetButton labelKey="ui.paso.4.preguntar" onClick={() => tarjeta.abrir({ tipo: "elegir" })} />
          )}
          <FacetButton variant="primary" icon="jugar" labelKey="ui.paso.4.listo" className="modulos-listo"
            disabled={faltan > 0} disabledReasonKey="ui.paso.4.motivo.faltan" onClick={onListo} />
        </div>
      </div>

      <TarjetaDelFlujo abierta={tarjeta.abierta !== null} onCerrar={tarjeta.cerrar} className="modulos-panel"
        contenido={mostrada?.tipo === "modulo" ? mostrada.modulo : mostrada?.tipo} onCerrada={devolverFoco}
        figura={mostrada && <ExpertPortrait persona={mostrada.tipo === "modulo" ? expertaDe(mostrada.modulo) : "ingeniera"} compacto />}
        titulo={mostrada?.tipo === "modulo" ? t(`ui.paso.4.modulo.${mostrada.modulo}`) : t("ui.paso.4.titulo", { n: total })}
        bajada={mostrada && t(`ui.comun.retrato.${mostrada.tipo === "modulo" ? expertaDe(mostrada.modulo) : "ingeniera"}.nombre`)}
        acciones={mostrada?.tipo === "modulo"
          ? <AccionesModulo key={mostrada.modulo} estado={estado} modulo={mostrada.modulo} faltan={faltan}
              colocado={colocados.includes(mostrada.modulo)} onColocar={() => colocar(mostrada.modulo)} onAtras={tarjeta.cerrar} />
          : <FacetButton labelKey="ui.comun.atras" onClick={tarjeta.cerrar} />}>
        {mostrada?.tipo === "modulo" ? (
          <>
            <p className="modulos-panel-desc">{t(`agentes.iris.sistema.${mostrada.modulo}`)}</p>
            <CostRow {...costoDe(accionDe(mostrada.modulo), mision)} />
          </>
        ) : mostrada ? (
          <>
            <p className="modulos-panel-desc">{t("ui.paso.4.elige")}</p>
            <ul className="modulos-lista" aria-label={t("ui.paso.4.lista")}>
              {mision.modulosDisponibles.map((m) => {
                const listo = colocados.includes(m);
                return (
                  <li key={m}>
                    <button type="button" className={`modulos-ficha${listo ? " modulos-ficha-lista" : ""}`}
                      disabled={listo} onClick={() => tarjeta.abrir({ tipo: "modulo", modulo: m })}>
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
          </>
        ) : null}
      </TarjetaDelFlujo>
    </section>
  );
}

/** Acciones del panel 02 de `ui/04`: confirmar o volver. Se monta de nuevo con cada módulo. */
function AccionesModulo({ estado, modulo, faltan, colocado, onColocar, onAtras }: {
  estado: GameState;
  modulo: Equipment;
  faltan: number;
  colocado: boolean;
  onColocar: () => void;
  onAtras: () => void;
}) {
  const permiso = puedeAplicar(estado, accionDe(modulo), mision);
  const motivoKey = permiso.ok ? undefined
    : faltan <= 0 ? "ui.paso.4.motivo.lleno"
      : `ui.comun.motivo.${permiso.motivo}${permiso.recurso ? `.${permiso.recurso}` : ""}`;
  // Evita el doble clic (invariante 1): una sola confirmación por apertura de la tarjeta.
  const [enviado, setEnviado] = useState(false);
  return (
    <>
      <FacetButton variant="primary" icon="check" className="modulos-colocar"
        labelKey={colocado ? "ui.paso.4.colocado" : "ui.paso.4.colocar"} selected={colocado || undefined}
        disabled={colocado || enviado || !permiso.ok} disabledReasonKey={motivoKey}
        onClick={() => { if (colocado || enviado || !permiso.ok) return; setEnviado(true); onColocar(); }} />
      <FacetButton labelKey="ui.comun.atras" onClick={onAtras} />
    </>
  );
}
