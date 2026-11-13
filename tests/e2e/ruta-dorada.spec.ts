import { expect, test, type Page } from "@playwright/test";

/**
 * Ruta dorada (issue #41): semilla "jezero-2024-05-20", 8 pasos, en inglés (idioma base).
 * La ui usa un reloj de 4 s por turno; se simula con `page.clock` para no esperar de verdad.
 * Selectores: roles y texto de `ui/i18n/en.json`. No hay data-testid todavía (ver tests/README.md).
 */

const TURNO_MS = 4000;

/** Avanza turnos del reloj de la ui hasta que `listo` sea verdadero. */
async function avanzarHasta(page: Page, listo: () => Promise<boolean>, maxTurnos = 60) {
  const seguir = page.getByRole("button", { name: /Resume/ });
  for (let i = 0; i < maxTurnos; i++) {
    if (await listo()) return;
    // La ui pausa sola ante novedades (mala suerte, Iris); se reanuda como lo haría el jugador.
    if (await seguir.first().isVisible()) await seguir.first().click();
    await page.clock.runFor(TURNO_MS);
    await page.waitForTimeout(30);
  }
  throw new Error(`No se cumplió la condición en ${maxTurnos} turnos`);
}

test("ruta dorada: de la órbita al resumen, en inglés", async ({ page }) => {
  const errores: string[] = [];
  page.on("pageerror", (e) => errores.push(e.message));
  page.on("console", (m) => m.type() === "error" && errores.push(m.text()));

  await page.clock.install();
  await page.goto("/");

  // Idioma base: inglés, aviso de que no es oficial de NASA.
  await expect(page.getByRole("heading", { name: "Solar Shield" })).toBeVisible();
  await expect(page.getByText("Unofficial project, not endorsed by NASA")).toBeVisible();

  // Paso 1: la nave suelta el satélite (batería, señal, escudo del satélite).
  await page.getByRole("button", { name: "Start the mission" }).click();
  await expect(page.getByRole("heading", { name: "The ship releases the satellite" })).toBeVisible();
  for (const m of ["Battery", "Signal", "Satellite shield"]) {
    await expect(page.getByRole("meter", { name: m })).toBeVisible();
  }

  // Paso 3: sitios candidatos con 3 criterios y costo visible; ninguno es perfecto.
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Choose where to land" })).toBeVisible();
  const aterrizar = page.getByRole("button", { name: "Land here" });
  expect(await aterrizar.count()).toBeGreaterThanOrEqual(2);
  await expect(page.getByText("Sunlight").first()).toBeVisible();
  await aterrizar.first().click();

  // Paso 4: colocar 2 módulos, cada uno con costo ahora y beneficio después.
  await expect(page.getByRole("heading", { name: "Place 2 modules" })).toBeVisible();
  await expect(page.getByText("Costs now").first()).toBeVisible();
  await expect(page.getByRole("meter", { name: "Energy" })).toBeVisible();
  const listo = page.getByRole("button", { name: "Base ready. Start the clock!" });
  await expect(listo).toBeDisabled();
  const colocar = page.getByRole("button", { name: "Place", exact: true });
  await colocar.first().click();
  await colocar.first().click(); // el primero ya quedó con "✓"; el siguiente "Place" es otro módulo
  await expect(listo).toBeEnabled();
  await listo.click();

  // Base viva: HUD de 3 recursos, tripulación, acciones.
  await expect(page.getByRole("heading", { name: "Actions" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your crew" })).toBeVisible();
  for (const r of ["Energy", "Life support", "Shielding"]) {
    await expect(page.getByRole("meter", { name: r })).toBeVisible();
  }

  // Paso 5: llega la tormenta real del 20 may 2024, con pausa y tarjeta de fuente.
  const tormenta = page.getByRole("heading", { name: /Space weather alert/ });
  await avanzarHasta(page, () => tormenta.isVisible());
  await expect(tormenta).toBeVisible();
  // Tarjeta de fuente (hay varias en pantalla: la de la tormenta y la de cada consejo).
  await expect(page.getByText("Where does this data come from?").first()).toBeVisible();
  await expect(page.getByRole("link", { name: "See the source" }).first()).toHaveAttribute("href", /ccmc\.gsfc\.nasa\.gov/);
  await expect(page.getByText("Real curated data, not live").first()).toBeVisible();

  // Paso 6: la Doctora (refugio) y la Ingeniera (energía al escudo) se contradicen.
  await expect(page.getByRole("heading", { name: "Your crew disagrees" })).toBeVisible();
  await expect(page.getByText("Everyone to the shelter, now!")).toBeVisible();
  await expect(page.getByText(/put energy into the shield and keep working/)).toBeVisible();
  const refugio = page.getByRole("button", { name: "Go to the shelter" });
  const escudo = page.getByRole("button", { name: /Send energy to the shield/ });
  await expect(refugio).toBeVisible();
  await expect(escudo).toBeVisible();

  // Iris, dañada, dice "todo perfecto" aunque el escudo no lo está: el jugador verifica con la Ingeniera.
  await expect(page.getByText("Everything is perfect, commander!")).toBeVisible();
  await page.getByRole("button", { name: "Check with the Engineer" }).click();
  await expect(page.getByRole("button", { name: "Check with the Engineer" })).toHaveCount(0);

  await escudo.click();
  await expect(escudo).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Continue" }).click();

  // Paso 7: la telemetría se envía y tarda en llegar.
  const enviar = page.getByRole("button", { name: /Send telemetry to Earth/ });
  await expect(enviar).toBeVisible();
  await enviar.click();
  await expect(page.getByText(/Earth's answer arrives in \d+ turns/)).toBeVisible();

  // Iris dañada (si sigue así tras verificar): se repara desde las acciones.
  const repararIris = page.getByRole("button", { name: "Repair Iris" });
  if (await repararIris.isVisible()) await repararIris.click();

  // Paso 8: cadena de causas y tarjeta de ciencia.
  const fin = page.getByRole("heading", { name: /Mission complete!|The base could not hold/ });
  await avanzarHasta(page, () => fin.isVisible(), 120);
  await expect(page.getByRole("heading", { name: "What happened and why" })).toBeVisible();
  await expect(page.getByText("Caused by your decisions").first()).toBeVisible();
  await expect(page.getByText("Bad luck (real space hazards)").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "The real science behind it" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Play again" })).toBeVisible();

  expect(errores, `errores de consola: ${errores.join(" | ")}`).toEqual([]);
});
