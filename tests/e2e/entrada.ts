import { expect, type Page } from "@playwright/test";

/**
 * E8 (inicio/04): después de elegir el sitio, "Arriving at Jezero" (con `Skip`) y, ya en la base, la
 * tarjeta "Your crew is ready". Pasa las dos como lo haría el niño apurado: `Skip` y `Explore the base`.
 * Si la llegada ya avanzó sola (sin reloj simulado), no hace falta `Skip`.
 */
export async function llegarYExplorar(page: Page) {
  const saltar = page.getByRole("button", { name: "Skip", exact: true });
  const explorar = page.getByRole("button", { name: "Explore the base" });
  await expect(saltar.or(explorar).first()).toBeVisible();
  if (await saltar.isVisible()) await saltar.click();
  await explorar.click();
  await expect(explorar).toHaveCount(0);
}
