import { Icono, type NombreIcono } from "./Iconos.js";
import { Ilustracion, type Pieza } from "./Ilustracion.js";

/**
 * Escena ilustrada de la carga (inicio/03): el niño mira la tableta, parado sobre su sombra lila, mientras
 * la base se arma. Los tres módulos (panel solar, invernadero, hábitat) aparecen de a uno con su insignia
 * arriba, sobre una órbita que se dibuja. Ilustraciones 2D de María Paula (`Ilustracion.tsx`). Es decorado
 * (`aria-hidden`): el estado de la carga va en texto en el panel.
 *
 * Movimiento (impeccable animate; review-animations): la base se arma una vez, módulo por módulo, y después
 * respira con un vaivén lento. Solo `translate`, `scale` y `opacity`; quieto con movimiento reducido.
 */
const MODULOS: ReadonlyArray<{ pieza: Pieza; icono: NombreIcono }> = [
  { pieza: "carga-panel", icono: "energia" },
  { pieza: "carga-invernadero", icono: "pulmones" },
  { pieza: "carga-habitat", icono: "escudo" },
];

export function EscenaCarga() {
  return (
    <div className="carga-escena" aria-hidden="true">
      <div className="carga-modulos">
        <svg className="carga-orbita" viewBox="0 0 100 40" preserveAspectRatio="none" focusable="false" aria-hidden="true">
          <ellipse cx="50" cy="22" rx="48" ry="15" pathLength="100" />
        </svg>
        {MODULOS.map(({ pieza, icono }) => (
          <div key={pieza} className="carga-modulo">
            <span className="carga-icono"><Icono nombre={icono} tam={32} /></span>
            <Ilustracion pieza={pieza} className="carga-modulo-img" sizes="(max-width: 899px) 27vw, 16vw" />
          </div>
        ))}
      </div>
      <div className="carga-protagonista">
        <span className="carga-sombra" />
        <Ilustracion pieza="carga-nino" className="carga-nino" sizes="(max-width: 899px) 200px, 24vw" />
      </div>
    </div>
  );
}
