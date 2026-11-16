// Capturas de la tarjeta contextual (F2) en los cuatro tamaños del plan, sobre la escena del muestrario
// (`?vista=tarjeta`: HUD de mundo/01 y la tarjeta de mundo/04, mundo/03 y ui/01).
//
// Uso (con la ui corriendo):
//   node tests/capturas/tarjetas.mjs <carpeta de salida> [url base]
//
// Por tamaño guarda la tarjeta abierta, a mitad de la salida y cerrada, y en `registro.json` lo medido:
// duraciones de entrada y salida, caja de la tarjeta, si pisa el HUD, desbordes, foco al abrir y al
// cerrar, y que con movimiento reducido no haya animación. No aprueba nada: deja la evidencia.
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [salida, base = "http://localhost:5210"] = process.argv.slice(2);
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
];
const URL_VISTA = `${base}/src/componentes/base/muestrario.html?vista=tarjeta`;
const registro = [];

/** Toca "Back" y mide en el navegador cuántos ms tarda la tarjeta en irse del documento. */
const cerrarYMedir = (page) => page.evaluate(() => new Promise((listo) => {
  const back = [...document.querySelectorAll(".tc button")].find((b) => b.textContent.trim() === "Back");
  const t0 = performance.now();
  const obs = new MutationObserver(() => {
    if (!document.querySelector(".tc")) { obs.disconnect(); listo(Math.round(performance.now() - t0)); }
  });
  obs.observe(document.body, { childList: true, subtree: true });
  back.click();
}));

const medir = (page) => page.evaluate(() => {
  const caja = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), abajo: Math.round(r.bottom), derecha: Math.round(r.right) };
  };
  const tc = document.querySelector(".tc");
  const placas = [...document.querySelectorAll('[role="meter"]')].map((m) => m.getBoundingClientRect());
  const r = tc?.getBoundingClientRect();
  const pisa = (a) => r && !(a.right <= r.left || a.left >= r.right || a.bottom <= r.top || a.top >= r.bottom);
  const d = document.documentElement;
  return {
    tarjeta: caja(tc),
    origen: tc?.dataset.origen ?? null,
    dentroDeLaVentana: !!r && r.left >= 0 && r.top >= 0 && r.right <= innerWidth + 0.5 && r.bottom <= innerHeight + 0.5,
    pisaPlacasDelHud: placas.some(pisa),
    desborde: d.scrollWidth > innerWidth || d.scrollHeight > innerHeight,
    focoEnLaTarjeta: !!tc && document.activeElement === tc,
    animaciones: tc ? tc.getAnimations().map((a) => ({ nombre: a.animationName, ms: a.effect.getTiming().duration })) : [],
  };
});

for (const t of TAMANOS) {
  const etiqueta = `${t.w}x${t.h}`;
  const navegador = await chromium.launch();
  const contexto = await navegador.newContext({ viewport: { width: t.w, height: t.h }, locale: "en-US", hasTouch: t.tactil, isMobile: t.tactil, deviceScaleFactor: 1 });
  const page = await contexto.newPage();
  const errores = [];
  page.on("pageerror", (e) => errores.push(e.message));
  page.on("console", (m) => m.type() === "error" && errores.push(m.text()));
  const fila = { tamano: etiqueta };

  await page.goto(URL_VISTA);
  await page.waitForSelector('.tc[data-fase="abierta"]');
  fila.entrada = await medir(page);
  // Medir con la entrada terminada: con la página cargando, 400 ms fijos no alcanzan y la caja sale corrida.
  await page.waitForFunction(() => document.querySelector(".tc")?.getAnimations().every((a) => a.playState === "finished"));
  await page.waitForTimeout(100);
  fila.abierta = await medir(page);
  await page.screenshot({ path: join(salida, `tarjeta-abierta-${etiqueta}.png`) });

  // Cerrar con "Back": a mitad de la salida y ya cerrada.
  await page.getByRole("button", { name: "Back" }).click();
  await page.waitForSelector('.tc[data-fase="saliendo"]');
  fila.saliendo = await medir(page);
  await page.waitForTimeout(50);
  await page.screenshot({ path: join(salida, `tarjeta-saliendo-${etiqueta}.png`) });
  await page.waitForSelector(".tc", { state: "detached", timeout: 2000 });
  await page.waitForTimeout(200);
  await page.screenshot({ path: join(salida, `tarjeta-cerrada-${etiqueta}.png`) });

  // Reabrir con [E] (como en el juego) y medir otra vez la entrada.
  await page.getByRole("button", { name: /Inspect/ }).click();
  await page.waitForSelector('.tc[data-fase="abierta"]');
  fila.reabierta = await medir(page);
  await page.waitForTimeout(300);
  fila.msHastaIrse = await cerrarYMedir(page);

  // Movimiento reducido: sin animaciones, y "Back" la quita enseguida.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await page.waitForSelector('.tc[data-fase="abierta"]');
  fila.reducido = await medir(page);
  fila.reducidoMsHastaIrse = await cerrarYMedir(page);

  fila.errores = errores;
  registro.push(fila);
  await navegador.close();
  console.log(etiqueta, JSON.stringify({ origen: fila.abierta.origen, entrada: fila.entrada.animaciones, salida: fila.saliendo.animaciones, pisaHud: fila.abierta.pisaPlacasDelHud, dentro: fila.abierta.dentroDeLaVentana, foco: fila.abierta.focoEnLaTarjeta, msHastaIrse: fila.msHastaIrse, reducido: fila.reducido.animaciones.length, reducidoMsHastaIrse: fila.reducidoMsHastaIrse, errores: errores.length }));
}

writeFileSync(join(salida, "registro.json"), JSON.stringify(registro, null, 2));
