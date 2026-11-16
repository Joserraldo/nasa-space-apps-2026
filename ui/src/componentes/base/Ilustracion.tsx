/**
 * Ilustraciones 2D de María Paula para las pantallas de entrada (portada y carga). Cada pieza es un WebP en
 * dos anchos escrito por `tests/capturas/ilustraciones.mjs`; con `srcset` y `sizes` el navegador baja solo el
 * que necesita. Son decorado: van dentro de un contenedor `aria-hidden` y sin texto alternativo.
 */

/** Anchos escritos por el guion y proporción (alto / ancho) de cada pieza, para reservar su lugar. */
export const PIEZAS = {
  "portada-nino": { anchos: [320, 640], proporcion: 828 / 640 },
  "portada-nave": { anchos: [280, 560], proporcion: 473 / 560 },
  "portada-planeta": { anchos: [200, 400], proporcion: 219 / 400 },
  "portada-asteroide": { anchos: [120, 240], proporcion: 234 / 240 },
  "carga-nino": { anchos: [200, 273], proporcion: 404 / 273 },
  "carga-panel": { anchos: [140, 191], proporcion: 143 / 191 },
  "carga-invernadero": { anchos: [130, 172], proporcion: 146 / 172 },
  "carga-habitat": { anchos: [180, 260], proporcion: 168 / 260 },
} as const;
export type Pieza = keyof typeof PIEZAS;

export function rutaIlustracion(pieza: Pieza, ancho: number): string {
  return `${import.meta.env.BASE_URL}ilustraciones/${pieza}-${ancho}.webp`;
}

export function Ilustracion({ pieza, className, sizes }: { pieza: Pieza; className: string; sizes: string }) {
  const { anchos, proporcion } = PIEZAS[pieza];
  const grande = anchos[anchos.length - 1]!;
  return (
    <img className={`ilu ${className}`} src={rutaIlustracion(pieza, grande)} srcSet={anchos.map((a) => `${rutaIlustracion(pieza, a)} ${a}w`).join(", ")}
      sizes={sizes} width={grande} height={Math.round(grande * proporcion)} alt="" decoding="async" draggable={false} />
  );
}
