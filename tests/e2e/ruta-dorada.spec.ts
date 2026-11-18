import { expect, test, type Page } from "@playwright/test";
import { arrancarEnCalidadBaja } from "./calidad";
import { llegarYExplorar } from "./entrada";

test.beforeEach(async ({ page }) => arrancarEnCalidadBaja(page));

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

/** Pasa el aviso de tormenta (Meteoróloga, Doctora, Ingeniera) antes de elegir módulos, con "Continue". */
async function pasarAviso(page: Page) {
  const continuar = page.locator(".dialogo-experto").getByRole("button", { name: "Continue", exact: true });
  for (let i = 0; i < 4 && (await continuar.isVisible()); i++) {
    await continuar.click();
    await page.waitForTimeout(100);
  }
}

test("ruta dorada: de la órbita al resumen, en inglés", async ({ page }) => {
  // Recorre la misión entera con la escena 3D: en CI (sin GPU, dos trabajadores) tarda cerca de 90 s, el
  // límite general, y se pasaba según la carga de la otra prueba. Mismo margen que "seguir a Iris". Las
  // esperas de cada paso no cambian.
  test.setTimeout(180_000);
  const errores: string[] = [];
  page.on("pageerror", (e) => errores.push(e.message));
  page.on("console", (m) => m.type() === "error" && errores.push(m.text()));

  await page.clock.install();
  await page.goto("/");
  await page.getByRole("button",{name:"Play as guest",exact:true}).click();

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
  await expect(page.getByRole("heading", { name: "Observe Mars" })).toBeVisible();
  for (const m of ["Battery", "Signal", "Satellite shield"]) {
    await expect(page.getByRole("meter", { name: m })).toBeVisible();
  }

  // Paso 3: sitios candidatos con 3 criterios y costo visible; ninguno es perfecto.
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Choose where to land" })).toBeVisible();
  // Cada cambio de pantalla deja el foco en la pantalla nueva (su título o su primer control).
  await expect(page.locator(".transicion :focus")).toHaveCount(1);
  const aterrizar = page.getByRole("button", { name: "Land here" });
  expect(await aterrizar.count()).toBeGreaterThanOrEqual(2);
  await expect(page.getByText("Sunlight").first()).toBeVisible();
  await aterrizar.first().click();

  // E8 (inicio/04): llegada a Jezero con Skip y, ya en la base, "Your crew is ready" con los controles.
  // La llegada no avanza sola: el reloj es simulado. Mientras la tarjeta está abierta, nada se mueve.
  await expect(page.getByRole("heading", { name: "Arriving at Jezero" })).toBeVisible();
  await page.getByRole("button", { name: "Skip", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Your crew is ready" })).toBeVisible();
  await page.getByRole("button", { name: "Show controls" }).click();
  for (const c of ["Move: W A S D or the arrow keys", "Jump: Space", "Talk or use: E", "Change the camera: V"]) {
    await expect(page.getByText(c)).toBeVisible();
  }
  await page.getByRole("button", { name: "Hide controls" }).click();
  await expect(page.getByText("Jump: Space")).toHaveCount(0);
  await page.getByRole("button", { name: "Explore the base" }).click();
  await expect(page.getByRole("heading", { name: "Your crew is ready" })).toHaveCount(0);
  await pasarAviso(page);

  // Paso 4: colocar 2 módulos, cada uno con costo ahora y beneficio después.
  await expect(page.getByRole("heading", { name: "Place 2 modules" })).toBeVisible();
  await expect(page.getByRole("meter", { name: "Energy" })).toBeVisible();
  const listo = page.getByRole("button", { name: "Base ready. Start the clock!" });
  await expect(listo).toBeDisabled();
  // E1: sin lista ni panel fijos. La tarjeta nace al preguntar a la Ingeniera (o en un anclaje con [E]),
  // una a la vez, y se cierra al decidir; Back no cobra.
  await expect(page.getByText("Costs now")).toHaveCount(0);
  const preguntar = page.getByRole("button", { name: "Ask the Engineer" });
  const tarjeta = page.locator('[role="dialog"].tc');
  const colocar = page.getByRole("button", { name: "Place", exact: true });
  for (let i = 0; i < 2; i++) {
    await preguntar.click();
    await expect(tarjeta).toHaveCount(1);
    await tarjeta.locator("ul button:not([disabled])").first().click();
    await expect(page.getByText("Costs now").first()).toBeVisible();
    await colocar.click();
    await expect(tarjeta).toHaveCount(0); // se cierra al decidir
  }
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
  // A2 + #344: la guía de Iris llega a la escena; su globo sobre el rover dice adónde ir (el taller).
  await expect(page.locator('.globo-escena[data-actor="iris"]')).toContainText("workshop");
  // E3, HUD progresivo: Crew llega con la primera conversación, que ahora es el aviso de tormenta de los
  // módulos (Jezero v2, antes de elegir módulos); Map y Pause sí, porque ya hay un objetivo.
  await expect(crew).toBeVisible();
  await expect(page.getByRole("button", { name: "Map", exact: true })).toBeVisible();

  // Acercarse a un lugar nunca cobra: [E] abre el plan del lugar y "Back" no cambia nada.
  // Con el reloj en pausa ANTES de caminar: sin GPU (CI) la caminata es lenta y, con el reloj andando,
  // llegaría la tormenta del turno 3 antes que el niño a la consola. La pausa no frena la caminata.
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  // El niño arranca lejos de la consola: elegirla en el mapa lo lleva caminando hasta su punto de uso.
  await page.getByRole("button", { name: "Map", exact: true }).click();
  await page.getByRole("list", { name: "Places" }).getByRole("button", { name: /Mission control/ }).click();
  await expect(page.getByRole("button", { name: "Wait a turn at the console" })).toBeVisible({ timeout: 60_000 });
  const energiaAntes = await page.getByRole("meter", { name: "Energy" }).getAttribute("aria-valuenow");
  await page.getByRole("button", { name: "Wait a turn at the console" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Back", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(await page.getByRole("meter", { name: "Energy" }).getAttribute("aria-valuenow")).toBe(energiaAntes);
  // Conversación en el mundo: caminar al sensor y hablar con la Meteoróloga (Crew ya está desde el aviso).
  await expect(crew).toBeVisible();
  await page.getByRole("button", { name: "Map", exact: true }).click();
  await page.getByRole("list", { name: "Places" }).getByRole("button", { name: /Radiation sensor/ }).click();
  await page.getByRole("button", { name: "Ask the Solar Meteorologist" }).click({ timeout: 60_000 });
  await expect(crew).toBeVisible();
  await page.keyboard.press("Escape");
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
  // Jezero v2: el dosímetro aparece al llegar la tormenta, sin hablar con la Doctora, con el límite de entrenamiento y la tasa.
  const dosimetro = page.getByRole("status").filter({ hasText: /Radiation \d/ });
  await expect(dosimetro).toContainText(/training limit 4/);
  await expect(dosimetro).toContainText(/\+\d(\.\d)? this turn/);
  await expect(page.getByText(/budget/i)).toHaveCount(0);
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
  await page.getByRole("button", { name: "Back", exact: true }).click();

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

/**
 * #344 (A2, Hecho cuando): seguir a Iris del paso 4 al 8 sin abrir Crew, solo con el mapa para caminar y
 * la tecla E. El globo de Iris sobre el rover dice adónde ir; la prueba lee ese globo y va adonde pide.
 * Con el reloj simulado: ningún turno pasa mientras el niño camina (CI no tiene GPU y la caminata es lenta).
 * Va en este archivo, después de la ruta dorada: los tests de un archivo corren en fila (fullyParallel
 * false), y dos recorridos completos a la vez sin GPU se quitan tiempo y agotan los 90 s de la ruta dorada.
 */


/**
 * Lo que pide cada globo de Iris: el lugar del mapa y el aviso [E] que se espera al llegar. Iris guía con
 * el lugar en el nivel `tutorial` ("To Mission control!") y con una pregunta en `pistas` ("How do we
 * talk to Earth?"): textos de `agents/i18n/en.json`.
 */
const DESTINOS: { pide: RegExp; lugar: RegExp; aviso: RegExp }[] = [
  { pide: /fix me|Who fixes machines|check with the Engineer/, lugar: /^Workshop/, aviso: /Engineer|workshop/i },
  { pide: /send our news back home|How do we talk to Earth/, lugar: /^Mission control/, aviso: /Send telemetry from the console/ },
  { pide: /protect the crew|shield is weak|shield looks thin|Life support is low|safe place|air and water/, lugar: /^Habitat/, aviso: /shelter/ },
  { pide: /Energy is low|how much energy|smells like energy|eats energy/, lugar: /^Workshop/, aviso: /Engineer|workshop/i },
  { pide: /what the Sun is doing|who reads the sky/, lugar: /^Radiation sensor/, aviso: /Meteorologist/ },
];
/** El globo del final: Iris pide verse en la consola para repasar la misión. */
const FINAL = /Meet me at|look at everything we did|Where did it all start/;


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
  await page.getByRole("button",{name:"Play as guest",exact:true}).click();
  await page.getByRole("button", { name: "Start mission" }).click();
  await page.getByRole("button", { name: "Skip intro" }).click();
  await page.getByRole("button", { name: "Skip", exact: true }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Land here" }).first().click();
  await llegarYExplorar(page);
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
  await irYUsarConE(page, /^Workshop/, /Engineer|workshop/i);
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
