// Regenera las pistas de locución del trailer (una por escena) en inglés y en español.
//
// Uso:
//   node pitch/trailer/voces.mjs                      # proveedor edge (por defecto), en + es
//   node pitch/trailer/voces.mjs --proveedor elevenlabs --idioma en
//
// Proveedores:
//   edge        edge-tts (voces neurales de Microsoft, sin clave). Binario: $EDGE_TTS o `edge-tts` en el PATH.
//   elevenlabs  API de ElevenLabs. La clave se lee SOLO de la variable de entorno ELEVENLABS_API_KEY
//               (o del .env de la raíz del repo); nunca se imprime ni se escribe en disco.
//
// Lee el texto de pitch/trailer/guion.json y escribe:
//   pitch/trailer/assets/voces/<idioma>/<id>.mp3   (no se suben al repo)
//   pitch/trailer/assets/voces/duraciones.json     (segundos por pista; se mide con ffprobe: $FFPROBE o `ffprobe`)
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, "..", "..");
const args = process.argv.slice(2);
const opcion = (n, def) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : def; };
const proveedor = opcion("proveedor", process.env.VOCES_PROVEEDOR ?? "edge");
const idiomas = (opcion("idioma", "en,es")).split(",");
const guion = JSON.parse(readFileSync(join(AQUI, "guion.json"), "utf8"));

function claveElevenLabs() {
  if (process.env.ELEVENLABS_API_KEY) return process.env.ELEVENLABS_API_KEY;
  const env = join(RAIZ, ".env");
  if (existsSync(env)) {
    const m = readFileSync(env, "utf8").match(/^ELEVENLABS_API_KEY\s*=\s*"?([^"\r\n]+)"?/m);
    if (m) return m[1].trim();
  }
  throw new Error("Falta ELEVENLABS_API_KEY en el entorno o en el .env de la raíz.");
}

async function edge(texto, voz, salida, idioma) {
  const bin = process.env.EDGE_TTS ?? "edge-tts";
  execFileSync(bin, ["--voice", voz, `--rate=${guion.voces.edge.velocidad?.[idioma] ?? "+0%"}`, "--text", texto, "--write-media", salida], { stdio: "inherit" });
}

async function elevenlabs(texto, voz, salida) {
  const clave = claveElevenLabs();
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voz}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": clave, "content-type": "application/json" },
    body: JSON.stringify({
      text: texto,
      model_id: guion.voces.elevenlabs.modelo,
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });
  if (!r.ok) throw new Error(`ElevenLabs respondió ${r.status}`); // sin cuerpo ni cabeceras: no se filtra la clave
  writeFileSync(salida, Buffer.from(await r.arrayBuffer()));
}

const PROVEEDORES = { edge, elevenlabs };
if (!PROVEEDORES[proveedor]) throw new Error(`Proveedor desconocido: ${proveedor}`);

const durPath = join(AQUI, "assets", "voces", "duraciones.json");
const duraciones = existsSync(durPath) ? JSON.parse(readFileSync(durPath, "utf8")) : {};
for (const idioma of idiomas) {
  const dir = join(AQUI, "assets", "voces", idioma);
  mkdirSync(dir, { recursive: true });
  const voz = guion.voces[proveedor][idioma];
  for (const l of guion.lineas) {
    const salida = join(dir, `${l.id}.mp3`);
    await PROVEEDORES[proveedor](l[idioma], voz, salida, idioma);
    const s = Number(execFileSync(process.env.FFPROBE ?? "ffprobe",
      ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", salida]).toString().trim());
    duraciones[idioma] = { ...(duraciones[idioma] ?? {}), [l.id]: Math.round(s * 100) / 100 };
    console.log(`${proveedor} ${idioma}/${l.id}: ${s.toFixed(2)} s`);
  }
}
writeFileSync(durPath, JSON.stringify(duraciones, null, 2));
