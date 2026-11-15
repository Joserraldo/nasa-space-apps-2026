/** Regresión en navegador: ESCENA_URL apunta a Vite; por defecto localhost:5174. */
const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ui = path.resolve(__dirname, '..');
const nombre = `verificacion-ciclo-${process.pid}.html`;
const archivo = path.join(ui, nombre);
const origen = process.env.ESCENA_URL || 'http://127.0.0.1:5174';
const html = `<!doctype html><html><body><div id="root" style="height:400px"></div>
<script type="module">
import { createRoot } from 'react-dom/client';
import { createElement, StrictMode } from 'react';
import { EscenaBase } from '/src/escena/EscenaBase.tsx';
window.resultado = { fallos: 0, lugares: 0, usos: 0 };
const vista = { fase:'base', modulos: { panel_solar:'funcionando', antena:'ausente', bateria:'ausente', reciclador_agua:'ausente', escudo:'ausente', invernadero:'ausente', ia_base:'funcionando' }, iris:{nivel:'pistas',averiada:false}, tormenta:{anunciada:false,activa:false}, lugarObjetivo:null, resultado:'en_curso' };
const props = { vista, eventos:[], calidad:'baja', camara:'tercera', movimientoReducido:true, onLugarCercano:()=>window.resultado.lugares++, onUsar:()=>window.resultado.usos++, onCalidad:()=>{}, onWebGLPerdido:()=>window.resultado.fallos++ };
let root;
window.montar = () => { root=createRoot(document.getElementById('root')); root.render(createElement(StrictMode,null,createElement(EscenaBase,props))); };
window.desmontar = () => root.unmount();
window.listo = true;
</script></body></html>`;

(async () => {
  let browser;
  fs.writeFileSync(archivo, html);
  try {
    browser = await chromium.launch(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {});
    const normal = await browser.newPage();
    const errores = [];
    normal.on('pageerror', e => errores.push(e.message));
    await normal.goto(`${origen}/${nombre}`);
    await normal.waitForFunction(() => window.listo);
    await normal.evaluate(() => window.montar());
    await normal.waitForFunction(() => window.resultado.lugares >= 2);
    await normal.keyboard.press('e');
    assert.equal(await normal.evaluate(() => window.resultado.usos), 1, 'StrictMode duplicó la interacción');
    await normal.evaluate(() => window.desmontar());
    await normal.keyboard.press('e');
    assert.equal(await normal.evaluate(() => window.resultado.usos), 1, 'quedó un listener después del desmontaje');
    await normal.evaluate(() => window.montar());
    await normal.waitForFunction(() => window.resultado.lugares >= 4);
    await normal.keyboard.press('e');
    assert.equal(await normal.evaluate(() => window.resultado.usos), 2, 'el remontaje duplicó la interacción');
    await normal.evaluate(() => window.desmontar());
    assert.deepEqual(errores, [], 'error durante el montaje normal');
    await normal.close();

    const sinWebGL = await browser.newPage();
    const erroresSinWebGL = [];
    sinWebGL.on('pageerror', e => erroresSinWebGL.push(e.message));
    await sinWebGL.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (tipo, ...args) {
        return /^(webgl2?|experimental-webgl)$/.test(tipo) ? null : original.call(this, tipo, ...args);
      };
    });
    await sinWebGL.goto(`${origen}/${nombre}`);
    await sinWebGL.waitForFunction(() => window.listo);
    await sinWebGL.evaluate(() => window.montar());
    await sinWebGL.waitForFunction(() => window.resultado.fallos > 0, undefined, { timeout: 5000 });
    await sinWebGL.evaluate(() => window.desmontar());
    assert.deepEqual(erroresSinWebGL, [], 'el fallo WebGL escapó a React');
    await sinWebGL.close();
    console.log('2 regresiones aprobadas: StrictMode sin interacción duplicada; fallo de WebGL notificado sin excepción React.');
  } finally {
    if (browser) await browser.close();
    fs.unlinkSync(archivo);
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
