// Capturas del globo, el aviso [E] y los botones táctiles (F4) en los cuatro tamaños del plan, sobre la
// escena del muestrario (`?vista=globo`). En escritorio se ve el aviso [E]; en celular, los botones con
// el de salto.
//
// Uso (con la ui corriendo):
//   node tests/capturas/globo.mjs <carpeta de salida> [url base]
//
// Guarda una imagen por tamaño y `registro.json` con lo medido: cajas de los globos (dentro de la
// ventana y cuántos renglones), duración de la aparición del aviso, tamaño del botón de salto y, con
// movimiento reducido, cuántas animaciones quedan. No aprueba nada: deja la evidencia.
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
const registro = [];

const medir = (page) => page.evaluate(() => {
  const r = (el) => el.getBoundingClientRect();
  const globos = [...document.querySelectorAll(".globo-cara")].map((el) => {
    const c = r(el), alto = parseFloat(getComputedStyle(el).lineHeight);
    const relleno = parseFloat(getComputedStyle(el).paddingTop) + parseFloat(getComputedStyle(el).paddingBottom);
    return { w: Math.round(c.width), renglones: Math.round((c.height - relleno) / alto), dentro: c.left >= 0 && c.top >= 0 && c.right <= innerWidth && c.bottom <= innerHeight };
  });
  const aviso = document.querySelector(".pb-accion > .fc, .ct-accion");
  const salto = document.querySelector(".ct-salto");
  const anim = (sel) => [...document.querySelectorAll(sel)].flatMap((el) => el.getAnimations().map((a) => a.effect.getTiming().duration));
  return {
    globos,
    aviso: aviso ? aviso.className : null,
    aparicionAviso: anim(".pb-accion > .fc, .ct-accion"),
    salto: salto ? { w: Math.round(r(salto).width), h: Math.round(r(salto).height) } : null,
    animacionesGlobo: anim(".globo"),
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

  await page.goto(`${base}/src/componentes/base/muestrario.html?vista=globo`);
  await page.waitForSelector(".globo");
  // Usar el aviso: se va y vuelve a aparecer a los 800 ms; se mide esa aparición.
  await page.waitForTimeout(400);
  await page.locator(".pb-accion, .ct-accion").first().click();
  await page.waitForSelector(".pb-accion, .ct-accion", { state: "detached" });
  await page.waitForSelector(".pb-accion, .ct-accion");
  fila.reaparece = await medir(page);
  await page.waitForTimeout(400);
  fila.quieto = await medir(page);
  await page.screenshot({ path: join(salida, `globo-${etiqueta}.png`) });

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await page.waitForSelector(".globo");
  fila.reducido = await medir(page);

  fila.errores = errores;
  registro.push(fila);
  await navegador.close();
  console.log(etiqueta, JSON.stringify({ globos: fila.quieto.globos, aviso: fila.quieto.aviso, aparicion: fila.reaparece.aparicionAviso, salto: fila.quieto.salto, reducido: [...fila.reducido.animacionesGlobo, ...fila.reducido.aparicionAviso].length, errores }));
}

writeFileSync(join(salida, "registro.json"), JSON.stringify(registro, null, 2));
