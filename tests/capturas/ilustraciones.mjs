// Ilustraciones de entrada (portada y carga, láminas inicio/01 e inicio/03): recorta cada pieza a la caja
// de su dibujo y la escribe optimizada en WebP en dos anchos: ui/public/ilustraciones/<pieza>-<ancho>.webp.
// Mismo método que los retratos (tests/capturas/retratos.mjs): Chromium de Playwright, sin librerías nuevas.
//
// Uso: node tests/capturas/ilustraciones.mjs
// Fuentes: tests/capturas/ilustraciones/fuente/<pieza>.png con fondo transparente. Si una fuente no
// existe todavía, se avisa y se sigue con las demás.
import { chromium } from "@playwright/test";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/** Pieza y anchos de salida: el chico para pantallas comunes y el grande para alta densidad. */
export const PIEZAS = [
  { pieza: "portada-nino", anchos: [320, 640] },
  { pieza: "portada-nave", anchos: [280, 560] },
  { pieza: "portada-planeta", anchos: [200, 400] },
  { pieza: "portada-asteroide", anchos: [120, 240] },
];
const CALIDAD = 0.82;
const FUENTE = "tests/capturas/ilustraciones/fuente";
const SALIDA = "ui/public/ilustraciones";

if (process.argv[1]?.endsWith("ilustraciones.mjs")) {
  mkdirSync(SALIDA, { recursive: true });
  const navegador = await chromium.launch();
  const page = await navegador.newPage();
  let total = 0;
  for (const { pieza, anchos } of PIEZAS) {
    const ruta = join(FUENTE, `${pieza}.png`);
    if (!existsSync(ruta)) { console.warn(`falta ${ruta}: se saltea`); continue; }
    const dataUrl = `data:image/png;base64,${readFileSync(ruta).toString("base64")}`;
    const r = await page.evaluate(async ({ dataUrl, anchos, calidad }) => {
      const img = new Image();
      img.src = dataUrl;
      await img.decode();
      const W = img.width, H = img.height;
      const lienzo = new OffscreenCanvas(W, H);
      const g = lienzo.getContext("2d");
      g.drawImage(img, 0, 0);
      const px = g.getImageData(0, 0, W, H).data;
      let x0 = W, y0 = H, x1 = -1, y1 = -1;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        if (px[(y * W + x) * 4 + 3] > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      }
      // Un margen chico para que el borde suavizado no quede cortado.
      const m = 4;
      x0 = Math.max(0, x0 - m); y0 = Math.max(0, y0 - m); x1 = Math.min(W - 1, x1 + m); y1 = Math.min(H - 1, y1 + m);
      const cw = x1 - x0 + 1, ch = y1 - y0 + 1;
      const salidas = [];
      for (const pedido of anchos) {
        const ancho = Math.min(pedido, cw); // nunca agrandar
        const alto = Math.round((ch * ancho) / cw);
        let fuente = lienzo, sx = x0, sy = y0, sw = cw, sh = ch;
        if (cw > ancho * 2) { // dos pasos al achicar mucho
          const medio = new OffscreenCanvas(ancho * 2, alto * 2);
          const gm = medio.getContext("2d");
          gm.imageSmoothingQuality = "high";
          gm.drawImage(lienzo, x0, y0, cw, ch, 0, 0, ancho * 2, alto * 2);
          fuente = medio; sx = 0; sy = 0; sw = ancho * 2; sh = alto * 2;
        }
        const fin = new OffscreenCanvas(ancho, alto);
        const gf = fin.getContext("2d");
        gf.imageSmoothingQuality = "high";
        gf.drawImage(fuente, sx, sy, sw, sh, 0, 0, ancho, alto);
        const blob = await fin.convertToBlob({ type: "image/webp", quality: calidad });
        const bytes = new Uint8Array(await blob.arrayBuffer());
        let bin = "";
        for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
        salidas.push({ pedido, ancho, alto, base64: btoa(bin) });
      }
      return { caja: [cw, ch], salidas };
    }, { dataUrl, anchos, calidad: CALIDAD });
    const resumen = r.salidas.map(({ pedido, ancho, alto, base64 }) => {
      const buf = Buffer.from(base64, "base64");
      writeFileSync(join(SALIDA, `${pieza}-${pedido}.webp`), buf);
      total += buf.length;
      return `${pedido} -> ${ancho}x${alto} ${(buf.length / 1024).toFixed(1)} KB`;
    });
    console.log(`${pieza} (caja ${r.caja.join("x")}): ${resumen.join(" | ")}`);
  }
  await navegador.close();
  console.log(`total ${(total / 1024).toFixed(1)} KB en ${SALIDA}`);
}
