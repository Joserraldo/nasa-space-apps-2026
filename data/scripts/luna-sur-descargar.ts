/**
 * Moon Trek → data/terreno/luna-polo-sur (estático, no en vivo). No necesita clave.
 *  - Posición: capa CombinedNomenclature de Moon Trek (nomenclátor IAU), campos center_lat / center_lon.
 *  - <sitio>/elevacion.bin: DEM LOLA polar LRO_LOLA_DEM_SPole75_30mp_v04 (Float32 → Int16 LE, metros),
 *    cuadro de 15,36 km en proyección estereográfica polar sur (128×128 px de 120 m).
 *  - Sin sombreado: el ClrShade global de Trek sale negro al reproyectarlo al polo (probado); la UI puede sombrear desde el DEM.
 * Una petición cada ~2 s. Uso: npm run luna-sur:descargar
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { RAIZ } from "./config";
import { LUNA_SUR_CUADRO, WKT_POLAR_SUR, aPolarSur } from "../src/terreno";

const ARCGIS = "https://trek.nasa.gov/moon/trekarcgis/rest/services";
const DEM = "LRO_LOLA_DEM_SPole75_30mp_v04";
const NOMENCLATURA = `${ARCGIS}/CombinedNomenclature/MapServer/0/query`;

/** id del juego → nombre del accidente en el nomenclátor. */
export const SITIOS_SUR = [
  { id: "shackleton", nombre: "Shackleton" },
  { id: "haworth", nombre: "Haworth" },
  { id: "faustini", nombre: "Faustini" },
  { id: "malapert", nombre: "Malapert" },
  { id: "nobile", nombre: "Nobile" },
  { id: "de-gerlache", nombre: "de Gerlache" },
] as const;

const pausa = () => new Promise((r) => setTimeout(r, 2000));
async function bajar(url: string): Promise<Buffer> {
  for (let intento = 1; ; intento++) {
    const r = await fetch(url);
    await pausa();
    if (r.ok) return Buffer.from(await r.arrayBuffer());
    if (intento >= 3) throw new Error(`HTTP ${r.status} en ${url}`);
  }
}

async function main() {
  const dir = join(RAIZ, "terreno", "luna-polo-sur");
  const { ladoM, px } = LUNA_SUR_CUADRO;
  const sitios = [];
  for (const s of SITIOS_SUR) {
    const where = `LABEL='${s.nombre}' AND type='Crater, craters'`;
    const urlPos = `${NOMENCLATURA}?where=${encodeURIComponent(where)}&outFields=LABEL,type,center_lat,center_lon,diameter,approval,origin&returnGeometry=false&f=json`;
    const feats = JSON.parse((await bajar(urlPos)).toString()).features;
    if (feats.length !== 1) throw new Error(`${s.nombre}: ${feats.length} resultados en el nomenclátor`);
    const a = feats[0].attributes;
    const { x, y } = aPolarSur(a.center_lat, a.center_lon);
    const bboxM = { xmin: Math.round(x - ladoM / 2), ymin: Math.round(y - ladoM / 2), xmax: Math.round(x + ladoM / 2), ymax: Math.round(y + ladoM / 2) };
    const caja = `${bboxM.xmin},${bboxM.ymin},${bboxM.xmax},${bboxM.ymax}`;
    mkdirSync(join(dir, s.id), { recursive: true });

    const urlDem = `${ARCGIS}/${DEM}/ImageServer/exportImage?bbox=${caja}&size=${px},${px}&format=bsq&pixelType=F32&interpolation=RSP_BilinearInterpolation&f=image`;
    const crudo = await bajar(urlDem);
    if (crudo.length < px * px * 4) throw new Error(`DEM corto: ${crudo.length} bytes`);
    const metros = new Int16Array(px * px);
    for (let i = 0; i < metros.length; i++) {
      const v = crudo.readFloatLE(i * 4);
      // Rango del DEM LOLA (−9126 a 10767 m): fuera de él es relleno o error, no elevación.
      if (!Number.isFinite(v) || v < -9200 || v > 10800) throw new Error(`DEM con huecos o relleno en ${s.id}: ${v}`);
      metros[i] = Math.round(v);
    }
    writeFileSync(join(dir, s.id, "elevacion.bin"), Buffer.from(metros.buffer));

    sitios.push({ id: s.id, nombreIau: a.LABEL, tipo: a.type, aprobacion: a.approval, diametroKm: a.diameter, lat: a.center_lat, lon: a.center_lon, x: Math.round(x), y: Math.round(y), bboxM, urlPos, urlDem });
  }
  writeFileSync(
    join(dir, "consulta.json"),
    JSON.stringify({ consultadoEl: new Date().toISOString().slice(0, 10), dem: { capa: DEM, unidad: "m", tipo: "Int16LE", ancho: px, alto: px, metrosPorPixel: ladoM / px }, proyeccion: WKT_POLAR_SUR, sitios }, null, 2) + "\n",
  );
  console.log(`${sitios.length} sitios, DEM ${px}x${px} cada uno`);
}

if (process.argv[1]?.endsWith("luna-sur-descargar.ts")) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
