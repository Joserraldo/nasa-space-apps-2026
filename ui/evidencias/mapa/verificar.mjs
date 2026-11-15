// Montaje aislado: no altera App, estilos globales, tokens ni archivos de otros roles.
// Desde la raíz: node ui/evidencias/mapa/verificar.mjs [ref-de-tokens-de-Jaime]
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { createServer } from "vite";

const ref = process.argv[2] ?? "3195f53";
// Resuelve y valida la revisión pública antes de leerla; la evidencia guarda solo 7 caracteres.
const revision = execFileSync("git", ["rev-parse", "--verify", `${ref}^{commit}`], { encoding: "utf8" }).trim();
const referenciaCorta = revision.slice(0, 7);
const salida = resolve("ui/evidencias/mapa");
const temporal = resolve("build/qa-mapa");
mkdirSync(temporal + "/fuentes", { recursive: true });
const delGit = p => execFileSync("git", ["show", `${revision}:${p}`]);
writeFileSync(temporal + "/tokens.css", delGit("ui/src/estilos/tokens.css").toString().replaceAll('url("/fuentes/', 'url("./fuentes/'));
for (const f of ["nunito-latin.woff2", "nunito-italic-latin.woff2"]) {
  writeFileSync(temporal + "/fuentes/" + f, delGit("ui/public/fuentes/" + f));
}
writeFileSync(temporal + "/index.html", `<!doctype html><html lang="en"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Mapa QA</title><link rel="stylesheet" href="./tokens.css"><style>body{margin:0;background:var(--color-lila)}</style><div id="root"></div><script type="module" src="./fixture.tsx"></script></html>`);
writeFileSync(temporal + "/fixture.tsx", `
import React, {useState} from "react";
import {createRoot} from "react-dom/client";
import {Mapa} from "/ui/src/componentes/Mapa.tsx";
import {IdiomaContext} from "/ui/src/i18n.ts";
import {INICIO_JUGADOR,LUGARES} from "/ui/src/escena/mundo.ts";
function Fixture(){
 const [posicion,setPosicion]=useState(INICIO_JUGADOR);
 const [panel,setPanel]=useState("funcionando");
 window.destinos=[]; window.lugares=LUGARES; window.mover=setPosicion; window.panel=setPanel;
 const idioma=new URLSearchParams(location.search).get("idioma")||"en";
 document.documentElement.lang=idioma;
 return <IdiomaContext.Provider value={idioma}><Mapa posicion={posicion} objetivo="taller"
 modulos={{ia_base:"funcionando",bateria:"ausente",panel_solar:panel,escudo:"averiado",invernadero:"ausente",reciclador_agua:"ausente",antena:"ausente"}}
 onIrA={id=>window.destinos.push(id)}/></IdiomaContext.Provider>;
}
createRoot(document.getElementById("root")).render(<Fixture/>);
`);
const server = await createServer({ configFile: "ui/vite.config.ts", root: process.cwd(), publicDir: false,
  server: { host: "127.0.0.1", port: 5175, strictPort: true } });
let browser;
const resultados = [];
try {
  await server.listen();
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errores = [];
  page.on("pageerror", e => errores.push(e.message));
  for (const [width,height] of [[1024,683],[844,390],[390,844]]) {
    await page.setViewportSize({ width,height });
    await page.goto("http://127.0.0.1:5175/build/qa-mapa/index.html");
    await page.getByRole("heading", {name:"Jezero base map"}).waitFor();
    await page.evaluate(() => document.fonts.ready);
    assert(await page.evaluate(() => document.fonts.check("18px Nunito")));
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    const botones = page.locator(".mapa__pin");
    assert.equal(await botones.count(),10);
    for (const b of await page.locator(".mapa button").all()) {
      const box = await b.boundingBox();
      assert(box.width >= 44 && box.height >= 44);
    }
    await page.screenshot({ path: salida + `/captura-${width}x${height}.png` });
    for (const b of await botones.all()) await b.click();
    assert.deepEqual(await page.evaluate(() => window.destinos), await page.evaluate(() => window.lugares.map(l=>l.id)));
    const destino = page.getByRole("list",{name:"Places"}).getByRole("button",{name:"Workshop. Target",exact:true});
    await destino.focus(); await page.keyboard.press("Enter"); await page.keyboard.press("Space");
    assert.deepEqual(await page.evaluate(() => window.destinos.slice(-2)),["taller","taller"]);
    assert.equal(await destino.evaluate(e=>getComputedStyle(e).outlineStyle),"solid");
    resultados.push({width,height,mouse:10,teclado:2,toqueMinimo:44});
  }
  await page.emulateMedia({ reducedMotion:"reduce" });
  await page.goto("http://127.0.0.1:5175/build/qa-mapa/index.html?idioma=es");
  await page.getByRole("heading",{name:"Mapa de la base de Jezero"}).waitFor();
  assert.equal(await page.getByRole("list",{name:"Lugares"}).getByRole("button").count(),10);
  assert.equal(await page.locator(".mapa").evaluate(e=>e.getAnimations({subtree:true}).length),0);
  const antes = await page.locator(".mapa__astronauta").getAttribute("style");
  await page.evaluate(() => window.mover({x:2,z:3}));
  await page.waitForFunction(anterior=>document.querySelector(".mapa__astronauta").getAttribute("style")!==anterior,antes);
  await page.evaluate(() => window.panel("instalando"));
  await page.getByRole("button",{name:"Panel solar. Instalando",exact:true}).first().waitFor();
  assert.deepEqual(errores,[]);
  writeFileSync(salida + "/resultados.json", JSON.stringify({tokensRef:referenciaCorta,viewports:resultados,es:true,movimientoReducido:true,posicionActualizable:true,estadosActualizables:true,errores},null,2)+"\n");
  console.log("Mapa: 3 tamaños, 30 clics, Enter/Space, EN/ES, posición, estados y movimiento reducido: OK");
} finally {
  await browser?.close();
  await server.close();
}
