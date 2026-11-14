import type { GameState } from "@solar-shield/contracts";
import { resumenPartida } from "@solar-shield/engine";
import { useT } from "../i18n.js";
import { TarjetaFuente } from "../componentes/TarjetaFuente.js";

/** Paso 8: cadena de causas (decisión vs mala suerte) y tarjeta de ciencia. Nunca un simple "Game Over". */
export function Final({ estado, onOtra }: { estado: GameState; onOtra: () => void }) {
  const { t } = useT();
  const r = resumenPartida(estado);
  const total = r.danoPorOrigen.decision + r.danoPorOrigen.mala_suerte + r.danoPorOrigen.sistema || 1;
  const origenes = ["decision", "mala_suerte", "sistema"] as const;
  return (
    <section className="tarjeta columna">
      <h2>{t(r.resultado === "exito" ? "ui.final.exito" : "ui.final.fallo")}</h2>
      <p><strong>{t("ui.final.puntaje")}:</strong> {r.puntaje} · <span className="etiqueta">{t(r.rangoKey)}</span></p>

      <h3>{t("ui.paso.8.titulo")}</h3>
      <div className="barras-origen">
        {origenes.map((o) => (
          <div key={o} className={`b ${o}`}>
            <span>{t(`ui.final.${o}`)}</span>
            <div className="pista" aria-hidden="true"><div style={{ width: `${Math.round((r.danoPorOrigen[o] / total) * 100)}%` }} /></div>
            <span className="delta">{Math.round((r.danoPorOrigen[o] / total) * 100)}%</span>
          </div>
        ))}
      </div>

      <h3>{t("ui.final.destacadas")}</h3>
      <ul>
        {r.causasDestacadas.map((c, i) => (
          <li key={i}>
            {t(c.descripcionKey)} · <span className="delta menos">{c.delta}</span> {c.recurso ? t(`ui.recurso.${c.recurso}`) : ""} · {t("ui.tick", { tick: c.tick })} · <em>{t(`ui.final.${c.origen}`)}</em>
          </li>
        ))}
      </ul>

      {r.insigniasKeys.length > 0 && (
        <>
          <h3>{t("ui.final.insignias")}</h3>
          <div className="fila">{r.insigniasKeys.map((k) => <span key={k} className="insignia">🏅 {t(k)}</span>)}</div>
        </>
      )}

      {estado.tormenta && (
        <>
          <h3>{t("ui.final.ciencia")}</h3>
          <p>{t(`datos.tormenta.${estado.tormenta.id}.queOcurrio`)}</p>
          {estado.tormenta.marcoMarte && <p>{t(`datos.marco.${estado.tormenta.marcoMarte}`)}</p>}
          <TarjetaFuente fuente={estado.tormenta.fuente} />
        </>
      )}
      <div><button onClick={onOtra}>{t("ui.final.jugar_otra")}</button></div>
    </section>
  );
}
