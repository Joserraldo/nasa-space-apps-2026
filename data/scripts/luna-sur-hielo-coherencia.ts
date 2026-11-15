/**
 * Coherencia de SP_IceLoc_280m con la sombra permanente: cuántos de sus puntos caen donde el Sol nunca sale
 * (AVGVISIB_65S_240M_201608 = 0, NASA GSFC PGDA). Añade `puntosEnSombra` a cada sitio de hielo.json. Sin clave; 1 petición/2 s.
 * Es una comprobación de plausibilidad (Li et al. 2018: hielo en sombra permanente), no una validación del artículo.
 * Uso: npm run luna-sur:hielo-coherencia (después de luna-sur:hielo y luna-sur:psr)
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { aPolarSur } from "../src/terreno";
import { RAIZ } from "./config";
import { BASE_IMG, colDe, ESCALA, filaDe, PRODUCTOS } from "./luna-sur-luz";

const DIR = join(RAIZ, "terreno", "luna-polo-sur");
const p = PRODUCTOS["240m"];
async function main() {
  const h = JSON.parse(readFileSync(join(DIR, "hielo.json"), "utf-8"));
  const c = JSON.parse(readFileSync(join(DIR, "consulta.json"), "utf-8"));
  for (const s of h.sitios) {
    if (!s.hielo.puntos.length) { s.hielo.puntosEnSombra = 0; continue; }
    const b = c.sitios.find((x: any) => x.id === s.id).bboxM;
    const f0 = filaDe(b.ymax, p), f1 = filaDe(b.ymin, p), by = p.n * 2;
    const r = await fetch(`${BASE_IMG}/${p.sol}.IMG`, { headers: { Range: `bytes=${f0 * by}-${(f1 + 1) * by - 1}` } });
    await new Promise((ok) => setTimeout(ok, 2000));
    if (r.status !== 206) throw new Error(`HTTP ${r.status}`);
    const buf = Buffer.from(await r.arrayBuffer());
    const a = new Int16Array(buf.buffer, buf.byteOffset, buf.length / 2);
    s.hielo.puntosEnSombra = s.hielo.puntos.filter((q: any) => {
      const { x, y } = aPolarSur(q.lat, q.lon);
      return a[(filaDe(y, p) - f0) * p.n + colDe(x, p)]! * ESCALA === 0;
    }).length;
    console.log(`${s.id}: ${s.hielo.puntosEnSombra}/${s.hielo.puntos.length} puntos de hielo con Sol = 0`);
  }
  writeFileSync(join(DIR, "hielo.json"), JSON.stringify(h, null, 2) + "\n");
}
if (process.argv[1]?.endsWith("luna-sur-hielo-coherencia.ts")) main().catch((e) => { console.error(e); process.exit(1); });
