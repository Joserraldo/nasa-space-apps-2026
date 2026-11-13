/**
 * Mars Trek → data/terreno/jezero (estático, no en vivo). No necesita clave.
 *  - elevacion.bin: DEM MOLA+HRSC (200 m/px nativo) exportado como Float32 LE y guardado como Int16 LE (metros).
 *  - sombreado.jpg: relieve sombreado MOLA+HRSC de Trek (producto de Trek, no lo calculamos).
 *  - ctx/<fila>_<col>.png: teselas WMTS de la mosaico CTX de Jezero (nivel 9, ~80 m/px).
 *  - consulta.json: URLs, fecha y metadatos.
 * Uso: npm run jezero:descargar
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { RAIZ } from "./config";
import { JEZERO } from "../src/terreno";

const ARCGIS = "https://trek.nasa.gov/mars/trekarcgis/rest/services";
const DEM = "Mars_MOLA_blend200ppx_HRSC_DEM_clon0dd_200mpp_lzw";
const SOMBRA = "Mars_MOLA_blend200ppx_HRSC_Shade_clon0dd_200mpp_lzw";
const CTX = "Jezero_CTX_BlockAdj_dd";
const NIVEL_CTX = 9;

async function bajar(url: string): Promise<Buffer> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status} en ${url}`);
  return Buffer.from(await r.arrayBuffer());
}

async function main() {
  const { oeste, sur, este, norte, ancho, alto } = JEZERO;
  const dir = join(RAIZ, "terreno", "jezero");
  mkdirSync(join(dir, "ctx"), { recursive: true });
  const bbox = `${oeste},${sur},${este},${norte}`;

  const urlDem = `${ARCGIS}/${DEM}/ImageServer/exportImage?bbox=${bbox}&bboxSR=104905&size=${ancho},${alto}&format=bsq&pixelType=F32&interpolation=RSP_BilinearInterpolation&f=image`;
  const crudo = await bajar(urlDem);
  if (crudo.length < ancho * alto * 4) throw new Error(`DEM corto: ${crudo.length} bytes`);
  const metros = new Int16Array(ancho * alto);
  for (let i = 0; i < metros.length; i++) metros[i] = Math.round(crudo.readFloatLE(i * 4));
  writeFileSync(join(dir, "elevacion.bin"), Buffer.from(metros.buffer));

  const urlSombra = `${ARCGIS}/${SOMBRA}/ImageServer/exportImage?bbox=${bbox}&bboxSR=104905&size=1024,1024&format=jpg&f=image`;
  writeFileSync(join(dir, "sombreado.jpg"), await bajar(urlSombra));

  const paso = 180 / 2 ** NIVEL_CTX;
  const cols = [Math.floor((oeste + 180) / paso), Math.floor((este + 180) / paso)];
  const filas = [Math.floor((90 - norte) / paso), Math.floor((90 - sur) / paso)];
  const teselas: { archivo: string; oeste: number; norte: number; grados: number }[] = [];
  for (let f = filas[0]; f <= filas[1]; f++)
    for (let c = cols[0]; c <= cols[1]; c++) {
      const archivo = `ctx/${f}_${c}.png`;
      writeFileSync(join(dir, archivo), await bajar(`https://trek.nasa.gov/tiles/Mars/EQ/${CTX}/1.0.0/default/default028mm/${NIVEL_CTX}/${f}/${c}.png`));
      teselas.push({ archivo, oeste: c * paso - 180, norte: 90 - f * paso, grados: paso });
    }

  writeFileSync(
    join(dir, "consulta.json"),
    JSON.stringify(
      {
        consultadoEl: new Date().toISOString().slice(0, 10),
        dem: { capa: DEM, url: urlDem, unidad: "m", tipo: "Int16LE", ancho, alto, bbox: { oeste, sur, este, norte } },
        sombreado: { capa: SOMBRA, url: urlSombra, ancho: 1024, alto: 1024, bbox: { oeste, sur, este, norte } },
        ctx: { capa: CTX, nivel: NIVEL_CTX, pixeles: 256, teselas },
      },
      null,
      2,
    ) + "\n",
  );
  console.log(`DEM ${ancho}x${alto}, sombreado 1024², ${teselas.length} teselas CTX`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
