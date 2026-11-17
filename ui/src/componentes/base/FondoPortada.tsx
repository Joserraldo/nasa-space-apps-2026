import { Ilustracion } from "./Ilustracion.js";

/**
 * Fondo ilustrado de la portada (inicio/01): las ilustraciones 2D de María Paula (`Ilustracion.tsx`) en dos
 * capas de decorado (`aria-hidden`), detrás del menú y del logo:
 * - `portada-fondo`: el planeta con anillo y los dos asteroides, ubicados en % de la pantalla.
 * - `portada-grupo`: el niño flotando y saludando, el cable y la nave, dentro de un mismo lienzo con la
 *   proporción de la lámina. Así el cable sale siempre de la espalda del niño y llega a la nave, en cualquier
 *   proporción de pantalla. En pantallas verticales el grupo ocupa el lugar que queda debajo del menú
 *   (inicio.css).
 *
 * Movimiento (impeccable animate, registro de marca; review-animations): una sola entrada escalonada al
 * abrir la portada y después un flotar lento y continuo, solo con `translate`, `rotate`, `scale` y
 * `opacity`. Con movimiento reducido todo queda quieto (inicio.css).
 */
export function FondoPortada() {
  return (
    <>
      <div className="portada-fondo" aria-hidden="true">
        <Ilustracion pieza="portada-asteroide" className="portada-asteroide" sizes="9vw" />
        <Ilustracion pieza="portada-asteroide" className="portada-roca" sizes="9vw" />
        <Ilustracion pieza="portada-planeta" className="portada-planeta" sizes="(max-width: 899px) 22vw, 15vw" />
      </div>
      <div className="portada-grupo" aria-hidden="true">
        <div className="portada-lienzo">
          {/* El cable va de la espalda del niño a la nave (inicio/01): un trazo en coordenadas del lienzo. */}
          <svg className="portada-cable" viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false" aria-hidden="true">
            <path d="M7.4 47.9 C-7.4 61.1 -3.7 81.5 18.5 83.9 S51.8 89.9 59.2 87.5" />
          </svg>
          <Ilustracion pieza="portada-nave" className="portada-nave" sizes="(max-width: 899px) 50vw, 27vw" />
          <Ilustracion pieza="portada-nino" className="portada-nino" sizes="(max-height: 500px) 26vw, (max-width: 899px) 60vw, 30vw" />
        </div>
      </div>
    </>
  );
}
