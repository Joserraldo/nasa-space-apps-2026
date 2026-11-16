// Retratos B para la interfaz (F1): corta la lámina de expresiones de cada tripulante en sus 8 caras y las
// escribe optimizadas en WebP: ui/public/retratos/<persona>-<expresion>-<ancho>.webp, en 160 y 320 px.
//
// Las 8 caras de un personaje salen con el mismo encuadre (cuadrado del mismo lado, centradas en el busto
// y apoyadas en su base), así cambiar de expresión para parpadear o hablar no mueve la cara.
// Usa el Chromium de Playwright para decodificar, recortar y codificar: sin librerías nuevas.
//
// Uso: node tests/capturas/retratos.mjs
// Fuentes: tests/capturas/retratos/fuente/<persona>.webp, lámina 1536 x 1024 con fondo transparente,
// 4 columnas x 2 filas en el orden de Retrato.tsx: neutral, feliz, pensando, preocupada (arriba) y
// habla_cerrada, habla_abierta, habla_redonda, parpadeo (abajo).
import { chromium } from "@playwright/test";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const PERSONAS = ["nino", "ingeniera", "doctora", "meteorologa"];
const EXPRESIONES = ["neutral", "feliz", "pensando", "preocupada", "habla_cerrada", "habla_abierta", "habla_redonda", "parpadeo"];
const ANCHOS = [160, 320];
const CALIDAD = 0.82;
const FUENTE = "tests/capturas/retratos/fuente";
const SALIDA = "ui/public/retratos";
mkdirSync(SALIDA, { recursive: true });

const navegador = await chromium.launch();
const page = await navegador.newPage();
let total = 0;

for (const persona of PERSONAS) {
  const dataUrl = `data:image/webp;base64,${readFileSync(join(FUENTE, `${persona}.webp`)).toString("base64")}`;
  const salida = await page.evaluate(async ({ dataUrl, anchos, calidad }) => {
    const img = new Image();
    img.src = dataUrl;
    await img.decode();
    const W = img.width, H = img.height, cw = W / 4, ch = H / 2;
    const lienzo = new OffscreenCanvas(W, H);
    const g = lienzo.getContext("2d");
    g.drawImage(img, 0, 0);
    const px = g.getImageData(0, 0, W, H).data;

    // Caja del dibujo en cada celda (alfa > 24 para no contar polvo transparente).
    const cajas = [];
    for (let f = 0; f < 2; f++) for (let k = 0; k < 4; k++) {
      let x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1;
      for (let y = f * ch; y < (f + 1) * ch; y++) for (let x = k * cw; x < (k + 1) * cw; x++) {
        if (px[(y * W + x) * 4 + 3] > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      }
      cajas.push({ x0, y0, x1, y1 });
    }
    // Un solo lado para las 8: el mayor ancho o alto, con un margen chico.
    const lado = Math.ceil(Math.max(...cajas.map((c) => Math.max(c.x1 - c.x0 + 1, c.y1 - c.y0 + 1))) * 1.04);

    const archivos = [];
    for (const [i, c] of cajas.entries()) {
      const sx = (c.x0 + c.x1 + 1) / 2 - lado / 2;
      const sy = c.y1 + 1 - lado; // apoyado en la base del busto
      // Solo los píxeles de su celda: el cuadrado es más ancho que la celda y, sin esto, se colaba el
      // borde del casco de la cara vecina.
      const cx = (i % 4) * cw, cy = Math.floor(i / 4) * ch;
      const cara = new OffscreenCanvas(lado, lado);
      cara.getContext("2d").drawImage(lienzo, cx, cy, cw, ch, cx - sx, cy - sy, cw, ch);
      for (const ancho of anchos) {
        // Dos pasos al achicar mucho: primero al doble y después al ancho final (bordes más limpios).
        let fuente = cara, fx = 0, fy = 0, fl = lado;
        if (lado > ancho * 2) {
          const medio = new OffscreenCanvas(ancho * 2, ancho * 2);
          const gm = medio.getContext("2d");
          gm.imageSmoothingQuality = "high";
          gm.drawImage(cara, 0, 0, lado, lado, 0, 0, ancho * 2, ancho * 2);
          fuente = medio; fl = ancho * 2;
        }
        const fin = new OffscreenCanvas(ancho, ancho);
        const gf = fin.getContext("2d");
        gf.imageSmoothingQuality = "high";
        gf.drawImage(fuente, fx, fy, fl, fl, 0, 0, ancho, ancho);
        const blob = await fin.convertToBlob({ type: "image/webp", quality: calidad });
        const bytes = new Uint8Array(await blob.arrayBuffer());
        let bin = "";
        for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
        archivos.push({ ancho, base64: btoa(bin) });
      }
    }
    return { lado, archivos };
  }, { dataUrl, anchos: ANCHOS, calidad: CALIDAD });

  const pesos = [];
  salida.archivos.forEach(({ ancho, base64 }, i) => {
    const expresion = EXPRESIONES[Math.floor(i / ANCHOS.length)];
    const buf = Buffer.from(base64, "base64");
    writeFileSync(join(SALIDA, `${persona}-${expresion}-${ancho}.webp`), buf);
    pesos.push(buf.length);
    total += buf.length;
  });
  console.log(`${persona}: lado ${salida.lado} px, ${pesos.length} archivos, de ${Math.min(...pesos)} a ${Math.max(...pesos)} bytes`);
}

await navegador.close();
console.log(`total ${(total / 1024).toFixed(1)} KB en ${SALIDA}`);
