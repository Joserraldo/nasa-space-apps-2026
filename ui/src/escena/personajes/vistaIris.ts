import * as THREE from "three";
import { CARAS_IRIS, crearIris, type CaraIris, type Iris } from "./iris.js";
import { crearIrisB, type IrisB } from "./irisB.js";

/**
 * Hoja A/B de Iris (herramienta de desarrollo, no forma parte del juego).
 *   /personajes-iris.html                 -> A arriba, B abajo: frente, perfil, espalda, tres cuartos
 *   ?acabado=color | malla
 *   ?modo=caras                           -> las seis caras de B
 *   ?modo=estados                         -> B: conducir (plegada), cargar (desplegada), averiada, desde arriba
 */

const q = new URLSearchParams(location.search);
const modo = q.get("modo") ?? "giro";
const acabado = q.get("acabado") ?? "color";

interface Celda {
  variante: "A" | "B";
  giro: number;
  titulo: string;
  cara?: CaraIris;
  paneles?: number;
  averiada?: boolean;
  picado?: number;
}

const celdas: Celda[] = [];
let columnas = 4;
if (modo === "caras") {
  columnas = 3;
  for (const c of CARAS_IRIS) celdas.push({ variante: "B", giro: -0.5, cara: c, titulo: c });
} else if (modo === "estados") {
  celdas.push(
    { variante: "B", giro: -0.6, paneles: 0, titulo: "Drive — panels folded" },
    { variante: "B", giro: -0.6, paneles: 1, cara: "feliz", titulo: "Charge — panels open" },
    { variante: "B", giro: -0.6, paneles: 1, averiada: true, titulo: "Damaged" },
    { variante: "B", giro: 0, paneles: 1, picado: 1.45, titulo: "Top — panels open" },
  );
} else {
  const vistas: Array<[string, number]> = [
    ["Front", 0],
    ["Side", Math.PI / 2],
    ["Back", Math.PI],
    ["Three-quarter", -Math.PI / 4],
  ];
  for (const variante of ["A", "B"] as const) {
    for (const [nombre, giro] of vistas) celdas.push({ variante, giro, titulo: `${variante === "A" ? "A · Current" : "B · Proposal"} — ${nombre}` });
  }
}
const filas = Math.ceil(celdas.length / columnas);

celdas.forEach((c, i) => {
  const titulo = document.createElement("div");
  titulo.textContent = c.titulo;
  titulo.style.cssText = `position:fixed;top:calc(${(Math.floor(i / columnas) * 100) / filas}% + 8px);left:calc(${((i % columnas) * 100) / columnas}% + 12px);font:600 13px system-ui;color:#554468;pointer-events:none`;
  document.body.append(titulo);
});

const lienzo = document.getElementById("lienzo") as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
renderer.setClearColor(0xf7ebe6);
renderer.autoClear = false;

const escena = new THREE.Scene();
escena.add(new THREE.HemisphereLight(0xfff8f3, 0xe2c6da, 1.9));
const sol = new THREE.DirectionalLight(0xfff4ea, 2.3);
sol.position.set(-2.2, 4, 5);
escena.add(sol);
const relleno = new THREE.DirectionalLight(0xe6d2ff, 0.5);
relleno.position.set(3, 1.5, -3);
escena.add(relleno);

const gris = new THREE.MeshStandardMaterial({ color: 0xb9b4bf, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
const grisFaceta = gris.clone();
grisFaceta.flatShading = true;
const alambre = new THREE.MeshBasicMaterial({ color: 0x3d2f52, wireframe: true });
const lineas = new THREE.LineBasicMaterial({ color: 0x3d2f52 });

const modelos: Iris[] = celdas.map((c) => {
  const iris = c.variante === "A" ? crearIris() : crearIrisB();
  if (c.variante === "B") (iris as IrisB).animar(0.5, { quieto: true, cara: c.cara, paneles: c.paneles ?? (modo === "giro" ? 0 : 1), averiada: c.averiada });
  else iris.animar(0.5, { quieto: true, cara: c.cara, averiada: c.averiada });
  iris.grupo.rotation.y = c.giro;
  iris.grupo.visible = false;
  if (acabado === "malla") {
    const cuerpo = iris.grupo.getObjectByName("iris-cuerpo") as THREE.SkinnedMesh;
    cuerpo.material = c.variante === "A" ? grisFaceta : gris;
    const aristas = cuerpo.geometry.userData.aristas as Float32Array | undefined;
    if (aristas) {
      // Las aristas están en pose de reposo (paneles desplegados): se dibuja el cuerpo también en reposo.
      for (const b of cuerpo.skeleton.bones) if (b.name !== "chasis") b.rotation.set(0, 0, 0);
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(aristas, 3));
      cuerpo.parent!.add(new THREE.LineSegments(g, lineas));
    } else {
      cuerpo.parent!.add(new THREE.Mesh(cuerpo.geometry, alambre));
    }
  }
  escena.add(iris.grupo);
  return iris;
});

const camara = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 50);

function dibujar(): void {
  const w = lienzo.clientWidth;
  const h = lienzo.clientHeight;
  renderer.setSize(w, h, false);
  renderer.setScissorTest(false);
  renderer.clear();
  renderer.setScissorTest(true);
  const cw = w / columnas;
  const ch = h / filas;
  const medidas: Record<string, { llamadas: number; triangulos: number }> = {};
  celdas.forEach((c, i) => {
    const iris = modelos[i]!;
    const alto = 1.25;
    const ancho = (alto * cw) / ch;
    camara.left = -ancho / 2;
    camara.right = ancho / 2;
    camara.top = alto / 2;
    camara.bottom = -alto / 2;
    const picado = c.picado ?? 0.32;
    camara.position.set(0, 0.36 + Math.sin(picado) * 10, Math.cos(picado) * 10);
    camara.lookAt(0, 0.36, 0);
    camara.updateProjectionMatrix();
    const col = i % columnas;
    const fila = Math.floor(i / columnas);
    renderer.setViewport(col * cw, h - (fila + 1) * ch, cw, ch);
    renderer.setScissor(col * cw, h - (fila + 1) * ch, cw, ch);
    iris.grupo.visible = true;
    renderer.render(escena, camara);
    iris.grupo.visible = false;
    medidas[c.variante] = { llamadas: renderer.info.render.calls, triangulos: renderer.info.render.triangles };
  });
  const b = modelos.find((_, i) => celdas[i]!.variante === "B") as IrisB | undefined;
  const ventana = window as unknown as { __listo: boolean; __info: unknown };
  ventana.__info = { medidas, topologia: b?.topologia };
  ventana.__listo = true;
}

dibujar();
window.addEventListener("resize", dibujar);
