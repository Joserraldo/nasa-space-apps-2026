import type { FaseVista } from "../escena/vista";

/**
 * Aviso para girar el teléfono (ESCENAS §2.7, FLUJO §9). Solo lógica: el aspecto lo
 * pone la pantalla. Las fases con mapa o con la base se juegan en horizontal; en
 * vertical se muestra el aviso en vez de la escena.
 *
 * Girar no reinicia nada: el estado vive en el reductor y el motor, así que esta
 * función solo decide si se tapa la pantalla, nunca la desmonta.
 */
export const FASES_HORIZONTALES: ReadonlySet<FaseVista> = new Set<FaseVista>(["satelite", "modulos", "base", "tormenta"]);

export interface Pantalla {
  ancho: number;
  alto: number;
}

export function pideGirar(fase: FaseVista, { ancho, alto }: Pantalla): boolean {
  return FASES_HORIZONTALES.has(fase) && alto > ancho;
}

/** Tamaño actual de la ventana; null fuera del navegador (pruebas, render del servidor). */
export function pantallaActual(): Pantalla | null {
  if (typeof window === "undefined") return null;
  return { ancho: window.innerWidth, alto: window.innerHeight };
}
