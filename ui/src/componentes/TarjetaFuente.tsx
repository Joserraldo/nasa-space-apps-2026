import type { SourceCard } from "@solar-shield/contracts";
import { useT } from "../i18n.js";

/** Tarjeta de fuente: toda cifra de NASA la lleva. Estática = "datos reales curados, no en vivo". */
export function TarjetaFuente({ fuente }: { fuente: SourceCard }) {
  const { t } = useT();
  return (
    <div className="fuente">
      <strong>{t("ui.fuente.titulo")}</strong> {t(fuente.nombreKey)}
      {fuente.dueno ? ` · ${fuente.dueno}` : ""}
      {" "}
      <span className="etiqueta">{t(fuente.estadoDato === "mock" ? "datos.etiqueta.mock" : "datos.etiqueta.curado")}</span>
      <div>{t("ui.fuente.id", { id: fuente.idFuente })} · {t("ui.fuente.consultado", { fecha: fuente.consultadoEl.slice(0, 10) })}</div>
      <a href={fuente.url} target="_blank" rel="noreferrer">{t("ui.fuente.ver")}</a>
    </div>
  );
}

/** Fuente del terreno (Mars Trek): varias URLs y sin id de evento. */
export function FuenteTerreno({ fuente }: { fuente: { nombreKey: string; dueno?: string; consultadoEl: string; urls: string[]; estadoDato?: "curado" | "mock"; derivadoKey?: string } }) {
  const { t } = useT();
  return (
    <div className="fuente">
      <strong>{t("ui.fuente.titulo")}</strong> {t(fuente.nombreKey)}{fuente.dueno ? ` · ${fuente.dueno}` : ""}{" "}
      <span className="etiqueta">{t(fuente.estadoDato === "mock" ? "datos.etiqueta.mock" : "datos.etiqueta.curado")}</span>
      {fuente.derivadoKey && <div>{t(fuente.derivadoKey)}</div>}
      <div>{t("ui.fuente.consultado", { fecha: fuente.consultadoEl.slice(0, 10) })}</div>
      {fuente.urls.map((u) => <div key={u}><a href={u} target="_blank" rel="noreferrer">{t("ui.fuente.ver")}</a></div>)}
    </div>
  );
}
