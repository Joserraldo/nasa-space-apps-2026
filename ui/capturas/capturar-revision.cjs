const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
process.chdir(path.resolve(__dirname, '../..'));
(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  const resultados = [];
  for (const [nombre, width, height, query] of [
    ['1024x683', 1024, 683, '?modulos=todos'],
    ['844x390', 844, 390, '?modulos=todos'],
    ['390x844', 390, 844, '?modulos=todos'],
    ['dos-modulos', 1024, 683, ''],
    ['primera-persona', 1024, 683, '?modulos=todos&camara=primera'],
  ]) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    const errores = [];
    page.on('pageerror', e => errores.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errores.push(m.text()); });
    page.on('response', r => { if (r.status() >= 400) errores.push(`${r.status()} ${r.url()}`); });
    await page.goto((process.env.ESCENA_URL || 'http://127.0.0.1:5174') + '/escena.html' + query);
    await page.waitForFunction(() => !!document.querySelector('canvas')?.getContext('webgl2'));
    await page.waitForTimeout(2500);
    const dimensiones = await page.evaluate(() => {
      const c = document.querySelector('canvas');
      return { viewport: [innerWidth, innerHeight], canvas: [c.width, c.height] };
    });
    await page.screenshot({ path: `ui/capturas/revision-${nombre}.png` });
    resultados.push({ nombre, ...dimensiones, errores });
    await page.close();
  }
  await browser.close();
  fs.writeFileSync('ui/capturas/revision-verificacion.json', JSON.stringify(resultados, null, 2));
  console.log(JSON.stringify(resultados));
})().catch(e => { console.error(e); process.exitCode = 1; });
