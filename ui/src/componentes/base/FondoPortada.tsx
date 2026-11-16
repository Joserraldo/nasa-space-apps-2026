import { Ilustracion } from "./Ilustracion.js";

/**
 * Fondo ilustrado de la portada (inicio/01): el niño flotando y saludando, atado con un cable a la nave,
 * el planeta con anillo y el asteroide, en las ilustraciones 2D de María Paula (`Ilustracion.tsx`).
 * Es decorado (`aria-hidden`): el menú y el logo van en la capa de adelante.
 *
 * Movimiento (impeccable animate, registro de marca; review-animations): una sola entrada escalonada al
 * abrir la portada y después un flotar lento y continuo, solo con `translate`, `rotate`, `scale` y
 * `opacity`. Con movimiento reducido todo queda quieto (inicio.css).
 */
export function FondoPortada() {
  return (
    <div className="portada-fondo" aria-hidden="true">
      <Ilustracion pieza="portada-asteroide" className="portada-asteroide" sizes="(max-width: 899px) 0px, 9vw" />
      <Ilustracion pieza="portada-asteroide" className="portada-roca" sizes="(max-width: 899px) 0px, 9vw" />
      <Ilustracion pieza="portada-planeta" className="portada-planeta" sizes="(max-width: 899px) 22vw, 15vw" />
      {/* El cable va del niño a la nave (inicio/01): un trazo, sin imagen. */}
      <svg className="portada-cable" viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false">
        <path d="M54 55 C46 66 48 83 60 85 S78 90 82 88" />
      </svg>
      <Ilustracion pieza="portada-nave" className="portada-nave" sizes="(max-width: 899px) 34vw, 27vw" />
      <Ilustracion pieza="portada-nino" className="portada-nino" sizes="(max-height: 500px) and (min-width: 600px) 18vw, (max-width: 899px) 46vw, 31vw" />
    </div>
  );
}
