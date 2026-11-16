import { expect, test, type Page } from "@playwright/test";
import { arrancarEnCalidadBaja } from "./calidad";

test.beforeEach(async ({ page }) => arrancarEnCalidadBaja(page));

/**
 * Lo que la ruta dorada no cubre: perder, volver a jugar con una partida limpia, continuar una
 * partida guardada después de recargar y recordar el idioma elegido. En inglés (idioma base).
 * La ui usa un reloj de 4 s por turno; se simula con `page.clock` para no esperar de verdad.
 */

const TURNO_MS = 4000;

/** De la portada a la base viva: primer sitio y los dos primeros módulos. */
/** E1: la tarjeta del módulo nace al preguntar a la Ingeniera; se elige el primer módulo libre y se coloca. */
async function colocarModulo(page: Page) {
  await page.getByRole("button", { name: "Ask the Engineer" }).click();
  await page.locator('[data-tarjeta="contextual"] ul button:not([disabled])').first().click();
  await page.getByRole("button", { name: "Place", exact: true }).click();
  await expect(page.locator('[data-tarjeta="contextual"]')).toHaveCount(0);
}

async function llegarALaBase(page: Page) {
  await page.getByRole("button", { name: "Start mission" }).click();
  await page.getByRole("button", { name: "Skip intro" }).click();
  await page.getByRole("button", { name: "Skip", exact: true }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Land here" }).first().click();
  await colocarModulo(page);
  await colocarModulo(page);
  await page.getByRole("button", { name: "Base ready. Start the clock!" }).click();
  await expect(page.getByRole("button", { name: "Crew", exact: true })).toBeVisible();
}

/** Crew abre el panel de decisión con las acciones, la tripulación y el registro. */
async function abrirTripulacion(page: Page) {
  await page.getByRole("button", { name: "Crew", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Actions" })).toBeVisible();
}

/** Avanza turnos hasta que `listo` sea verdadero, reanudando las pausas como lo haría el jugador. */
async function avanzarHasta(page: Page, listo: () => Promise<boolean>, maxTurnos = 60) {
  const seguir = page.getByRole("button", { name: /Resume/ });
  for (let i = 0; i < maxTurnos; i++) {
    if (await listo()) return;
    if (await seguir.first().isVisible()) await seguir.first().click();
    await page.clock.fastForward(TURNO_MS);
    await page.waitForTimeout(30);
  }
  throw new Error(`No se cumplió la condición en ${maxTurnos} turnos`);
}

const energia = (page: Page) => page.getByRole("meter", { name: "Energy" }).first().getAttribute("aria-valuenow");

test("sin enviar la telemetría la base se pierde, y \"Play again\" empieza una partida limpia", async ({ page }) => {
  const errores: string[] = [];
  page.on("pageerror", (e) => errores.push(e.message));
  page.on("console", (m) => m.type() === "error" && errores.push(m.text()));

  await page.clock.install();
  await page.goto("/");
  await llegarALaBase(page);
  const energiaInicial = await energia(page);

  // Llega la tormenta: el jugador decide con la Ingeniera y vuelve, pero nunca avisa a la Tierra.
  const tormenta = page.getByRole("heading", { name: "Choose your expert" });
  await avanzarHasta(page, () => tormenta.isVisible());
  await page.getByRole("button", { name: /Engineer/ }).click();
  await page.getByRole("button", { name: "Confirm" }).click();
  await page.getByRole("button", { name: "Return to exploration" }).click();

  // Se acaba el plazo sin telemetría: derrota, con la explicación de por qué.
  const derrota = page.getByRole("heading", { name: /The base could not hold/ });
  const victoria = page.getByRole("heading", { name: "Mission complete!" });
  await avanzarHasta(page, async () => (await derrota.isVisible()) || (await victoria.isVisible()), 120);
  await expect(derrota).toBeVisible();
  await expect(page.getByRole("heading", { name: "What happened and why" })).toBeVisible();

  // Volver a jugar: portada, sin partida que continuar (la terminada no se guarda).
  await page.getByRole("button", { name: "Play again" }).click();
  await expect(page.getByRole("button", { name: "Start mission" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue" })).toHaveAttribute("aria-disabled", "true");

  // La segunda partida arranca de cero: mismos recursos iniciales y ningún módulo colocado.
  await page.getByRole("button", { name: "Start mission" }).click();
  await page.getByRole("button", { name: "Skip intro" }).click();
  await page.getByRole("button", { name: "Skip", exact: true }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Land here" }).first().click();
  await expect(page.getByText("Placed: 0 of 2")).toBeVisible();
  await expect(page.getByRole("button", { name: "Base ready. Start the clock!" })).toBeDisabled();
  await colocarModulo(page);
  await colocarModulo(page);
  await page.getByRole("button", { name: "Base ready. Start the clock!" }).click();
  await abrirTripulacion(page);
  expect(await energia(page)).toBe(energiaInicial);

  expect(errores, `errores de consola: ${errores.join(" | ")}`).toEqual([]);
});

test("\"Continue\" recupera la partida guardada después de recargar la página", async ({ page }) => {
  await page.clock.install();
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Continue" })).toHaveAttribute("aria-disabled", "true");
  await llegarALaBase(page);
  // En pausa antes de leer: la pausa también se guarda, y así ningún turno cambia la energía entre la
  // lectura, la recarga y "Continue" (en CI, sin GPU, ese tramo puede tardar más que un turno).
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  const energiaAntes = await energia(page);

  await page.reload();
  // La portada ofrece continuar y ya no dice que falta una partida guardada.
  const continuar = page.getByRole("button", { name: "Continue" });
  await expect(continuar).not.toHaveAttribute("aria-disabled", "true");
  await expect(page.getByText("No saved mission yet")).toHaveCount(0);
  await continuar.click();

  // Vuelve a la base con los mismos recursos y la historia de la partida (el aterrizaje ya cobrado).
  await abrirTripulacion(page);
  expect(await energia(page)).toBe(energiaAntes);
  await page.locator("details summary").click();
  await expect(page.getByText(/Landing at the chosen site/).first()).toBeVisible();
});

test("el idioma elegido en la portada se recuerda al recargar", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Start mission" })).toBeVisible();
  await page.getByRole("button", { name: "ES", exact: true }).click();
  await expect(page.getByRole("button", { name: "Empezar misión" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Empezar misión" })).toBeVisible();
});

test("perder WebGL deja la misma partida en el respaldo 2D, y el mapa lleva al niño a un lugar", async ({ page }) => {
  await page.clock.install();
  await page.goto("/");
  await llegarALaBase(page);
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  const energiaAntes = await energia(page);

  // Se pierde el contexto WebGL: la escena avisa y el mundo pasa al hueco 2D sin reiniciar nada.
  await page.locator("canvas").evaluate((c: HTMLCanvasElement) => {
    const gl = c.getContext("webgl2") ?? c.getContext("webgl");
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  });
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.locator(".mundo-hueco")).toHaveCount(1);
  expect(await energia(page)).toBe(energiaAntes);

  // Sin escena que camine, el mapa deja al niño en el lugar elegido y [E] ofrece lo que se hace allí.
  await page.getByRole("button", { name: "Map", exact: true }).click();
  await page.getByRole("list", { name: "Places" }).getByRole("button", { name: /^Workshop/ }).click();
  await expect(page.getByRole("button", { name: "Repair Iris in the workshop" })).toBeVisible();
  await page.getByRole("button", { name: "Repair Iris in the workshop" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Back" }).click();
  expect(await energia(page)).toBe(energiaAntes);
});
