import React, { useId, type CSSProperties } from "react";
import { useT } from "../i18n.js";
import { LUGARES, lugar, type LugarId } from "../escena/mundo.js";
import type { VistaEscena } from "../escena/vista.js";
import "./Mapa.css";

export interface MapaProps {
  /** Posición real de la escena, en metros de juego (X/Z). */
  posicion: Readonly<{ x: number; z: number }>;
  objetivo: LugarId | null;
  modulos: VistaEscena["modulos"];
  /** Solicita ir al punto de uso de LUGARES; no ejecuta acciones del motor. */
  onIrA(lugarId: LugarId): void;
}

// Solo conexiones del plano canónico (ESCENAS §3.2); ninguna coordenada copiada.
const CIRCUITOS: readonly (readonly LugarId[])[] = [
  ["mesa", "taller", "panel_solar", "escudo", "habitat", "mesa"],
  ["mesa", "sensor", "reciclador_agua", "invernadero", "antena", "mesa"],
  ["taller", "banco", "mesa"],
];

/** Panel embebido y respaldo 2D; José conserva apertura, pausa y restauración del foco. */
export function Mapa({ posicion, objetivo, modulos, onIrA }: MapaProps) {
  const { t } = useT();
  const tituloId = useId();
  const xs = LUGARES.flatMap(l => [l.x, l.mx]).concat(posicion.x);
  const zs = LUGARES.flatMap(l => [l.z, l.mz]).concat(posicion.z);
  const x0 = Math.min(...xs) - 3, z0 = Math.min(...zs) - 3;
  const ancho = Math.max(...xs) + 3 - x0, alto = Math.max(...zs) + 3 - z0;
  const enPlano = (x: number, z: number): CSSProperties => ({
    left: `${(x - x0) / ancho * 100}%`, top: `${(z - z0) / alto * 100}%`,
  });
  const nombre = (id: LugarId) => t(`ui.mapa.lugar.${id}`);
  const estado = (id: LugarId) => {
    const l = lugar(id);
    return l.modulo ? t(`ui.mapa.estado.${modulos[l.modulo]}`) : "";
  };
  const etiqueta = (id: LugarId) => [nombre(id), estado(id), objetivo === id ? t("ui.mapa.objetivo") : ""].filter(Boolean).join(". ");
  const cercano = LUGARES.reduce((a, b) =>
    Math.hypot(b.x - posicion.x, b.z - posicion.z) < Math.hypot(a.x - posicion.x, a.z - posicion.z) ? b : a);

  return (
    <section className="mapa" aria-labelledby={tituloId}>
      <header className="mapa__cabecera">
        <h2 id={tituloId}>{t("ui.mapa.titulo")}</h2>
        <p>{t("ui.mapa.desc")}</p>
      </header>
      <div className="mapa__contenido">
        <div className="mapa__dibujo">
          <div className="mapa__plano" style={{ aspectRatio: `${ancho} / ${alto}` }}>
            <svg viewBox={`${x0} ${z0} ${ancho} ${alto}`} aria-hidden="true" focusable="false">
              {CIRCUITOS.map((c, i) => <polyline key={i} className="mapa__camino"
                strokeDasharray={i === 2 ? "0.4 0.3" : undefined}
                points={c.map(id => { const l = lugar(id); return `${l.x},${l.z}`; }).join(" ")} />)}
              {LUGARES.map(l => <line key={l.id} className="mapa__conexion" x1={l.x} y1={l.z} x2={l.mx} y2={l.mz} />)}
            </svg>
            {LUGARES.map((l, i) => (
              <button key={l.id} type="button" className="mapa__pin" style={enPlano(l.mx, l.mz)}
                data-lugar={l.id} data-estado={l.modulo ? modulos[l.modulo] : undefined}
                data-objetivo={objetivo === l.id} aria-label={etiqueta(l.id)} onClick={() => onIrA(l.id)}>
                <span aria-hidden="true">{i + 1}</span>
              </button>
            ))}
            <span className="mapa__astronauta" role="img" aria-label={t("ui.mapa.posicion.desc", { lugarKey: `ui.mapa.lugar.${cercano.id}` })}
              style={enPlano(posicion.x, posicion.z)} />
          </div>
          <p className="mapa__leyenda"><span className="mapa__muestra" aria-hidden="true" />{t("ui.mapa.posicion")}</p>
          <p className="mapa__objetivo">{t("ui.mapa.objetivo")}: {objetivo ? nombre(objetivo) : t("ui.mapa.sinObjetivo")}</p>
        </div>
        <ol className="mapa__lista" aria-label={t("ui.mapa.lista")}>
          {LUGARES.map((l, i) => (
            <li key={l.id}>
              <button type="button" className="mapa__destino" data-objetivo={objetivo === l.id}
                aria-label={etiqueta(l.id)} onClick={() => onIrA(l.id)}>
                <span className="mapa__numero" aria-hidden="true">{i + 1}</span>
                <span>{nombre(l.id)}{l.modulo && <small>{estado(l.id)}</small>}</span>
                {objetivo === l.id && <span className="mapa__marca" aria-hidden="true" />}
              </button>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
