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

/** "Choose your mission": la ruta dorada juega Jezero (la primera tarjeta). */
export async function elegirJezero(page: Page) {
  await expect(page.getByRole("heading", { name: "Choose your mission" })).toBeVisible();
  await page.locator('[data-mision="jezero-dorada"]').getByRole("button", { name: "Play this mission" }).click();
}
