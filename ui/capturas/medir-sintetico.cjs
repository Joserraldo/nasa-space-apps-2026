/** Medición sintética: ejecutar desde la raíz con Vite en 5174. No emula una GPU móvil. */
const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
process.chdir(path.resolve(__dirname, '../..'));
const duracionMs = Number(process.env.MEDICION_MS || 60000);
const perfiles = [
  { nombre: 'desktop', ancho: 1024, alto: 683, cpu: 1, calidad: 'alta' },
  { nombre: 'pc-cpu6', ancho: 1024, alto: 683, cpu: 6, calidad: 'alta' },
  { nombre: 'mobile-cpu6', ancho: 844, alto: 390, cpu: 6, calidad: 'baja' },
];
(async () => {
  const browser = await chromium.launch();
  const resultados = [];
  try {
    for (const perfil of perfiles) {
      const page = await browser.newPage({ viewport: { width: perfil.ancho, height: perfil.alto }, deviceScaleFactor: 1.5, isMobile: perfil.nombre.includes('mobile') });
      const errores = [], avisos = [];
      let presupuesto = null;
      page.on('pageerror', e => errores.push(e.message));
      page.on('console', async m => {
        if (m.type() === 'error') errores.push(m.text());
        if (m.type() === 'warning') avisos.push(m.text());
        if (m.text().includes('presupuesto (cota alta)')) presupuesto = await m.args()[1].jsonValue();
      });
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: perfil.cpu });
      await page.goto((process.env.ESCENA_URL || 'http://127.0.0.1:5174') + '/escena.html?modulos=todos&calidad=' + perfil.calidad);
      await page.waitForTimeout(5000);
      if (!presupuesto) throw new Error('El DEM no terminó de montar; no medir una escena incompleta.');
      const gpu = await page.evaluate(() => {
        const gl = document.querySelector('canvas').getContext('webgl2');
        const debug = gl?.getExtension('WEBGL_debug_renderer_info');
        return gl ? { renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER), vendor: debug ? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR), version: gl.getParameter(gl.VERSION), dpr: devicePixelRatio } : null;
      });
      const tiempos = await page.evaluate(ms => new Promise(resolve => {
        const intervalos = [];
        let inicio, ultimo;
        function tick(t) {
          if (inicio === undefined) { inicio = ultimo = t; requestAnimationFrame(tick); return; }
          intervalos.push(t - ultimo); ultimo = t;
          if (t - inicio < ms) requestAnimationFrame(tick);
          else {
            intervalos.sort((a, b) => a - b);
            resolve({ duracionMs: t - inicio, frames: intervalos.length, fps: intervalos.length * 1000 / (t - inicio), p95ms: intervalos[Math.floor(intervalos.length * 0.95)], maxMs: intervalos[intervalos.length - 1] });
          }
        }
        requestAnimationFrame(tick);
      }), duracionMs);
      resultados.push({ ...perfil, ...tiempos, gpu, presupuestoGeometrico: presupuesto, errores, avisos });
      await page.screenshot({ path: `ui/capturas/rendimiento-${perfil.nombre}.png` });
      console.log(JSON.stringify(resultados[resultados.length - 1]));
      await page.close();
    }
  } finally { await browser.close(); }
  fs.writeFileSync('ui/capturas/rendimiento-revision.json', JSON.stringify({ commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), fecha: new Date().toISOString(), navegador: 'Chromium headless de Playwright', entorno: 'Vite desarrollo, cinco módulos, DPR solicitado 1.5, CPU limitada sin emular GPU física', resultados }, null, 2));
})().catch(e => { console.error(e); process.exitCode = 1; });
