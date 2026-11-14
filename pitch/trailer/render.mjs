// Renderiza el trailer en inglés (index.html) y en español (copia generada en out/proyecto-es/).
// Uso: node pitch/trailer/render.mjs [en|es|en,es] [--calidad draft|standard]
// Requisitos: ffmpeg/ffprobe en el PATH, assets generados (capturar.mjs, voces.mjs, musica.mjs).
// Salida: pitch/trailer/out/solar-shield-trailer-<idioma>.mp4  (no se sube al repo)
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const idiomas = (args.find((a) => !a.startsWith("--")) ?? "en,es").split(",");
const iq = args.indexOf("--calidad");
const calidad = iq >= 0 ? args[iq + 1] : "standard";
const OUT = join(AQUI, "out");
mkdirSync(OUT, { recursive: true });

function render(dir, idioma) {
  const salida = join(OUT, `solar-shield-trailer-${idioma}.mp4`);
  // shell: true para que npx funcione en Windows; las rutas van entre comillas (pueden tener espacios).
  execFileSync("npx", ["hyperframes", "render", ".", "--quality", calidad, "--output", JSON.stringify(salida), "--quiet"], { cwd: dir, stdio: "inherit", shell: true });
  console.log("listo:", salida);
}

for (const idioma of idiomas) {
  if (idioma === "en") { render(AQUI, "en"); continue; }
  // Versión en español: misma composición; cambian <html lang>, la etiqueta "Cinemática" y las pistas de voz.
  const dir = join(OUT, `proyecto-${idioma}`);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  for (const f of ["compositions", "assets", "hyperframes.json", "meta.json"]) cpSync(join(AQUI, f), join(dir, f), { recursive: true });
  const html = readFileSync(join(AQUI, "index.html"), "utf8")
    .replace('<html lang="en">', `<html lang="${idioma}">`)
    .replace('"etiqueta":"Cinematic"', '"etiqueta":"Cinemática"')
    .replaceAll("assets/voces/en/", `assets/voces/${idioma}/`);
  writeFileSync(join(dir, "index.html"), html);
  // capturas del juego en el idioma del corte (fijas en el HTML, sin depender del script de la escena)
  const juego = join(dir, "compositions", "juego.html");
  writeFileSync(juego, readFileSync(juego, "utf8").replaceAll("-en.png\"", `-${idioma}.png"`));
  render(dir, idioma);
}
