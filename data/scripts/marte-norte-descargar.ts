/**
 * Mars Trek (polo norte) → data/terreno/marte-norte (estático, no en vivo). No necesita clave.
 *  - Posición de cada sitio: capa combinedNom_np (nomenclátor UAI) de Mars Trek, guardada en consulta.json.
 *  - <sitio>/elevacion.bin: DEM MOLA polar norte (Float32 → Int16 LE, metros), cuadro de 24 km (160×160).
 *    El servicio polar solo responde si NO se manda bboxSR/imageSR (su SR nativo es la estereográfica polar norte).
 *  - consulta.json guarda además el identify del centro en el DEM polar y en el DEM global (verificación independiente).
 * Una petición cada ~2 s. Uso: npm run marte-norte:descargar
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { RAIZ } from "./config";
import { MARTE_NORTE_CUADRO, proyectarPolarNorte } from "../src/terreno";

const ARCGIS = "https://trek.nasa.gov/mars/trekarcgis/rest/services";
const DEM_POLAR = "mola128_mola64_merge_90Nto90S_SimpleC_clon0_NP";
const DEM_GLOBAL = "Mars_MOLA_blend200ppx_HRSC_DEM_clon0dd_200mpp_lzw";
const NOMENCLATURA = `${ARCGIS}/combinedNom_np/MapServer/0/query`;

export const SITIOS = [
  { id: "crater-louth", nombre: "Louth" },
  { id: "crater-escorial", nombre: "Escorial" },
  { id: "dunas-olympia-undae", nombre: "Olympia Undae" },
  { id: "canon-chasma-boreale", nombre: "Chasma Boreale" },
] as const;

const pausa = () => new Promise((r) => setTimeout(r, 2000));
async function bajar(url: string): Promise<Buffer> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status} en ${url}`);
  await pausa();
  return Buffer.from(await r.arrayBuffer());
}
async function identify(capa: string, x: number, y: number): Promise<number> {
  const g = encodeURIComponent(JSON.stringify({ x, y }));
  const url = `${ARCGIS}/${capa}/ImageServer/identify?geometry=${g}&geometryType=esriGeometryPoint&returnGeometry=false&f=json`;
  return Number(JSON.parse((await bajar(url)).toString()).value);
}

async function main() {
  const dir = join(RAIZ, "terreno", "marte-norte");
  const { medioM: m, px } = MARTE_NORTE_CUADRO;
  const sitios = [];
  for (const s of SITIOS) {
    const urlPos = `${NOMENCLATURA}?where=${encodeURIComponent(`clean_name='${s.nombre}'`)}&outFields=clean_name,type,center_lat,center_lon,diameter,approval&returnGeometry=false&f=json`;
    const a = JSON.parse((await bajar(urlPos)).toString()).features[0].attributes;
    const lon: number = a.center_lon, lat: number = a.center_lat;
    const { x, y } = proyectarPolarNorte(lon, lat);
    const bboxM = { xmin: x - m, ymin: y - m, xmax: x + m, ymax: y + m };
    mkdirSync(join(dir, s.id), { recursive: true });

    const urlDem = `${ARCGIS}/${DEM_POLAR}/ImageServer/exportImage?bbox=${bboxM.xmin},${bboxM.ymin},${bboxM.xmax},${bboxM.ymax}&size=${px},${px}&format=bsq&pixelType=F32&interpolation=RSP_BilinearInterpolation&f=image`;
    const crudo = await bajar(urlDem);
    if (crudo.length < px * px * 4) throw new Error(`DEM corto: ${crudo.length} bytes`);
    const metros = new Int16Array(px * px);
    for (let i = 0; i < metros.length; i++) {
      const v = crudo.readFloatLE(i * 4);
      if (!Number.isFinite(v) || v < -20000) throw new Error(`DEM con huecos en ${s.id}`);
      metros[i] = Math.round(v);
    }
    writeFileSync(join(dir, s.id, "elevacion.bin"), Buffer.from(metros.buffer));

    const identifyPolarM = await identify(DEM_POLAR, x, y);
    const identifyGlobalM = await identify(DEM_GLOBAL, lon > 180 ? lon - 360 : lon, lat);
    sitios.push({ id: s.id, nombre: a.clean_name, tipo: a.type, diametroKm: a.diameter, aprobacion: a.approval, lat, lon, x, y, bboxM, urlPos, urlDem, identifyPolarM, identifyGlobalM });
  }
  writeFileSync(
    join(dir, "consulta.json"),
    JSON.stringify(
      {
        consultadoEl: new Date().toISOString().slice(0, 10),
        proyeccion: "Estereográfica polar norte, esfera Mars 2000 (R = 3396190 m), meridiano central 0, metros: x = ρ·sin(lon), y = −ρ·cos(lon), ρ = 2R·tan((90−lat)/2)",
        dem: { capa: DEM_POLAR, unidad: "m", tipo: "Int16LE", ancho: px, alto: px, filaCero: "borde de y máxima" },
        demGlobal: { capa: DEM_GLOBAL },
        sitios,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(`${sitios.length} sitios, DEM ${px}x${px} cada uno`);
  for (const s of sitios) console.log(s.id, s.lat.toFixed(3), s.lon.toFixed(3), "polar", s.identifyPolarM, "global", s.identifyGlobalM);
}

if (process.argv[1]?.endsWith("marte-norte-descargar.ts")) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
