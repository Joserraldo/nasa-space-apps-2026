/**
 * Vista previa SOLO para desarrollo (`/personajes.html` con `npm run dev -w ui`): muestra los
 * personajes 3D sueltos para compararlos con su lámina. No entra en el build (Vite solo empaqueta
 * `index.html`). Parámetros: `?iris=fila` (los 4 niveles de izquierda a derecha: tutorial, pistas,
 * danada, offline) o `?iris=<nivel>` (uno de cerca, en tres cuartos como `mundo/01`).
 * Expone `window.__presupuesto` con `renderer.info` leído después de `render()`.
 */
import * as THREE from "three";
import type { BaseAiLevel } from "@solar-shield/contracts";
import { colorToken, crearMateriales } from "../materiales";
import { prefiereMenosMovimiento } from "../soporte";
import { crearIris, type ModeloIris } from "./iris";

const NIVELES: readonly BaseAiLevel[] = ["tutorial", "pistas", "danada", "offline"];
const parametros = new URLSearchParams(location.search);
const pedido = parametros.get("iris") ?? "fila";

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
const modelos: ModeloIris[] = [];
const lista = pedido === "fila" ? NIVELES : NIVELES.filter((n) => n === pedido);
lista.forEach((nivel, i) => {
  const iris = crearIris(m);
  iris.fijarEstado({ nivel, averiada: false });
  iris.raiz.position.x = (i - (lista.length - 1) / 2) * 1.3;
  iris.raiz.rotation.y = -0.6;
  escena.add(iris.raiz);
  modelos.push(iris);
});

const camara = new THREE.PerspectiveCamera(pedido === "fila" ? 35 : 30, 1, 0.1, 100);
if (pedido === "fila") camara.position.set(0, 2.2, 5.2);
else camara.position.set(0.4, 1.0, 2.2);
camara.lookAt(0, 0.35, 0);

function medir() {
  renderer.setSize(innerWidth, innerHeight, false);
  camara.aspect = innerWidth / innerHeight;
  camara.updateProjectionMatrix();
}
medir();
addEventListener("resize", medir);

const reducido = prefiereMenosMovimiento();
let antes = performance.now();
function cuadro(ahora: number) {
  const dt = Math.min(0.05, Math.max(0, (ahora - antes) / 1000));
  antes = ahora;
  for (const iris of modelos) iris.animar(dt, { velocidad: 0, movimientoReducido: reducido });
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
