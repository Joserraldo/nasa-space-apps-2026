// Evidencia de E0 (portada) y E2 (carga) navegando el juego, sin inyectar estado.
// Uso desde la raíz, con el servidor de desarrollo corriendo: node ui/capturas/ilustraciones/capturar.cjs [url]
//
// El reloj de JS queda en pausa para que la carga (1,8 s en App.tsx) no pase sola a la órbita; las animaciones
// CSS corren igual en tiempo real, así que antes de cada foto se espera a que terminen todas las entradas
// (document.getAnimations) y se mide: sin desborde horizontal, la pantalla entra en la ventana y ninguna
// ilustración tapa un botón, el logo o el panel.
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const url = process.argv[2] || 'http://127.0.0.1:5173/';
const TAMANOS = [[1440, 900], [1024, 683], [844, 390], [390, 844], [768, 1024]];
const espera = ms => new Promise(r => setTimeout(r, ms));

async function entradasTerminadas(page) {
  for (let t = 0; t < 50; t++) {
    const pendientes = await page.evaluate(() => document.getAnimations().filter(a => {
      const c = a.effect?.getComputedTiming?.();
      return c && c.iterations !== Infinity && (a.playState === 'running' || a.playState === 'pending');
    }).length);
    if (pendientes === 0) return;
    await espera(100);
  }
  throw new Error('Las animaciones de entrada no terminaron en 5 s');
}

function medir() {
  const visible = el => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity) > 0 && r.width > 0 && r.height > 0;
  };
  const caja = el => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, r: r.right, b: r.bottom }; };
  const cruce = (a, b) => Math.max(0, Math.min(a.r, b.r) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.b, b.b) - Math.max(a.y, b.y));
  const ilus = [...document.querySelectorAll('.ilu')].filter(visible).map(el => ({ clase: el.className, archivo: el.currentSrc.split('/').pop(), ...caja(el) }));
  const controles = [...document.querySelectorAll('main button, .portada-logo, .portada-subtitulo, .portada-lema, .carga-marca, .carga-panel')].filter(visible)
    .map(el => ({ nombre: (el.textContent || el.className).trim().slice(0, 24), ...caja(el) }));
  const choques = [];
  for (const i of ilus) for (const c of controles) {
    const area = (c.r - c.x) * (c.b - c.y);
    if (area > 0 && cruce(i, c) / area > 0.03) choques.push(`${i.clase} sobre ${c.nombre}`);
  }
  const pantalla = document.querySelector('.portada, .carga');
  return {
    desborde: document.documentElement.scrollWidth > innerWidth,
    alto: Math.round(pantalla.getBoundingClientRect().height),
    choques,
    imagenes: ilus.map(({ clase, archivo, x, y, r, b }) => ({ clase, archivo, ancho: Math.round(r - x), alto: Math.round(b - y) })),
  };
}

(async () => {
  const browser = await chromium.launch();
  const registro = [];
  try {
    for (const [w, h] of TAMANOS) {
      const context = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: w < 900 });
      const page = await context.newPage();
      const errores = [];
      page.on('pageerror', e => errores.push(e.message));
      page.on('console', m => { if (m.type() === 'error') errores.push(m.text()); });
      await page.clock.install({ time: new Date('2026-11-15T12:00:00Z') });
      await page.clock.pauseAt(new Date('2026-11-15T12:00:10Z'));
      await page.goto(url);
      await page.getByRole('button', { name: 'Start mission', exact: true }).waitFor();
      await page.clock.runFor(1700);
      const foto = async nombre => {
        await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(i => i.decode().catch(() => {}))); });
        await entradasTerminadas(page);
        await page.evaluate(() => scrollTo(0, 0));
        const m = await page.evaluate(medir);
        if (m.desborde) throw new Error(`Desborde horizontal en ${nombre} ${w}x${h}`);
        if (m.alto > h + 1) throw new Error(`${nombre} ${w}x${h} no entra: mide ${m.alto} px`);
        if (m.choques.length) throw new Error(`${nombre} ${w}x${h}: ${m.choques.join('; ')}`);
        await page.screenshot({ path: path.join(__dirname, `${nombre}-${w}x${h}.png`) });
        registro.push({ pantalla: nombre, ventana: `${w}x${h}`, errores: [...errores], ...m });
      };
      await foto('portada');
      await page.getByRole('button', { name: 'Start mission', exact: true }).click();
      await page.clock.runFor(300);
      await page.getByRole('button', { name: 'Skip intro', exact: true }).click();
      await page.clock.runFor(50);
      await page.getByRole('heading', { name: 'Preparing your mission', exact: true }).waitFor();
      await foto('carga');
      if (errores.length) throw new Error(errores.join('\n'));
      await context.close();
    }
    fs.writeFileSync(path.join(__dirname, 'registro.json'), JSON.stringify(registro, null, 2) + '\n');
    console.log(`Capturas verificadas: ${registro.length}; sin desbordes, sin choques y cada pantalla entra en su ventana.`);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
