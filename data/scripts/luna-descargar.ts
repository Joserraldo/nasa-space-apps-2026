/**
 * Moon Trek → data/terreno/luna-visible (estático, no en vivo). No necesita clave.
 *  - Posición de cada módulo Apolo: capa CombinedNomenclature de Moon Trek (se guarda en consulta.json).
 *  - <sitio>/elevacion.bin: DEM LOLA 128 px/grado (Float32 → Int16 LE, metros), cuadro de 0,5° (64×64).
 *  - <sitio>/sombreado.jpg: relieve sombreado coloreado de LOLA (producto de Trek), 256×256.
 * Una petición cada ~2 s. Uso: npm run luna:descargar
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { RAIZ } from "./config";
import { LUNA_CUADRO } from "../src/terreno";

const ARCGIS = "https://trek.nasa.gov/moon/trekarcgis/rest/services";
const DEM = "LRO_LOLA_DEM_Global_128ppd_v04";
const SOMBRA = "LRO_LOLA_ClrShade_Global_128ppd_v04";
const NOMENCLATURA = `${ARCGIS}/CombinedNomenclature/MapServer/0/query`;

export const SITIOS = [
  { id: "llanura-tranquilidad", mision: "Apollo 11 LM descent stage" },
  { id: "tierras-altas-descartes", mision: "Apollo 16 LM descent stage" },
  { id: "borde-rima-hadley", mision: "Apollo 15 LM descent stage" },
] as const;

const pausa = () => new Promise((r) => setTimeout(r, 2000));
async function bajar(url: string): Promise<Buffer> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status} en ${url}`);
  await pausa();
  return Buffer.from(await r.arrayBuffer());
}

async function main() {
  const dir = join(RAIZ, "terreno", "luna-visible");
  const { medioGrados: m, px } = LUNA_CUADRO;
  const sitios = [];
  for (const s of SITIOS) {
    const urlPos = `${NOMENCLATURA}?where=${encodeURIComponent(`Spacecraft='${s.mision}'`)}&outFields=Spacecraft,type,Lat_Y,Lon_X,link&returnGeometry=false&f=json`;
    const a = JSON.parse((await bajar(urlPos)).toString()).features[0].attributes;
    const bbox = { oeste: a.Lon_X - m, sur: a.Lat_Y - m, este: a.Lon_X + m, norte: a.Lat_Y + m };
    const caja = `${bbox.oeste},${bbox.sur},${bbox.este},${bbox.norte}`;
    mkdirSync(join(dir, s.id), { recursive: true });

    const urlDem = `${ARCGIS}/${DEM}/ImageServer/exportImage?bbox=${caja}&bboxSR=104903&size=${px},${px}&format=bsq&pixelType=F32&interpolation=RSP_BilinearInterpolation&f=image`;
    const crudo = await bajar(urlDem);
    if (crudo.length < px * px * 4) throw new Error(`DEM corto: ${crudo.length} bytes`);
    const metros = new Int16Array(px * px);
    for (let i = 0; i < metros.length; i++) {
      const v = crudo.readFloatLE(i * 4);
      if (!Number.isFinite(v)) throw new Error(`DEM con huecos en ${s.id}`);
      metros[i] = Math.round(v);
    }
    writeFileSync(join(dir, s.id, "elevacion.bin"), Buffer.from(metros.buffer));

    const urlSombra = `${ARCGIS}/${SOMBRA}/ImageServer/exportImage?bbox=${caja}&bboxSR=104903&size=256,256&format=jpg&f=image`;
    writeFileSync(join(dir, s.id, "sombreado.jpg"), await bajar(urlSombra));
    sitios.push({ id: s.id, mision: a.Spacecraft, tipo: a.type, lat: a.Lat_Y, lon: a.Lon_X, enlaceNssdc: a.link, bbox, urlPos, urlDem, urlSombra });
  }
  writeFileSync(
    join(dir, "consulta.json"),
    JSON.stringify({ consultadoEl: new Date().toISOString().slice(0, 10), dem: { capa: DEM, unidad: "m", tipo: "Int16LE", ancho: px, alto: px }, sombreado: { capa: SOMBRA }, sitios }, null, 2) + "\n",
  );
  console.log(`${sitios.length} sitios, DEM ${px}x${px} cada uno`);
}

if (process.argv[1]?.endsWith("luna-descargar.ts")) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
