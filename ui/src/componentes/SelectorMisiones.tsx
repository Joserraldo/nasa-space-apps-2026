import { useT } from "../i18n.js";
import { MISIONES } from "../juego/misiones.js";
import { FacetButton } from "./base/FacetButton.js";
import { Icono } from "./base/Iconos.js";
import "./base/facetas.css";
import "./selectorMisiones.css";

/**
 * EXPERIMENTAL: "Choose your mission". Sale al pulsar "Start mission" en la portada y al terminar una
 * partida. Muestra las misiones del motor con su lugar y marca las que el niño ya ganó en esta visita.
 */
export function SelectorMisiones({ ganadas, onElegir, onVolver }: {
  ganadas: ReadonlySet<string>;
  onElegir(misionId: string): void;
  onVolver(): void;
}) {
  const { t } = useT();
  return (
    <section className="misiones" aria-labelledby="misiones-titulo">
      <div className="misiones-pagina">
        <div className="fc">
          <div className="fc-cara misiones-cabeza">
            <h2 id="misiones-titulo">{t("ui.misiones.titulo")}</h2>
            <p>{t("ui.misiones.texto")}</p>
          </div>
        </div>
        <ul className="misiones-lista">
          {MISIONES.map((m) => {
            const lugar = m.sitio.startsWith("luna") ? "luna" : m.sitio.startsWith("marte") ? "marte" : "espacio";
            const ganada = ganadas.has(m.id);
            return (
              <li key={m.id} className="fc" data-mision={m.id} data-lugar={lugar}>
                <article className="fc-cara misiones-tarjeta" aria-labelledby={`mision-${m.id}`}>
                  <p className="misiones-lugar"><Icono nombre="planeta" tam={20} />{t(`ui.misiones.lugar.${lugar}`)}</p>
                  <h3 id={`mision-${m.id}`}>{t(m.nombreKey)}</h3>
                  {ganada && <p className="misiones-ganada"><Icono nombre="check_exito" tam={20} />{t("ui.misiones.ganada")}</p>}
                  <FacetButton variant="primary" icon="jugar" labelKey="ui.misiones.jugar" onClick={() => onElegir(m.id)} />
                </article>
              </li>
            );
          })}
        </ul>
        <div><FacetButton icon="atras" labelKey="ui.misiones.volver" onClick={onVolver} /></div>
      </div>
    </section>
  );
}
