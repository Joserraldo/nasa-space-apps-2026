/**
 * Moon Trek → data/terreno/luna-polo-sur/hielo.json (estático, no en vivo). Sin clave. Una petición cada ~2 s.
 * Por cada recuadro de 15,36 km de consulta.json:
 *  - PSR_SP (MapServer/0, puntos): centros de regiones en sombra permanente DENTRO del recuadro (id, área, cobertura).
 *    La capa son puntos (centroides), no polígonos: no se puede medir una fracción en sombra.
 *  - SP_IceLoc_280m (MapServer/0, puntos): lugares con señal de hielo dentro del recuadro (la capa no explica qué mide).
 *  - DIVINER_{summer,winter}_Max_Temp_SP_below110K_240mp (ImageServer, F32 K): temperatura MÁXIMA de la estación; el
 *    servicio solo guarda píxeles < 110 K (el resto es "sin valor" = -3,4e38). Se resume: fracción del recuadro < 110 K y mínimo.
 * Uso: npm run luna-sur:hielo
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { RAIZ } from "./config";

const ARCGIS = "https://trek.nasa.gov/moon/trekarcgis/rest/services";
const DIR = join(RAIZ, "terreno", "luna-polo-sur");
const pausa = () => new Promise((r) => setTimeout(r, 2000));
async function bajar(url: string): Promise<Buffer> {
  for (let intento = 1; ; intento++) {
    const r = await fetch(url);
    await pausa();
    if (r.ok) return Buffer.from(await r.arrayBuffer());
    if (intento >= 3) throw new Error(`HTTP ${r.status} en ${url}`);
  }
}

async function diviner(capa: string, caja: string, px: number) {
  const url = `${ARCGIS}/${capa}/ImageServer/exportImage?bbox=${caja}&size=${px},${px}&format=bsq&pixelType=F32&interpolation=RSP_NearestNeighbor&f=image`;
  const b = await bajar(url);
  if (b.length < px * px * 4) throw new Error(`Diviner corto: ${b.length}`);
  let validos = 0, min = Infinity, max = -Infinity;
  for (let i = 0; i < px * px; i++) {
    const v = b.readFloatLE(i * 4);
    if (v > 0 && v < 110.0001) { validos++; min = Math.min(min, v); max = Math.max(max, v); }
  }
  return { url, pixelesBajo110K: validos, pixelesTotal: px * px, minimoK: validos ? Math.round(min * 10) / 10 : null, maximoK: validos ? Math.round(max * 10) / 10 : null };
}

async function main() {
  const consulta = JSON.parse(readFileSync(join(DIR, "consulta.json"), "utf-8"));
  const px = consulta.dem.ancho;
  const sitios: any[] = [];
  for (const s of consulta.sitios) {
    const b = s.bboxM;
    const caja = `${b.xmin},${b.ymin},${b.xmax},${b.ymax}`;
    const env = `geometry=${caja}&geometryType=esriGeometryEnvelope&spatialRel=esriSpatialRelIntersects&returnGeometry=false&f=json`;
    const urlPsr = `${ARCGIS}/PSR_SP/MapServer/0/query?${env}&outFields=PSR_ID,Cent__Lat_,Cent__Long,Area__km2_,Lunar_Feat,Coverage__,Data_Quali`;
    const psr = JSON.parse((await bajar(urlPsr)).toString()).features.map((f: any) => f.attributes);
    const urlHielo = `${ARCGIS}/SP_IceLoc_280m/MapServer/0/query?${env}&outFields=FID,x,y`;
    const hielo = JSON.parse((await bajar(urlHielo)).toString()).features.map((f: any) => f.attributes);
    const verano = await diviner("DIVINER_summer_Max_Temp_SP_below110K_240mp", caja, px);
    const invierno = await diviner("DIVINER_winter_Max_Temp_SP_below110K_240mp", caja, px);
    sitios.push({
      id: s.id,
      psr: { url: urlPsr, regiones: psr.map((a: any) => ({ id: a.PSR_ID, lat: a.Cent__Lat_, lon: a.Cent__Long, areaKm2: a.Area__km2_, cobertura: a.Coverage__, calidad: a.Data_Quali, rasgo: a.Lunar_Feat })) },
      hielo: { url: urlHielo, puntos: hielo.map((a: any) => ({ fid: a.FID, lon: a.x, lat: a.y })) },
      diviner: { verano, invierno },
    });
    console.log(`${s.id}: PSR ${psr.length}, hielo ${hielo.length}, <110K verano ${verano.pixelesBajo110K}/${px * px} (min ${verano.minimoK} K)`);
  }
  writeFileSync(join(DIR, "hielo.json"), JSON.stringify({ consultadoEl: new Date().toISOString().slice(0, 10), sitios }, null, 2) + "\n");
}

if (process.argv[1]?.endsWith("luna-sur-hielo.ts")) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
