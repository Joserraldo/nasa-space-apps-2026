/**
 * Fracción del recuadro en sombra permanente (LOLA, Mazarico et al. 2011) → añade `sombraPermanenteLola` a cada sitio de
 * data/terreno/luna-polo-sur/hielo.json. Estático, no en vivo. Sin clave. Una petición cada ~2 s.
 * Capa: LRO_LOLA_Illumination_SPole65S_240m_EQ ("LOLA Permanently Shadowed Regions Southpole 240m", mapa binario: 1 = sombra permanente).
 * Moon Trek NO la sirve por ArcGIS: solo por WMTS (teselas PNG, 256 px, escala de grises + alfa). Se usa la versión EQ
 * (equirectangular, nivel 5 = 0,0220° por píxel ≈ 667 m en latitud) porque la polar (SP) solo llega al nivel 3 (≈1070 m/px).
 * Lectura del PNG (modo LA): sombra permanente = valor 1 con alfa ≥ 128 (el alfa < 255 son bordes remuestreados); valor 0 = no.
 * Por cada píxel (centro) del recuadro de 128×128 de consulta.json: (x,y) polar → lat/lon (estereográfica polar sur, esfera
 * de 1737,4 km, x = ρ·sin(lon), y = ρ·cos(lon)) → píxel de la tesela EQ más cercano.
 * Uso: npm run luna-sur:psr
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { inflateSync } from "node:zlib";
import { RAIZ } from "./config";

export const CAPA_PSR = "LRO_LOLA_Illumination_SPole65S_240m_EQ";
export const WMTS_PSR = `https://trek.nasa.gov/tiles/Moon/EQ/${CAPA_PSR}/1.0.0/default/default028mm`;
const NIVEL = 5, TESELA = 256, COLS = 64 * TESELA, FILAS = 32 * TESELA;
const R = 1737400;
const DIR = join(RAIZ, "terreno", "luna-polo-sur");

/** PNG 8 bits sin entrelazado, modo gris+alfa (tipo 4) → Uint8Array [L,A,L,A…]. */
export function leerPngLA(buf: Buffer): { w: number; h: number; datos: Uint8Array } {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error("no es PNG");
  let p = 8, w = 0, h = 0;
  const idat: Buffer[] = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p), tipo = buf.toString("latin1", p + 4, p + 8), d = buf.subarray(p + 8, p + 8 + len);
    if (tipo === "IHDR") {
      w = d.readUInt32BE(0); h = d.readUInt32BE(4);
      if (d[8] !== 8 || d[9] !== 4 || d[12] !== 0) throw new Error(`PNG no soportado (prof ${d[8]}, tipo ${d[9]}, entrelazado ${d[12]})`);
    } else if (tipo === "IDAT") idat.push(d);
    p += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat)), bpp = 2, fila = w * bpp;
  const out = new Uint8Array(h * fila);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (fila + 1)]!;
    for (let i = 0; i < fila; i++) {
      const x = raw[y * (fila + 1) + 1 + i]!;
      const a = i >= bpp ? out[y * fila + i - bpp]! : 0, b = y ? out[(y - 1) * fila + i]! : 0, c = i >= bpp && y ? out[(y - 1) * fila + i - bpp]! : 0;
      let v: number;
      if (f === 0) v = x; else if (f === 1) v = x + a; else if (f === 2) v = x + b; else if (f === 3) v = x + ((a + b) >> 1);
      else if (f === 4) { const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c); v = x + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c); }
      else throw new Error("filtro PNG " + f);
      out[y * fila + i] = v & 255;
    }
  }
  return { w, h, datos: out };
}

/** Polar sur (m) → lat/lon (grados). Inversa de lonLatAPolarSur de src/terreno.ts. */
export function polarALatLon(x: number, y: number) {
  const rho = Math.hypot(x, y);
  return { lat: -90 + (2 * Math.atan(rho / (2 * R)) * 180) / Math.PI, lon: (Math.atan2(x, y) * 180) / Math.PI };
}

export function pixelEq(lat: number, lon: number) {
  const px = Math.min(COLS - 1, Math.max(0, Math.floor(((lon + 180) / 360) * COLS)));
  const py = Math.min(FILAS - 1, Math.max(0, Math.floor(((90 - lat) / 180) * FILAS)));
  return { px, py, col: Math.floor(px / TESELA), fila: Math.floor(py / TESELA) };
}

/** 1 si el píxel es sombra permanente (valor 1 y alfa ≥ 128), 0 si no. */
export const esPsr = (l: number, a: number) => (l >= 1 && a >= 128 ? 1 : 0);

const pausa = () => new Promise((r) => setTimeout(r, 2000));
async function main() {
  const consulta = JSON.parse(readFileSync(join(DIR, "consulta.json"), "utf-8"));
  const hieloPath = join(DIR, "hielo.json");
  const hielo = JSON.parse(readFileSync(hieloPath, "utf-8"));
  const cache = new Map<string, ReturnType<typeof leerPngLA>>();
  const tesela = async (fila: number, col: number) => {
    const k = `${fila}/${col}`;
    if (!cache.has(k)) {
      const url = `${WMTS_PSR}/${NIVEL}/${fila}/${col}.png`;
      const r = await fetch(url);
      await pausa();
      if (!r.ok) throw new Error(`HTTP ${r.status} en ${url}`);
      cache.set(k, leerPngLA(Buffer.from(await r.arrayBuffer())));
    }
    return cache.get(k)!;
  };
  const valor = async (lat: number, lon: number) => {
    const { px, py, col, fila } = pixelEq(lat, lon);
    const t = await tesela(fila, col);
    const i = ((py - fila * TESELA) * TESELA + (px - col * TESELA)) * 2;
    return esPsr(t.datos[i]!, t.datos[i + 1]!);
  };
  const n = consulta.dem.ancho;
  for (const s of consulta.sitios) {
    const b = s.bboxM, dx = (b.xmax - b.xmin) / n, dy = (b.ymax - b.ymin) / n;
    let psr = 0;
    for (let j = 0; j < n; j++)
      for (let i = 0; i < n; i++) {
        const { lat, lon } = polarALatLon(b.xmin + (i + 0.5) * dx, b.ymax - (j + 0.5) * dy);
        psr += await valor(lat, lon);
      }
    const centro = (await valor(s.lat, s.lon)) === 1;
    const fraccion = Math.round((psr / (n * n)) * 1000) / 1000;
    hielo.sitios.find((x: any) => x.id === s.id).sombraPermanenteLola = { fraccion, centro, pixeles: psr, pixelesTotal: n * n };
    console.log(`${s.id}: ${(fraccion * 100).toFixed(1)} % del recuadro en sombra permanente, centro ${centro}`);
  }
  hielo.sombraPermanenteLola = {
    capa: CAPA_PSR, url: `https://trek.nasa.gov/tiles/Moon/EQ/${CAPA_PSR}/1.0.0/WMTSCapabilities.xml`, nivelWmts: NIVEL,
    consultadoEl: new Date().toISOString().slice(0, 10),
  };
  writeFileSync(hieloPath, JSON.stringify(hielo, null, 2) + "\n");
}

if (process.argv[1]?.endsWith("luna-sur-psr.ts")) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
