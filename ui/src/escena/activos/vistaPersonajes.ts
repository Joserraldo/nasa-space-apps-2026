/**
 * Vista previa SOLO para desarrollo (`/personajes.html` con `npm run dev -w ui`): muestra los
 * personajes 3D sueltos para compararlos con su lámina. No entra en el build (Vite solo empaqueta
 * `index.html`). Parámetros:
 * - `?iris=fila` (los 4 niveles: tutorial, pistas, danada, offline) o `?iris=<nivel>` (uno de cerca).
 * - `?nino=fila` (los 6 gestos de `personajes/08`) o `?nino=<gesto>`; `&exp=<expresión>` para el rostro;
 *   `&vista=frente|lado|espalda` gira al niño como la fila de arriba de `personajes/08`.
 * Expone `window.__presupuesto` con `renderer.info` leído después de `render()`.
 */
import * as THREE from "three";
import type { BaseAiLevel } from "@solar-shield/contracts";
import { colorToken, crearMateriales } from "../materiales";
import { prefiereMenosMovimiento } from "../soporte";
import { crearAstronauta, type ExpresionAstronauta, type GestoAstronauta } from "./astronautas";
import { crearIris } from "./iris";

const NIVELES: readonly BaseAiLevel[] = ["tutorial", "pistas", "danada", "offline"];
const GESTOS: readonly GestoAstronauta[] = ["idle", "walk", "wave", "inspect", "kneel", "talk"];
const parametros = new URLSearchParams(location.search);
const pedidoNino = parametros.get("nino");
const pedidoIris = parametros.get("iris") ?? (pedidoNino ? null : "fila");

const canvas = document.getElementById("escena") as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
const escena = new THREE.Scene();
escena.background = colorToken("lila");
escena.add(new THREE.HemisphereLight(colorToken("lila"), colorToken("regolito-medio"), 1.6));
const sol = new THREE.DirectionalLight(colorToken("marfil"), 2.2);
sol.position.set(3, 6, 4);
sol.castShadow = true;
escena.add(sol);
const suelo = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshStandardMaterial({ color: colorToken("regolito-claro"), roughness: 1 }));
suelo.rotation.x = -Math.PI / 2;
suelo.receiveShadow = true;
escena.add(suelo);

const m = crearMateriales();
const reducido = prefiereMenosMovimiento();
const animables: { animar(dt: number, o: { velocidad: number; movimientoReducido: boolean }): void; velocidad: number }[] = [];
const camara = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

if (pedidoIris) {
  const lista = pedidoIris === "fila" ? NIVELES : NIVELES.filter((n) => n === pedidoIris);
  lista.forEach((nivel, i) => {
    const iris = crearIris(m);
    iris.fijarEstado({ nivel, averiada: false });
    iris.raiz.position.x = (i - (lista.length - 1) / 2) * 1.3;
    iris.raiz.rotation.y = -0.6;
    escena.add(iris.raiz);
    animables.push({ animar: iris.animar, velocidad: 0 });
  });
  if (pedidoIris === "fila") camara.position.set(0, 2.2, 5.2);
  else camara.position.set(0.4, 1.0, 2.2);
  camara.lookAt(0, 0.35, 0);
} else {
  const lista = pedidoNino === "fila" ? GESTOS : GESTOS.filter((g) => g === pedidoNino);
  const exp = (["neutral", "happy", "curious", "concerned"] as const).find((e) => e === parametros.get("exp")) ?? "happy";
  const giro = { frente: 0, lado: Math.PI / 2, espalda: Math.PI }[parametros.get("vista") ?? "frente"] ?? 0;
  lista.forEach((g, i) => {
    const nino = crearAstronauta(m);
    nino.fijarGesto(g);
    nino.fijarExpresion(exp as ExpresionAstronauta);
    nino.raiz.position.x = (i - (lista.length - 1) / 2) * 0.75;
    nino.raiz.rotation.y = giro || (g === "walk" ? 0.9 : 0.25);
    escena.add(nino.raiz);
    animables.push({ animar: nino.animar, velocidad: 0 });
  });
  if (pedidoNino === "fila") camara.position.set(0, 1.4, 5.6);
  else camara.position.set(0, 0.75, 2.6);
  camara.lookAt(0, 0.5, 0);
}

function medir() {
  renderer.setSize(innerWidth, innerHeight, false);
  camara.aspect = innerWidth / innerHeight;
  camara.updateProjectionMatrix();
}
medir();
addEventListener("resize", medir);

let antes = performance.now();
function cuadro(ahora: number) {
  const dt = Math.min(0.05, Math.max(0, (ahora - antes) / 1000));
  antes = ahora;
  for (const a of animables) a.animar(dt, { velocidad: a.velocidad, movimientoReducido: reducido });
  renderer.render(escena, camara);
  (window as unknown as { __presupuesto: unknown }).__presupuesto = {
    calls: renderer.info.render.calls,
    triangles: renderer.info.render.triangles,
    geometries: renderer.info.memory.geometries,
    textures: renderer.info.memory.textures,
  };
  requestAnimationFrame(cuadro);
}
requestAnimationFrame(cuadro);
