import { consejosSatelite } from "@solar-shield/agents";
import type { GameState } from "@solar-shield/contracts";
import { useT } from "../i18n.js";
import { Burbuja } from "../componentes/Dialogos.js";

/** Pasos 1 y 2 en 2D simple: el satélite ya orbita; se ven batería, señal y escudo. */
export function Satelite({ estado, onContinuar }: { estado: GameState; onContinuar: () => void }) {
  const { t } = useT();
  const o = estado.orbita!;
  const consejos = consejosSatelite(estado);
  return (
    <section className="tarjeta columna">
      <h2>{t("ui.paso.1.titulo")}</h2>
      <p>{t("ui.paso.1.texto", { altura: Math.round(o.alturaKm) })}</p>
      <svg viewBox="0 0 320 160" width="100%" height="160" role="img" aria-label={t("ui.paso.1.titulo")}>
        <circle cx="160" cy="80" r="46" fill="#c2552f" stroke="#060a1c" strokeWidth="3" />
        <circle cx="145" cy="70" r="10" fill="#a4432a" />
        <ellipse cx="160" cy="80" rx="120" ry="60" fill="none" stroke="#b8c2e8" strokeWidth="2" strokeDasharray="6 6" />
        <g transform={`rotate(${(estado.tick * 45) % 360} 160 80)`}>
          <rect x="268" y="74" width="24" height="12" fill="#3dd6f5" stroke="#060a1c" strokeWidth="3" rx="2" />
          <rect x="262" y="78" width="6" height="4" fill="#ffd23f" />
          <rect x="292" y="78" width="6" height="4" fill="#ffd23f" />
        </g>
        <circle cx="24" cy="24" r="14" fill="#ff8a3d" stroke="#060a1c" strokeWidth="3" />
      </svg>
      <div className="hud">
        <Mini nombre={t("ui.paso.1.bateria")} v={o.bateriaPct} clase="energia" />
        <Mini nombre={t("ui.paso.1.senal")} v={o.senalPct} clase="blindaje" />
        <Mini nombre={t("ui.paso.1.escudo")} v={o.escudoPct} clase="soporte_vital" />
      </div>
      {consejos.map((d, i) => <Burbuja key={i} d={d} />)}
      <div><button onClick={onContinuar}>{t("ui.continuar")}</button></div>
    </section>
  );
}

function Mini({ nombre, v, clase }: { nombre: string; v: number; clase: string }) {
  const n = Math.round(v);
  return (
    <div className={`medidor ${clase}`} role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={n} aria-label={nombre}>
      <div className="nombre"><span>{nombre}</span><span className="valor">{n}%</span></div>
      <div className="pista"><div className="relleno" style={{ width: `${n}%` }} /></div>
    </div>
  );
}
