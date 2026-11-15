import { expect, test, type Page } from "@playwright/test";

const TURNO_MS = 4000;
async function avanzarHasta(page: Page, listo: () => Promise<boolean>, maxTurnos = 12) {
  for (let i = 0; i < maxTurnos; i++) {
    if (await listo()) return;
    const reanudar = page.getByTestId("resume-event");
    if (await reanudar.isVisible()) await reanudar.click();
    await page.clock.runFor(TURNO_MS);
    await page.waitForTimeout(30);
  }
  throw new Error(`No se cumplió la condición tras ${maxTurnos} turnos`);
}

for (const idioma of ["en", "es"] as const) {
  test(`Jezero completa: decisiones, fuente y telemetría (${idioma})`, async ({ page }) => {
    const errores: string[] = [];
    page.on("pageerror", e => errores.push(e.message));
    page.on("console", m => { if (m.type() === "error") errores.push(m.text()); });
    await page.clock.install();
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await page.getByTestId("language").selectOption(idioma);
    await expect(page.locator("html")).toHaveAttribute("lang", idioma);
    await page.getByTestId("start-mission").click();
    const omitir = page.getByTestId("intro-skip");
    const orbita = page.getByTestId("orbit-screen");
    await expect(orbita.or(omitir).first()).toBeVisible();
    if (await omitir.isVisible()) await omitir.click();
    await expect(orbita).toBeVisible();
    await page.getByTestId("continue-orbit").click();
    await expect(page.getByTestId(/^landing-option-/)).toHaveCount(4);
    await page.getByTestId("landing-option-llanura-central").click();
    const listo = page.getByTestId("modules-ready");
    await expect(listo).toBeDisabled();
    await page.getByTestId("module-panel_solar").click();
    await expect(page.getByTestId("module-panel_solar")).toBeDisabled();
    await page.getByTestId("module-escudo").click();
    await expect(listo).toBeEnabled();
    await listo.click();
    const tormenta = page.getByTestId("storm-screen");
    await avanzarHasta(page, () => tormenta.isVisible());
    const fuente = tormenta.getByTestId("source-card").first();
    await expect(fuente).toBeVisible();
    await expect(fuente.getByRole("link").first()).toHaveAttribute("href", /^https:\/\//);
    await page.getByTestId("verify-iris").click();
    await expect(page.getByTestId("verify-iris")).toHaveCount(0);
    await page.getByTestId("dilemma-subir_escudo").click();
    await expect(page.getByTestId("dilemma-subir_escudo")).toHaveAttribute("aria-pressed", "true");
    await page.getByTestId("dilemma-confirm").click();
    await page.getByTestId("send-telemetry").click();
    const final = page.getByTestId("mission-result");
    await avanzarHasta(page, () => final.isVisible());
    await expect(final).toHaveAttribute("data-result", "exito");
    await expect(final.getByTestId("source-card").first()).toBeVisible();
    await page.getByTestId("play-again").click();
    await expect(page.getByTestId("app")).toHaveAttribute("data-phase", "inicio");
    expect(errores, errores.join(" | ")).toEqual([]);
  });
}
