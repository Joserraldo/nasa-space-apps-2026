import type { SourceCard } from "@solar-shield/contracts";
import { useT } from "../i18n.js";
import { Icono } from "./base/Iconos.js";
import "./base/facetas.css";
import "./base/datos.css";

/**
 * Tarjeta de fuente v8 (ui/03 "Inputs & sources", ui/04 "Check the source", DISEÑO §5.3): pequeña,
 * con el dueño real del dato, la etiqueta "datos reales curados, no en vivo", el identificador y la
 * fecha SOLO si existen, y un enlace descriptivo. Toda cifra de NASA la lleva.
 */

function Etiqueta({ estado }: { estado?: "curado" | "mock" | undefined }) {
  const { t } = useT();
  return <span className="fuente-etiqueta">{t(estado === "mock" ? "datos.etiqueta.mock" : "datos.etiqueta.curado")}</span>;
}

function Enlace({ url }: { url: string }) {
  const { t } = useT();
  return (
    <a className="fuente-enlace" href={url} target="_blank" rel="noreferrer">
      {t("ui.fuente.ver")} <Icono nombre="enlace" tam={18} />
      <span className="oculto-visual"> {t("ui.datos.ventana_nueva")}</span>
    </a>
  );
}

export function TarjetaFuente({ fuente, titulo = true }: { fuente: SourceCard; /** `false` si un encabezado de afuera ya dice "de dónde salen estos datos". */ titulo?: boolean }) {
  const { t } = useT();
  return (
    <div className="fc fuente">
      <div className="fc-cara fc-chico fc-lila fuente-cara">
        {titulo && <p className="fuente-titulo"><strong>{t("ui.fuente.titulo")}</strong></p>}
        <p className="fuente-nombre">{t(fuente.nombreKey)}{fuente.dueno ? ` · ${fuente.dueno}` : ""} <Etiqueta estado={fuente.estadoDato} /></p>
        <p className="fuente-meta">
          {fuente.idFuente && <span>{t("ui.fuente.id", { id: fuente.idFuente })}</span>}
          {fuente.consultadoEl && <span>{t("ui.fuente.consultado", { fecha: fuente.consultadoEl.slice(0, 10) })}</span>}
        </p>
        <Enlace url={fuente.url} />
      </div>
    </div>
  );
}

/** Fuente de un terreno (Mars Trek, Moon Trek): varias URLs, sin id de evento y a veces con datos derivados. */
export function FuenteTerreno({ fuente, titulo = true }: { titulo?: boolean; fuente: { nombreKey: string; dueno?: string; consultadoEl: string; urls: string[]; estadoDato?: "curado" | "mock"; derivadoKey?: string } }) {
  const { t } = useT();
  return (
    <div className="fc fuente">
      <div className="fc-cara fc-chico fc-lila fuente-cara">
        {titulo && <p className="fuente-titulo"><strong>{t("ui.fuente.titulo")}</strong></p>}
        <p className="fuente-nombre">{t(fuente.nombreKey)}{fuente.dueno ? ` · ${fuente.dueno}` : ""} <Etiqueta estado={fuente.estadoDato} /></p>
        {fuente.derivadoKey && <p className="fuente-meta">{t(fuente.derivadoKey)}</p>}
        <p className="fuente-meta"><span>{t("ui.fuente.consultado", { fecha: fuente.consultadoEl.slice(0, 10) })}</span></p>
        {fuente.urls.map((u) => <Enlace key={u} url={u} />)}
      </div>
    </div>
  );
}
