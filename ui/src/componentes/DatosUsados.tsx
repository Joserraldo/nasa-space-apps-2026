import { datosUsados } from "@solar-shield/data";
import { useT } from "../i18n.js";
import { Icono } from "./base/Iconos.js";
import "./base/facetas.css";
import "./base/datos.css";

/**
 * "Qué datos de NASA usamos y por qué" (lo pide el reto y el jurado, issue #137). Textos de data/
 * (`datosUsados()`, #162), una línea por conjunto de datos. Las líneas generales (no en vivo, tipos
 * de dato, aviso de proyecto no oficial) van aparte, al final, como en `docs/science/datos-usados.md`.
 */
const GENERALES = new Set(["datos.usados.noEnVivo", "datos.usados.tipos", "datos.usados.aviso"]);

export function DatosUsados({ titulo = true }: { titulo?: boolean }) {
  const { t } = useT();
  const { tituloKey, lineas } = datosUsados();
  const conjuntos = lineas.filter((l) => !GENERALES.has(l.clave));
  const generales = lineas.filter((l) => GENERALES.has(l.clave));
  return (
    <section className="fc datos-usados" aria-labelledby="datos-usados-titulo">
      <div className="fc-cara datos-cara">
        <h2 id="datos-usados-titulo" className={titulo ? undefined : "oculto-visual"}>{t(tituloKey)}</h2>
        <ul className="datos-lista">
          {conjuntos.map((l) => <li key={l.clave}><Icono nombre="enlace" tam={18} className="datos-vineta" /><span>{t(l.clave)}</span></li>)}
        </ul>
        {generales.map((l) => <p key={l.clave} className="datos-general">{t(l.clave)}</p>)}
      </div>
    </section>
  );
}
