// Captura la ruta dorada del juego REAL (ui/) a 1920x1080, en inglés y en español.
// Sigue los mismos pasos que tests/e2e/ruta-dorada.spec.ts (semilla dorada, reloj simulado).
// Uso (con la ui corriendo):  node pitch/trailer/capturar.mjs http://127.0.0.1:5173
// Salida: pitch/trailer/assets/juego/<nn>-<nombre>-<en|es>.png  (no se sube al repo)
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.argv[2] ?? "http://127.0.0.1:5173";
const OUT = join(dirname(fileURLToPath(import.meta.url)), "assets", "juego");
mkdirSync(OUT, { recursive: true });
const TURNO_MS = 4000;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, locale: "en-US" });
await page.clock.install();
await page.goto(BASE);
await page.getByRole("heading", { name: "Solar Shield" }).waitFor();
const idioma = page.locator("select:has(option[value=es])");

/** Toma la misma pantalla en inglés y en español (el estado del juego no cambia). */
async function foto(n, nombre, foco) {
  for (const l of ["en", "es"]) {
    await idioma.selectOption(l);
    await page.waitForTimeout(150);
    if (foco) await foco().scrollIntoViewIfNeeded().catch(() => {});
    else await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(150);
    await page.screenshot({ path: join(OUT, `${String(n).padStart(2, "0")}-${nombre}-${l}.png`) });
  }
  await idioma.selectOption("en");
  await page.waitForTimeout(100);
}

async function avanzarHasta(listo, max = 60) {
  const seguir = page.getByRole("button", { name: /Resume/ });
  for (let i = 0; i < max; i++) {
    if (await listo()) return;
    if (await seguir.first().isVisible()) await seguir.first().click();
    await page.clock.runFor(TURNO_MS);
    await page.waitForTimeout(30);
  }
  throw new Error("no se cumplió la condición");
}

await foto(1, "inicio");
await page.getByRole("button", { name: "Start the mission" }).click();
await page.getByRole("heading", { name: "The ship releases the satellite" }).waitFor();
await foto(2, "satelite");
await page.getByRole("button", { name: "Continue" }).click();
await page.getByRole("heading", { name: "Choose where to land" }).waitFor();
await foto(3, "aterrizaje");
await page.getByRole("button", { name: "Land here" }).first().click();
await page.getByRole("heading", { name: "Place 2 modules" }).waitFor();
const colocar = page.getByRole("button", { name: "Place", exact: true });
await colocar.first().click();
await colocar.first().click();
await foto(4, "modulos");
await page.getByRole("button", { name: "Base ready. Start the clock!" }).click();
await page.getByRole("heading", { name: "Actions" }).waitFor();
await foto(5, "base");

const tormenta = page.getByRole("heading", { name: /Space weather alert/ });
await avanzarHasta(() => tormenta.isVisible());
await foto(6, "tormenta", () => tormenta);
await foto(7, "fuente", () => page.getByText("Where does this data come from?").first());
await foto(8, "expertos", () => page.getByRole("heading", { name: "Your crew disagrees" }));
await foto(9, "iris", () => page.getByText("Everything is perfect, commander!"));
await page.getByRole("button", { name: "Check with the Engineer" }).click();
await page.waitForTimeout(200);
await foto(10, "verificar", () => page.getByRole("button", { name: "Go to the shelter" }));
const escudo = page.getByRole("button", { name: /Send energy to the shield/ });
await escudo.click();
await page.getByRole("button", { name: "Continue" }).click();
const enviar = page.getByRole("button", { name: /Send telemetry to Earth/ });
await enviar.waitFor();
await enviar.click();
await page.getByText(/Earth's answer arrives in \d+ turns/).waitFor();
await foto(11, "telemetria", () => page.getByText(/Earth's answer arrives in \d+ turns/));
const reparar = page.getByRole("button", { name: "Repair Iris" });
if (await reparar.isVisible()) await reparar.click();
const fin = page.getByRole("heading", { name: /Mission complete!|The base could not hold/ });
await avanzarHasta(() => fin.isVisible(), 120);
await foto(12, "fin");
await foto(13, "causas", () => page.getByRole("heading", { name: "What happened and why" }));
await foto(14, "ciencia", () => page.getByRole("heading", { name: "The real science behind it" }));

await browser.close();
console.log("capturas en", OUT);
