import type { Page } from "@playwright/test";

/** Clave de `ui/src/juego/ajustes.ts` (`CLAVE_AJUSTES`). */
const CLAVE_AJUSTES = "solar-shield.ajustes.v1";

/**
 * Las e2e prueban el recorrido, no la imagen: arrancan con calidad `baja` (sin sombras, 0,75 de
 * resolución). Sin GPU (CI) la escena se rasteriza en la CPU y en `media` cada fotograma tarda tanto que
 * los turnos y los clics se atrasan. Solo escribe si no hay ajustes guardados: no pisa el idioma ni nada
 * que la prueba haya elegido antes de recargar.
 */
export async function arrancarEnCalidadBaja(page: Page): Promise<void> {
  await page.addInitScript((clave) => {
    if (!localStorage.getItem(clave)) localStorage.setItem(clave, JSON.stringify({ calidad: "baja" }));
  }, CLAVE_AJUSTES);
}
