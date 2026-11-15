// Capturas del juego real en los cuatro tamaños del plan de integración (evidencia de antes y después).
//
// Uso (con la ui corriendo):
//   node tests/capturas/capturar.mjs <carpeta de salida> [url base] [filtro de tamaño, p. ej. 390x844]
//
// Recorre la ruta dorada en inglés y guarda una imagen por pantalla y tamaño, más `registro.json`
// con lo medido en cada una (canvas, desbordes, errores de consola). No es una prueba: no aprueba
// nada, solo deja la evidencia para compararla con las láminas.
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [salida, base = "http://localhost:5210", filtro] = process.argv.slice(2);
if (!salida) {
  console.error("Falta la carpeta de salida");
  process.exit(1);
}
mkdirSync(salida, { recursive: true });

const TAMANOS = [
  { w: 1440, h: 900, tactil: false },
  { w: 1024, h: 683, tactil: false },
  { w: 844, h: 390, tactil: true },
  { w: 390, h: 844, tactil: true },
].filter((t) => !filtro || filtro === `${t.w}x${t.h}`);

const TURNO_MS = 4000;
const registro = [];

/** Lo que se puede medir sin opinar: tamaño del canvas, desborde del documento y del panel. */
async function medir(page) {
  return page.evaluate(() => {
    const caja = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
    };
    const d = document.documentElement;
    const canvas = document.querySelector("canvas");
    return {
      ventana: { w: innerWidth, h: innerHeight },
      documento: { w: d.scrollWidth, h: d.scrollHeight },
      desbordeHorizontal: d.scrollWidth > innerWidth,
      desbordeVertical: d.scrollHeight > innerHeight,
      canvases: document.querySelectorAll("canvas").length,
      canvas: caja(canvas),
      hud: caja(document.querySelector(".app > header, .hud, .hud-base")),
      panel: caja(document.querySelector(".base-panel, .tormenta-panel, .modulos-panel")),
      // Botones que se salen por un costado de la ventana (cortados): debe ser 0.
      botonesCortados: [...document.querySelectorAll("button")].filter((b) => {
        const r = b.getBoundingClientRect();
        return r.width > 0 && (r.left < -1 || r.right > innerWidth + 1);
      }).map((b) => b.getAttribute("aria-label") || b.textContent.trim()).slice(0, 10),
      // Medidores de recursos a la vista: deben ser 3 (sin repetir en los paneles).
      medidores: document.querySelectorAll('[role="meter"]').length,
      // El mismo canvas de E5 sigue montado (mundo compartido): lo marca `marcarCanvas` al entrar a E5.
      canvasMismo: !!document.querySelector('canvas[data-captura="e5"]'),
      pie: !!document.querySelector(".app > footer"),
    };
  });
}

for (const t of TAMANOS) {
  const navegador = await chromium.launch();
  const contexto = await navegador.newContext({
    viewport: { width: t.w, height: t.h },
    locale: "en-US",
    hasTouch: t.tactil,
    isMobile: t.tactil,
    deviceScaleFactor: 1,
  });
  const page = await contexto.newPage();
  const errores = [];
  page.on("pageerror", (e) => errores.push(e.message));
  page.on("console", (m) => m.type() === "error" && errores.push(m.text()));
  const etiqueta = `${t.w}x${t.h}`;

  const foto = async (nombre, espera = 400) => {
    await page.waitForTimeout(espera);
    await page.screenshot({ path: join(salida, `${nombre}-${etiqueta}.png`) });
    registro.push({ pantalla: nombre, tamano: etiqueta, ...(await medir(page)) });
  };
  const boton = (name, opciones = {}) => page.getByRole("button", { name, ...opciones });
  const avanzarHasta = async (listo, max = 60) => {
    for (let i = 0; i < max; i++) {
      if (await listo()) return true;
      const seguir = boton(/Resume/).first();
      if (await seguir.isVisible()) await seguir.click();
      await page.clock.fastForward(TURNO_MS);
      await page.waitForTimeout(40);
    }
    return false;
  };

  try {
    await page.clock.install();
    await page.goto(base);
    await foto("e0-portada", 800);
    await boton("Start mission").click();
    await foto("e1-intro", 800);
    await boton("Skip intro").click();
    await foto("e2-carga", 300);
    await boton("Skip", { exact: true }).click();
    await foto("e3-orbita", 600);
    await boton("Continue").click();
    await foto("e4-sitio", 600);
    await boton("Land here").first().click();
    await page.waitForSelector("canvas");
    await page.evaluate(() => document.querySelector("canvas")?.setAttribute("data-captura", "e5"));
    await foto("e5-modulos", 2500);
    await boton("Place", { exact: true }).first().click();
    await boton("Place", { exact: true }).first().click();
    await foto("e5-modulos-colocados", 1500);
    await boton("Base ready. Start the clock!").click();
    await page.waitForSelector("canvas");
    await foto("e6-base", 2500);
    // Crew abre el panel con las acciones y la tripulación; Map, el plano de la base.
    await boton("Crew", { exact: true }).click();
    await foto("e6-base-tripulacion", 500);
    await boton("Raise the shield").click();
    await foto("e6-base-confirmar", 500);
    await boton("Back").click();
    await boton("Close", { exact: true }).click();
    await boton("Map", { exact: true }).click();
    await foto("e6-base-mapa", 500);
    await page.keyboard.press("Escape");

    const tormenta = page.getByRole("heading", { name: "Choose your expert" });
    await avanzarHasta(() => tormenta.isVisible());
    await foto("e7-tormenta", 2500);
    await boton(/Engineer/).click();
    await foto("e7-plan", 600);
    await boton("Check the source").click();
    await foto("e7-fuente", 600);
    await boton("Back").click();
    await boton("Confirm").click();
    await foto("e7-decision", 600);
    await boton("Return to exploration").click();
    await foto("e6-base-tras-tormenta", 2000);

    await boton("Crew", { exact: true }).click();
    await boton(/Send telemetry to Earth/).click();
    await page.getByRole("dialog").getByRole("button", { name: "Confirm" }).click();
    await boton("Return to exploration").click();
    const fin = page.getByRole("heading", { name: /Mission complete!|The base could not hold/ });
    await avanzarHasta(() => fin.isVisible(), 120);
    await foto("e8-final", 800);
  } catch (e) {
    errores.push(`captura interrumpida: ${String(e).split("\n")[0]}`);
    await page.screenshot({ path: join(salida, `interrumpida-${etiqueta}.png`) }).catch(() => undefined);
  }
  registro.push({ tamano: etiqueta, errores });
  await navegador.close();
}

writeFileSync(join(salida, "registro.json"), JSON.stringify({ base, fecha: new Date().toISOString(), registro }, null, 2));
const conErrores = registro.filter((r) => r.errores?.length);
console.log(`Capturas en ${salida}: ${registro.filter((r) => r.pantalla).length} imágenes, ${conErrores.length} tamaños con errores`);
for (const r of conErrores) console.log(r.tamano, r.errores);
