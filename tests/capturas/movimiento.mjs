// Evidencia del movimiento en la base (frente B del plan de integración): el niño camina con el
// teclado y la cámara lo sigue.
//
// Uso (con la ui corriendo):
//   node tests/capturas/movimiento.mjs <carpeta de salida> [url base]
//
// En 1024x683 y 390x844 recorre la ruta dorada hasta la base (E6), pausa el reloj de la partida
// (para que la tormenta no cambie de pantalla en medio), mantiene W, después A y después
// D, y guarda dos capturas por tramo con la tecla todavía apretada (a los 600 ms, andando, y al
// final) con los atributos `data-jugador-*` del canvas. Además
// captura la vista previa de la escena (`/escena.html`) en tercera y en primera persona, porque la
// pantalla todavía no cambia de cámara (eso lo conecta el frente A). Deja todo en `registro.json`,
// con el conteo real de `renderer.info` de la vista previa con `?medir=1`, el cambio de cámara con V,
// el arrastre y la rueda en la vista previa, y una prueba de ciclo de vida (dos montajes y
// desmontajes: listeners, fotogramas y recursos WebGL). No aprueba nada.
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [salida, base = "http://localhost:5212"] = process.argv.slice(2);
if (!salida) {
  console.error("Falta la carpeta de salida");
  process.exit(1);
}
mkdirSync(salida, { recursive: true });

const TAMANOS = [
  { w: 1024, h: 683, tactil: false },
  { w: 390, h: 844, tactil: true },
];
/** Cuánto se mantiene cada tecla, en ms. */
const TRAMO_MS = 1500;
const registro = { juego: [], vistaPrevia: [] };

