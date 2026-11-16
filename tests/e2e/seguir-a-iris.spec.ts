import { expect, test, type Page } from "@playwright/test";
import { arrancarEnCalidadBaja } from "./calidad";

test.beforeEach(async ({ page }) => arrancarEnCalidadBaja(page));

/**
 * #344 (A2, Hecho cuando): seguir a Iris del paso 4 al 8 sin abrir Crew, solo con el mapa para caminar y
 * la tecla E. El globo de Iris sobre el rover dice adónde ir; la prueba lee ese globo y va adonde pide.
 * Con el reloj simulado: ningún turno pasa mientras el niño camina (CI no tiene GPU y la caminata es lenta).
 */

const TURNO_MS = 4000;

/**
 * Lo que pide cada globo de Iris: el lugar del mapa y el aviso [E] que se espera al llegar. Iris guía con
 * el lugar en el nivel `tutorial` ("To Mission control!") y con una pregunta en `pistas` ("How do we
 * talk to Earth?"): textos de `agents/i18n/en.json`.
 */
const DESTINOS: { pide: RegExp; lugar: RegExp; aviso: RegExp }[] = [
  { pide: /fix me|Who fixes machines|check with the Engineer/, lugar: /^Workshop/, aviso: /Repair Iris/ },
  { pide: /send our news back home|How do we talk to Earth/, lugar: /^Mission control/, aviso: /Send telemetry from the console/ },
  { pide: /protect the crew|shield is weak|shield looks thin|Life support is low|safe place|air and water/, lugar: /^Habitat/, aviso: /shelter/ },
  { pide: /Energy is low|how much energy|smells like energy|eats energy/, lugar: /^Workshop/, aviso: /Engineer|Repair Iris/ },
  { pide: /what the Sun is doing|who reads the sky/, lugar: /^Radiation sensor/, aviso: /Meteorologist/ },
];
/** El globo del final: Iris pide verse en la consola para repasar la misión. */
const FINAL = /Meet me at|look at everything we did|Where did it all start/;

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

/**
 * Deja el mundo libre antes de caminar. El reloj es simulado (`page.clock`): ningún turno corre mientras el
 * niño camina salvo que la prueba lo adelante, así que no hace falta pausar (y pausar reabre los avisos del
 * último turno, que se muestran en pausa). Si hay avisos abiertos, se cierran con su "Resume", como el niño.
 */
async function liberarMundo(page: Page) {
  const avisos = page.locator(".base-novedades");
  if (await avisos.isVisible().catch(() => false)) {
    await page.locator(".base-panel").getByRole("button", { name: /Resume/ }).first().click();
    await expect(avisos).toHaveCount(0);
  }
}

/** Camina con el mapa hasta `lugar` y, al llegar, usa lo que haya con la tecla E. */
async function irYUsarConE(page: Page, lugar: RegExp, aviso: RegExp) {
  await liberarMundo(page);
  await page.getByRole("button", { name: "Map", exact: true }).click();
  await page.getByRole("list", { name: "Places" }).getByRole("button", { name: lugar }).click();
  await expect(page.getByRole("button", { name: aviso }).first()).toBeVisible({ timeout: 60_000 });
  // Los efectos de React esperan a que corra el reloj simulado (en pausa: ningún turno pasa).
  await page.clock.runFor(100);
  await page.keyboard.press("e");
}

/** Si [E] abrió una decisión, se confirma y se vuelve a explorar; si abrió una charla, se cierra. */
async function decidirOCerrar(page: Page) {
  const confirmar = page.getByRole("dialog").getByRole("button", { name: "Confirm" });
  if (await confirmar.isVisible().catch(() => false)) {
    await confirmar.click();
    await page.getByRole("button", { name: "Return to exploration" }).click();
  } else {
    await page.keyboard.press("Escape");
  }
}

test("seguir a Iris del paso 4 al 8 sin abrir Crew, con el mapa y la tecla E", async ({ page }) => {
  test.setTimeout(240_000);
  const errores: string[] = [];
  page.on("pageerror", (e) => errores.push(e.message));
  page.on("console", (m) => m.type() === "error" && errores.push(m.text()));
  const crewAbierto = page.getByRole("heading", { name: "Your crew" });

  await page.clock.install();
  await page.goto("/");
  await page.getByRole("button", { name: "Start mission" }).click();
  await page.getByRole("button", { name: "Skip intro" }).click();
  await page.getByRole("button", { name: "Skip", exact: true }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Land here" }).first().click();
  for (let i = 0; i < 2; i++) {
    await page.getByRole("button", { name: "Ask the Engineer" }).click();
    await page.locator('[role="dialog"].tc ul button:not([disabled])').first().click();
    await page.getByRole("button", { name: "Place", exact: true }).click();
    await expect(page.locator('[role="dialog"].tc')).toHaveCount(0);
  }
  await page.getByRole("button", { name: "Base ready. Start the clock!" }).click();

  // Paso 4: Iris pide ir al taller a preguntarle a la Ingeniera.
  const globoIris = page.locator('.globo-escena[data-actor="iris"]');
  await expect(globoIris).toContainText("workshop");
  await irYUsarConE(page, /^Workshop/, /Engineer|Repair Iris/);
  await decidirOCerrar(page);

  // Pasos 5 y 6: llega la tormenta y se decide con la Ingeniera (panel de la tormenta, no Crew).
  const tormenta = page.getByRole("heading", { name: "Choose your expert" });
  await avanzarHasta(page, () => tormenta.isVisible());
  await page.getByRole("button", { name: /Engineer/ }).click();
  await page.getByRole("button", { name: "Confirm" }).click();
  await page.getByRole("button", { name: "Return to exploration" }).click();

  // Pasos 7 y 8: se va adonde dice el globo de Iris hasta que pide verse en la consola para terminar.
  const recorrido: string[] = [];
  for (let i = 0; i < 6; i++) {
    await expect(globoIris).toBeVisible();
    const texto = (await globoIris.innerText()).trim();
    recorrido.push(texto);
    if (FINAL.test(texto)) break;
    const destino = DESTINOS.find((d) => d.pide.test(texto));
    expect(destino, `globo de Iris sin destino conocido: "${texto}"`).toBeTruthy();
    await irYUsarConE(page, destino!.lugar, destino!.aviso);
    await decidirOCerrar(page);
  }
  test.info().annotations.push({ type: "recorrido de Iris", description: recorrido.join(" → ") });
  expect(recorrido.at(-1)).toMatch(FINAL);
  // En todo el recorrido no se abrió Crew.
  await expect(crewAbierto).toHaveCount(0);

  expect(errores, `errores de consola: ${errores.join(" | ")}`).toEqual([]);
});
