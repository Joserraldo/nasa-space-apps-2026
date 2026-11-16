// Captura la hoja de revision de personajes en un Chromium sin ventana.
// Uso: node capturar.mjs <salida.png> "<query>" [ancho] [alto]
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import path from "node:path";

const raizGlobal = execSync("npm root -g", { encoding: "utf8" }).trim();
const require = createRequire(path.join(raizGlobal, "x.js"));
const { chromium } = require("playwright");

const [salida, query = "", ancho = "1200", alto = "560"] = process.argv.slice(2);
const navegador = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const pagina = await navegador.newPage({ viewport: { width: Number(ancho), height: Number(alto) }, deviceScaleFactor: 1 });
const errores = [];
pagina.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") errores.push(`${m.type()}: ${m.text()}`); });
pagina.on("pageerror", (e) => errores.push(`pageerror: ${e.message}`));
await pagina.goto(`http://localhost:${process.env.PUERTO ?? "5199"}/${process.env.PAGINA ?? "personajes.html"}?${query}`);
await pagina.waitForFunction(() => window.__listo === true, null, { timeout: 15000 }).catch(() => errores.push("no llego a __listo"));
const info = await pagina.evaluate(() => window.__info ?? null);
await pagina.screenshot({ path: salida });
await navegador.close();
console.log(JSON.stringify({ salida, info, errores }));
