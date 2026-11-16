/**
 * Fondo ilustrado de la portada (inicio/01): el niño flotando y saludando, atado con un cable a la nave,
 * el planeta con anillo y el asteroide, en las ilustraciones 2D de María Paula. Cada pieza es un WebP
 * en dos anchos (`tests/capturas/ilustraciones.mjs`): el navegador baja solo el que necesita.
 * Es decorado (`aria-hidden`): el menú y el logo van en la capa de adelante.
 *
 * Movimiento (impeccable animate, registro de marca; review-animations): una sola entrada escalonada al
 * abrir la portada y después un flotar lento y continuo, solo con `translate`, `rotate`, `scale` y
 * `opacity`. Con movimiento reducido todo queda quieto (inicio.css).
 */

/** Anchos escritos por el guion y proporción (alto / ancho) de cada pieza, para reservar su lugar. */
export const PIEZAS_PORTADA = {
  "portada-nino": { anchos: [320, 640], proporcion: 828 / 640 },
  "portada-nave": { anchos: [280, 560], proporcion: 473 / 560 },
  "portada-planeta": { anchos: [200, 400], proporcion: 219 / 400 },
  "portada-asteroide": { anchos: [120, 240], proporcion: 234 / 240 },
} as const;
export type PiezaPortada = keyof typeof PIEZAS_PORTADA;

export function rutaIlustracion(pieza: PiezaPortada, ancho: number): string {
  return `${import.meta.env.BASE_URL}ilustraciones/${pieza}-${ancho}.webp`;
}

function Pieza({ pieza, className, sizes }: { pieza: PiezaPortada; className: string; sizes: string }) {
  const { anchos, proporcion } = PIEZAS_PORTADA[pieza];
  const grande = anchos[anchos.length - 1]!;
  return (
    <img className={`ilu ${className}`} src={rutaIlustracion(pieza, grande)} srcSet={anchos.map((a) => `${rutaIlustracion(pieza, a)} ${a}w`).join(", ")}
      sizes={sizes} width={grande} height={Math.round(grande * proporcion)} alt="" decoding="async" draggable={false} />
  );
}

export function FondoPortada() {
  return (
    <div className="portada-fondo" aria-hidden="true">
      <Pieza pieza="portada-asteroide" className="portada-asteroide" sizes="(max-width: 899px) 0px, 9vw" />
      <Pieza pieza="portada-asteroide" className="portada-roca" sizes="(max-width: 899px) 0px, 9vw" />
      <Pieza pieza="portada-planeta" className="portada-planeta" sizes="(max-width: 899px) 22vw, 15vw" />
      {/* El cable va del niño a la nave (inicio/01): un trazo, sin imagen. */}
      <svg className="portada-cable" viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false">
        <path d="M54 55 C46 66 48 83 60 85 S78 90 82 88" />
      </svg>
      <Pieza pieza="portada-nave" className="portada-nave" sizes="(max-width: 899px) 34vw, 27vw" />
      <Pieza pieza="portada-nino" className="portada-nino" sizes="(max-height: 500px) and (min-width: 600px) 18vw, (max-width: 899px) 46vw, 31vw" />
    </div>
  );
}
