import type { Idioma } from "../i18n.js";
import { useT } from "../i18n.js";
import { FacetButton } from "./base/FacetButton.js";
import { Icono } from "./base/Iconos.js";
import { LogoSolarShield } from "./base/LogoSolarShield.js";
import { Retrato } from "./base/Retrato.js";
import "./base/inicio.css";

/**
 * Portada DOM (inicio/01, DISEÑO §6): logo, subtítulo, menú y preferencias. El fondo con el niño,
 * la nave y los planetas es la capa 3D de María Paula (`escena/activos/portada.ts`) y va DETRÁS:
 * esta capa deja libre la mitad derecha y no captura clics fuera de sus botones.
 * Sin guardado válido, "Continue" queda no disponible con el motivo escrito.
 */
export interface PortadaProps {
  idioma: Idioma;
  onIdioma(i: Idioma): void;
  sonido: boolean;
  onSonido(): void;
  puedeContinuar: boolean;
  /**
   * Respaldo 2D de la escena de fondo (niño flotando y planeta, capas 1 y 4 de DISEÑO §6) mientras no
   * exista la capa 3D de María Paula. Cuando la capa 3D se monte detrás, se pasa false.
   */
  fondo2D?: boolean;
  onEmpezar(): void;
  onContinuar(): void;
  /** Sin pantalla de ajustes todavía: si falta, el botón no se muestra (mejor que uno que no hace nada). */
  onAjustes?: (() => void) | undefined;
  onCreditos(): void;
}

export function Portada({ idioma, onIdioma, sonido, onSonido, puedeContinuar, onEmpezar, onContinuar, onAjustes, onCreditos, fondo2D = true }: PortadaProps) {
  const { t } = useT();
  return (
    <section className="portada" aria-labelledby="portada-titulo">
      <h1 id="portada-titulo" className="oculto-visual">{t("ui.portada.logo")}</h1>
      {fondo2D && (
        <div className="portada-fondo" aria-hidden="true">
          <Icono nombre="planeta" tam={140} className="portada-planeta" />
          <span className="portada-asteroide" />
          <span className="portada-nino"><Retrato persona="nino" expresion="feliz" tam={360} parpadear /></span>
        </div>
      )}

      <div className="portada-prefs" role="group" aria-label={t("ui.portada.preferencias")}>
        <div className="portada-idiomas" role="group" aria-label={t("ui.portada.idioma")}>
          {(["en", "es"] as const).map((i) => (
            <FacetButton key={i} labelKey={`ui.portada.idioma.${i}`} selected={idioma === i} onClick={() => onIdioma(i)} />
          ))}
        </div>
        <span className="portada-sep" aria-hidden="true" />
        <FacetButton labelKey={sonido ? "ui.portada.sonido_on" : "ui.portada.sonido_off"} icon={sonido ? "sonido_on" : "sonido_off"} onClick={onSonido} />
      </div>

      <div className="portada-marca">
        <LogoSolarShield className="portada-logo" />
        <p className="portada-subtitulo">{t("ui.portada.subtitulo")}</p>
      </div>

      <nav className="portada-menu" aria-label={t("ui.portada.menu")}>
        <FacetButton variant="menu" icon="jugar" labelKey="ui.portada.empezar" onClick={onEmpezar} />
        <FacetButton variant="menu" icon={puedeContinuar ? "jugar" : "candado"} labelKey="ui.portada.continuar"
          disabled={!puedeContinuar} disabledReasonKey={puedeContinuar ? undefined : "ui.portada.sin_guardado"} onClick={onContinuar} />
        {onAjustes && <FacetButton variant="menu" icon="engranaje" labelKey="ui.portada.ajustes" onClick={onAjustes} />}
        <p className="portada-lema">{t("ui.portada.lema")}</p>
      </nav>

      <div className="portada-creditos">
        <FacetButton labelKey="ui.portada.creditos" icon="enlace" onClick={onCreditos} />
      </div>
    </section>
  );
}