async function datos(page) {
  return page.evaluate(() => {
    const c = document.querySelector("canvas");
    const r = c?.getBoundingClientRect();
    return {
      jugadorX: c?.dataset.jugadorX ?? null,
      jugadorZ: c?.dataset.jugadorZ ?? null,
      camara: c?.dataset.camara ?? null,
      lugarCercano: c?.dataset.lugarCercano ?? null,
      canvas: r ? { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } : null,
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
  const boton = (name, opciones = {}) => page.getByRole("button", { name, ...opciones });
  const canvas = page.locator("canvas").first();

  const foto = async (nombre, espera = 350) => {
    await page.waitForTimeout(espera);
    // Los atributos se leen antes de la captura (la captura tarda y el niño sigue caminando).
    const medido = await datos(page);
    await canvas.scrollIntoViewIfNeeded();
    await canvas.screenshot({ path: join(salida, `${nombre}-${etiqueta}.png`) });
    await page.screenshot({ path: join(salida, `${nombre}-${etiqueta}-pagina.png`) });
    registro.juego.push({ paso: nombre, tamano: etiqueta, ...medido });
  };

  try {
    await page.goto(base);
    await boton("Start mission").click();
    await boton("Skip intro").click();
    await boton("Skip", { exact: true }).click();
    await boton("Continue").click();
    await boton("Land here").first().click();
    await page.waitForSelector("canvas");
    await boton("Place", { exact: true }).first().click();
    await boton("Place", { exact: true }).first().click();
    await boton("Base ready. Start the clock!").click();
    await page.waitForSelector("canvas");
    await page.waitForTimeout(2500);
    // Pausa el reloj de la partida: así la tormenta no cambia de pantalla mientras se camina
    // (caminar no depende del reloj del motor).
    const pausa = boton("Pause", { exact: true });
    if (await pausa.isVisible()) await pausa.click();
    // El foco queda fuera de cualquier campo de texto: las teclas van al mundo.
    await page.evaluate(() => (document.activeElement instanceof HTMLElement ? document.activeElement.blur() : undefined));
    await foto("e6-inicio");
    for (const tecla of ["w", "a", "d"]) {
      // La captura se toma con la tecla todavía apretada: se ve la pose de caminar.
      await page.keyboard.down(tecla);
      await foto(`e6-tecla-${tecla}-andando`, 600);
      await page.waitForTimeout(TRAMO_MS - 600);
      await foto(`e6-tecla-${tecla}`, 0);
      await page.keyboard.up(tecla);
      await page.waitForTimeout(300);
    }
  } catch (e) {
    errores.push(`guion: ${e.message}`);
  }
  registro.juego.push({ tamano: etiqueta, errores });
  await navegador.close();
}

// Vista previa de la escena: tercera, primera y medición del render real.
{
  const navegador = await chromium.launch();
  for (const [consulta, nombre] of [["", "arnes-tercera"], ["camara=primera", "arnes-primera"], ["modulos=todos&medir=1", "arnes-medir"]]) {
    for (const t of [{ w: 1024, h: 683 }, { w: 390, h: 844 }]) {
      const page = await navegador.newPage({ viewport: { width: t.w, height: t.h }, deviceScaleFactor: 1 });
      const errores = [];
      page.on("pageerror", (e) => errores.push(e.message));
      await page.goto(`${base}/escena.html?${consulta}`);
      await page.waitForTimeout(3500);
      const etiqueta = `${t.w}x${t.h}`;
      await page.screenshot({ path: join(salida, `${nombre}-${etiqueta}.png`) });
      const medicion = consulta.includes("medir")
        ? await page.evaluate(() => document.querySelector("[role=status]")?.innerText ?? null)
        : null;
      registro.vistaPrevia.push({ vista: nombre, tamano: etiqueta, ...(await datos(page)), medicion, errores });
      await page.close();
    }
  }
  await navegador.close();
}

// Vista previa: cambio de cámara con V (a mitad de la transición y al final), arrastre y rueda.
{
  const navegador = await chromium.launch();
  const page = await navegador.newPage({ viewport: { width: 1024, height: 683 }, deviceScaleFactor: 1 });
  const errores = [];
  page.on("pageerror", (e) => errores.push(e.message));
  await page.goto(`${base}/escena.html`);
  await page.waitForTimeout(3000);
  const pasos = [];
  const paso = async (nombre) => {
    const medido = await datos(page);
    await page.screenshot({ path: join(salida, `arnes-${nombre}-1024x683.png`) });
    pasos.push({ paso: nombre, ...medido });
  };
  await page.keyboard.down("w");
  await page.waitForTimeout(500);
  await page.keyboard.up("w");
  await page.waitForTimeout(400);
  await paso("antes-de-v");
  await page.keyboard.press("v");
  await page.waitForTimeout(120);
  await paso("v-transicion");
  await page.waitForTimeout(500);
  await paso("v-primera");
  await page.keyboard.down("a");
  await page.waitForTimeout(500);
  await page.keyboard.up("a");
  await paso("primera-tecla-a");
  await page.keyboard.press("v");
  await page.waitForTimeout(600);
  await paso("v-tercera");
  await page.mouse.move(600, 300);
  await page.mouse.down();
  await page.mouse.move(800, 260, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(300);
  await paso("arrastre");
  await page.mouse.wheel(0, 2000);
  await page.waitForTimeout(400);
  await paso("rueda-lejos");
  registro.vistaPrevia.push({ vista: "interaccion", pasos, errores });
  await navegador.close();
}

// Ciclo de vida: montar y desmontar la escena dos veces en la misma página (módulo servido por
// Vite) y contar listeners, fotogramas pedidos después de desmontar y recursos WebGL vivos.
{
  const navegador = await chromium.launch();
  const page = await navegador.newPage({ viewport: { width: 1024, height: 683 }, deviceScaleFactor: 1 });
  const errores = [];
  page.on("pageerror", (e) => errores.push(e.message));
  await page.goto(`${base}/escena.html?montar=0`);
  await page.waitForTimeout(1500);
  const ciclo = await page.evaluate(async () => {
    const vivos = { buffer: 0, texture: 0, program: 0, framebuffer: 0, renderbuffer: 0, vertexArray: 0 };
    const listeners = new Map();
    const espiar = (blanco, nombre) => {
      const agregar = blanco.addEventListener.bind(blanco);
      const quitar = blanco.removeEventListener.bind(blanco);
      blanco.addEventListener = (tipo, f, o) => {
        listeners.set(`${nombre}:${tipo}`, (listeners.get(`${nombre}:${tipo}`) ?? 0) + 1);
        return agregar(tipo, f, o);
      };
      blanco.removeEventListener = (tipo, f, o) => {
        listeners.set(`${nombre}:${tipo}`, (listeners.get(`${nombre}:${tipo}`) ?? 0) - 1);
        return quitar(tipo, f, o);
      };
    };
    espiar(window, "window");
    espiar(document, "document");
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (...args) {
      const gl = original.apply(this, args);
      if (gl && !gl.__espiado) {
        gl.__espiado = true;
        for (const r of Object.keys(vivos)) {
          const N = r[0].toUpperCase() + r.slice(1);
          const crear = gl[`create${N}`]?.bind(gl), borrar = gl[`delete${N}`]?.bind(gl);
          if (!crear) continue;
          gl[`create${N}`] = () => { vivos[r]++; return crear(); };
          gl[`delete${N}`] = (x) => { if (x) vivos[r]--; return borrar(x); };
        }
      }
      return gl;
    };
    const { crearEscena3D } = await import("/src/escena/escena3d.ts");
    const vista = {
      fase: "base",
      modulos: { panel_solar: "funcionando", antena: "funcionando", bateria: "ausente", reciclador_agua: "ausente", escudo: "ausente", invernadero: "ausente", ia_base: "funcionando" },
      iris: { nivel: "pistas", averiada: false },
      tormenta: { anunciada: false, activa: false },
      lugarObjetivo: null,
      resultado: "en_curso",
    };
    const espera = (ms) => new Promise((r) => setTimeout(r, ms));
    const montajes = [];
    for (let i = 0; i < 2; i++) {
      const canvas = document.createElement("canvas");
      canvas.style.cssText = "position:fixed;inset:0;width:100vw;height:100vh";
      espiar(canvas, `canvas${i}`);
      document.body.appendChild(canvas);
      const escena = crearEscena3D(canvas, { calidad: "alta", movimientoReducido: false, medir: true });
      escena.actualizar(vista, []);
      escena.redimensionar(1024, 683);
      await escena.listo.catch(() => undefined);
      await espera(1500);
      const medicion = escena.medicion();
      const durante = { ...vivos };
      escena.dispose();
      // Fotogramas pedidos después de desmontar: el bucle de esta escena no debe seguir.
      let fotogramas = 0;
      const rafOriginal = window.requestAnimationFrame;
      window.requestAnimationFrame = (f) => { fotogramas++; return rafOriginal(f); };
      await espera(300);
      window.requestAnimationFrame = rafOriginal;
      canvas.remove();
      montajes.push({ medicion, recursosMontada: durante, recursosTrasDesmontar: { ...vivos }, fotogramasTrasDesmontar: fotogramas });
    }
    const pendientes = Object.fromEntries([...listeners].filter(([, n]) => n !== 0));
    return { montajes, listenersSinQuitar: pendientes };
  });
  registro.cicloDeVida = { ...ciclo, errores };
  await navegador.close();
}

writeFileSync(join(salida, "registro.json"), JSON.stringify(registro, null, 2));
console.log(JSON.stringify(registro, null, 2));
