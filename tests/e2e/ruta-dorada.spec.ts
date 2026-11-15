import { expect, test, type Page } from "@playwright/test";

/**
 * Ruta dorada (issue #41): semilla "jezero-2024-05-20", 8 pasos, en inglés (idioma base).
 * La ui usa un reloj de 4 s por turno; se simula con `page.clock` para no esperar de verdad.
 * Se salta el tiempo con `fastForward` (dispara el turno una vez) en vez de `runFor`: con la escena 3D
 * en la base, `runFor` dibujaba 240 cuadros por turno en el navegador sin GPU y rozaba el límite de 90 s.
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
    await page.clock.fastForward(TURNO_MS);
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

  // E0 Portada (inicio/01): logo oficial, inglés base y aviso de que no es oficial de NASA.
  await expect(page.getByRole("img", { name: "Solar Shield" })).toBeVisible();
  await expect(page.getByText("Unofficial project, not endorsed by NASA")).toBeVisible();
  // Sin partida guardada, "Continue" no está disponible y dice por qué.
  await expect(page.getByRole("button", { name: "Continue" })).toHaveAttribute("aria-disabled", "true");
  await expect(page.getByText("No saved mission yet")).toBeVisible();

  // Fuentes y créditos: qué datos de NASA usamos; se cierra con "Close".
  await page.getByRole("button", { name: "Sources & credits" }).click();
  await expect(page.getByRole("dialog", { name: "Sources & credits" })).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // E1 Intro (inicio/02): primera viñeta y "Skip intro" (FLUJO §7.2).
  await page.getByRole("button", { name: "Start mission" }).click();
  await expect(page.getByRole("heading", { name: "01 / A new mission" })).toBeVisible();
  await page.getByRole("button", { name: "Skip intro" }).click();

  // E2 Carga (inicio/03): indicador sin porcentajes y "Skip".
  await expect(page.getByRole("heading", { name: "Preparing your mission" })).toBeVisible();
  await page.getByRole("button", { name: "Skip", exact: true }).click();

  // Paso 1: la nave suelta el satélite (batería, señal, escudo del satélite).
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
  // Mundo compartido (E5 a E7): se marca el canvas de E5 y tiene que ser el mismo nodo en la base y la tormenta.
  await expect(page.locator("canvas")).toHaveCount(1);
  await page.locator("canvas").evaluate((c) => c.setAttribute("data-prueba", "mundo-e5"));
  await listo.click();

  // Base viva (lámina de juego): el mundo a pantalla completa, sin panel fijo; HUD de 3 recursos (una sola vez),
  // Crew y Map abajo, y el aviso de NASA fuera de la partida (está en la portada y el final).
  const canvasE5 = page.locator('canvas[data-prueba="mundo-e5"]');
  await expect(canvasE5).toHaveCount(1);
  await expect(page.locator("canvas")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Actions" })).toHaveCount(0);
  for (const r of ["Energy", "Life support", "Shielding"]) {
    await expect(page.getByRole("meter", { name: r })).toHaveCount(1);
  }
  await expect(page.getByText("Unofficial project, not endorsed by NASA")).toHaveCount(0);
  const crew = page.getByRole("button", { name: "Crew", exact: true });

  // Acercarse a un lugar nunca cobra: [E] abre el plan del lugar y "Back" no cambia nada.
  // Con el reloj en pausa, para que un turno que pase no se confunda con un cobro.
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  const energiaAntes = await page.getByRole("meter", { name: "Energy" }).getAttribute("aria-valuenow");
  await page.getByRole("button", { name: "Wait a turn at the console" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Back" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(await page.getByRole("meter", { name: "Energy" }).getAttribute("aria-valuenow")).toBe(energiaAntes);
  await page.getByRole("button", { name: "Resume", exact: true }).click();

  // Map abre el plano y la lista de lugares; Escape lo cierra.
  await page.getByRole("button", { name: "Map", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Jezero base map" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Places" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("heading", { name: "Jezero base map" })).toHaveCount(0);

  // Crew abre el panel de decisión con las acciones y la tripulación.
  await crew.click();
  await expect(page.getByRole("heading", { name: "Actions" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your crew" })).toBeVisible();
  // El aterrizaje (paso 3, aterrizar()) ya se cobró: aparece en el registro de causas.
  await page.locator("details summary").click();
  await expect(page.getByText(/Landing at the chosen site/).first()).toBeVisible();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Actions" })).toHaveCount(0);

  // Paso 5: llega la tormenta real del 20 may 2024, con la escena en pausa (E7, panel "Choose your expert").
  const tormenta = page.getByRole("heading", { name: "Choose your expert" });
  await avanzarHasta(page, () => tormenta.isVisible());
  await expect(tormenta).toBeVisible();
  await expect(page.getByText("Paused", { exact: true })).toBeVisible();
  // La tormenta se ve sobre el mismo mundo y sin repetir los medidores en su panel.
  await expect(canvasE5).toHaveCount(1);
  await expect(page.getByRole("meter", { name: "Energy" })).toHaveCount(1);

  // Paso 6: la Ingeniera propone subir el escudo; "Compare your plan" muestra la acción y su costo del motor.
  await page.getByRole("button", { name: /Engineer/ }).click();
  await expect(page.getByRole("heading", { name: "Compare your plan" })).toBeVisible();
  await expect(page.getByText("Costs now").first()).toBeVisible();

  // "Check the source": la Doctora (refugio) y la Ingeniera (escudo nivel 2) se contradicen y la fuente NASA es real, no en vivo.
  await page.getByRole("button", { name: "Check the source" }).click();
  await expect(page.getByRole("heading", { name: "Verify the warning" })).toBeVisible();
  await expect(page.getByText("Everyone to the shelter, now!")).toBeVisible();
  await expect(page.getByText(/put energy into the shield and keep working/)).toBeVisible();
  await expect(page.getByText("Where does this data come from?").first()).toBeVisible();
  await expect(page.getByText("Real curated data, not live").first()).toBeVisible();
  await expect(page.getByRole("link", { name: /View source/ })).toHaveAttribute("href", /ccmc\.gsfc\.nasa\.gov/);
  await page.getByRole("button", { name: "Back" }).click();

  // Confirm manda la decisión al motor y aparece "Decision recorded" con lo que cobró; "Return to exploration" reanuda.
  await expect(page.getByRole("heading", { name: "Compare your plan" })).toBeVisible();
  await page.getByRole("button", { name: "Confirm" }).click();
  await expect(page.getByRole("heading", { name: "Decision recorded" })).toBeVisible();
  await expect(page.getByText("Action confirmed")).toBeVisible();
  await page.getByRole("button", { name: "Return to exploration" }).click();
  // De vuelta en la base, el mismo canvas: la escena no se volvió a montar.
  await expect(canvasE5).toHaveCount(1);
  await expect(page.locator("canvas")).toHaveCount(1);

  // Paso 7: la telemetría se envía y tarda en llegar.
  await crew.click();
  const enviar = page.getByRole("button", { name: /Send telemetry to Earth/ });
  await expect(enviar).toBeVisible();
  await enviar.click();
  // E6: toda acción pasa por el único panel de confirmación (APLICACION §5), con su costo del motor.
  const confirmar = page.getByRole("dialog").getByRole("button", { name: "Confirm" });
  await confirmar.click();
  // Panel 04 también en la base: la tarjeta confirma la acción y "Return to exploration" vuelve a la base.
  await expect(page.getByRole("heading", { name: "Decision recorded" })).toBeVisible();
  await expect(page.getByText("Action confirmed")).toBeVisible();
  await page.getByRole("button", { name: "Return to exploration" }).click();
  await crew.click();
  await expect(page.getByText(/Earth's answer arrives in \d+ turns/)).toBeVisible();

  // Iris dañada (si sigue así tras verificar): se repara desde las acciones.
  const repararIris = page.getByRole("button", { name: "Repair Iris" });
  if (await repararIris.isVisible()) {
    await repararIris.click();
    await confirmar.click();
    await page.getByRole("button", { name: "Return to exploration" }).click();
  } else {
    await page.getByRole("button", { name: "Close", exact: true }).click();
  }

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
