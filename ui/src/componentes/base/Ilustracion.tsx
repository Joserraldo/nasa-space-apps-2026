/**
 * Ilustraciones originales de María Paula para las pantallas de entrada. Cada pieza tiene AVIF y WebP en
 * dos anchos escrito por `tests/capturas/ilustraciones.mjs`; con `srcset` y `sizes` el navegador baja solo el
 * que necesita. Son decorado: van dentro de un contenedor `aria-hidden` y sin texto alternativo.
 */

/** Anchos escritos por el guion y proporción (alto / ancho) de cada pieza, para reservar su lugar. */
export const PIEZAS = {
  "portada-nino": { anchos: [448, 656], proporcion: 851 / 658 },
  "portada-nave": { anchos: [280, 560], proporcion: 487 / 577 },
  "portada-planeta": { anchos: [200, 400], proporcion: 361 / 658 },
  "portada-asteroide": { anchos: [120, 240], proporcion: 365 / 374 },
  "carga-nino": { anchos: [200, 384], proporcion: 593 / 389 },
  "carga-panel": { anchos: [140, 280], proporcion: 211 / 284 },
  "carga-invernadero": { anchos: [130, 248], proporcion: 220 / 249 },
  "carga-habitat": { anchos: [180, 360], proporcion: 246 / 382 },
} as const;
export type Pieza = keyof typeof PIEZAS;

export function rutaIlustracion(pieza: Pieza, ancho: number, formato: "avif" | "webp" = "webp"): string {
  return `${import.meta.env.BASE_URL}ilustraciones/${pieza}-${ancho}.${formato}`;
}

export function Ilustracion({ pieza, className, sizes }: { pieza: Pieza; className: string; sizes: string }) {
  const { anchos, proporcion } = PIEZAS[pieza];
  const grande = anchos[anchos.length - 1]!;
  const srcSet = (formato: "avif" | "webp") => anchos.map((a) => `${rutaIlustracion(pieza, a, formato)} ${a}w`).join(", ");
  return (
    <picture>
      <source type="image/avif" srcSet={srcSet("avif")} sizes={sizes} />
      <img className={`ilu ${className}`} src={rutaIlustracion(pieza, grande)} srcSet={srcSet("webp")}
        sizes={sizes} width={grande} height={Math.round(grande * proporcion)} alt="" decoding="async" draggable={false} />
    </picture>
  );
}
