import * as THREE from "three";
import { animar, GESTOS, type Gesto } from "./animaciones.js";
import { EXPRESIONES, type Expresion } from "./cabeza.js";
import { FICHAS, type IdPersonaje } from "./fichas.js";
import { crearPersonaje, type Personaje } from "./personaje.js";
import { crearPersonajeB, type PersonajeB } from "./personajeB.js";

/**
 * Hoja A/B de revisión (herramienta de desarrollo, no forma parte del juego).
 *   /personajes-ab.html?p=doctora                    -> A arriba, B abajo: frente, perfil, espalda, tres cuartos
 *   &encuadre=cabeza | cuerpo
 *   &acabado=color | gris | malla   (malla = gris con las aristas de la malla encima, en pose de reposo)
 *   &casco=1                        -> muestra el casco
 *   &modo=caras | gestos            -> ocho expresiones o diez gestos de B (&variante=a para A)
 * Misma cámara, misma escala y misma luz para las dos filas.
 */

const q = new URLSearchParams(location.search);
const id = (q.get("p") ?? "doctora") as IdPersonaje;
const modo = q.get("modo") ?? "giro";
const acabado = q.get("acabado") ?? "color";
const encuadre = q.get("encuadre") === "cabeza" ? "cabeza" : "cuerpo";
const conCasco = q.get("casco") === "1";
const varianteSuelta = q.get("variante") === "a" ? "A" : "B";

interface Celda {
  variante: "A" | "B";
  giro: number;
  encuadre: "cuerpo" | "cabeza";
  expresion?: Expresion;
  gesto?: Gesto;
  titulo: string;
}

const T_GESTO: Record<Gesto, number> = {
  reposo: 0.4,
  caminar: 0.26,
  saludar: 0.2,
  hablar: 0.3,
  escuchar: 0.9,
  explicar: 0.5,
  inspeccionar: 0.5,
  arrodillarse: 0.3,
  confirmar: 0.4,
  tranquilizar: 0.4,
  reparar: 0.3,
  observar: 0.4,
  alertar: 0.3,
  verificar: 0.5,
};

const celdas: Celda[] = [];
let columnas = 4;
if (modo === "caras") {
  for (const e of EXPRESIONES) celdas.push({ variante: varianteSuelta, giro: -0.4, encuadre: "cabeza", expresion: e, titulo: e });
} else if (modo === "gestos") {
  columnas = 7;
  for (const g of GESTOS) celdas.push({ variante: varianteSuelta, giro: g === "caminar" || g === "arrodillarse" ? 1.1 : 0.4, encuadre: "cuerpo", gesto: g, titulo: g });
} else {
  const vistas: Array<[string, number]> = [
    ["Front", 0],
    ["Side", Math.PI / 2],
    ["Back", Math.PI],
    ["Three-quarter", -Math.PI / 4],
  ];
  for (const variante of ["A", "B"] as const) {
    for (const [nombre, giro] of vistas) celdas.push({ variante, giro, encuadre, titulo: `${variante === "A" ? "A · Current" : "B · Proposal"} — ${nombre}` });
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

const modelos: Personaje[] = celdas.map((c) => {
  const pj = c.variante === "A" ? crearPersonaje(id) : crearPersonajeB(id);
  pj.grupo.rotation.y = c.giro;
  pj.grupo.visible = false;
  const casco = pj.grupo.getObjectByName("casco");
  if (casco && !conCasco && modo === "giro") casco.visible = false;
  if (acabado === "gris" || acabado === "malla") {
    pj.rostro.grupo.visible = false;
    const cuerpo = pj.grupo.getObjectByName("cuerpo") as THREE.SkinnedMesh;
    // A no trae normales suaves: se ve con sus facetas. B trae las suyas (piel suave, traje facetado).
    cuerpo.material = c.variante === "A" ? grisFaceta : gris;
    if (acabado === "malla") {
      const aristas = cuerpo.geometry.userData.aristas as Float32Array | undefined;
      if (aristas) {
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.BufferAttribute(aristas, 3));
        cuerpo.parent!.add(new THREE.LineSegments(g, lineas));
      } else {
        cuerpo.parent!.add(new THREE.Mesh(cuerpo.geometry, alambre));
      }
    }
  }
  escena.add(pj.grupo);
  return pj;
});

const camara = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 50);
const ficha = FICHAS[id];

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
    const pj = modelos[i]!;
    // En malla no se anima: las aristas están en pose de reposo.
    if (acabado !== "malla") {
      animar(pj, c.gesto ?? "reposo", T_GESTO[c.gesto ?? "reposo"], { quieto: !c.gesto, expresion: c.expresion });
      if (c.expresion) pj.expresion(c.expresion);
    }
    const casco = ficha.proporciones.casco;
    const alto = c.encuadre === "cabeza" ? casco.ry * 3.3 * ficha.altura : ficha.altura * 1.16;
    const centroY = c.encuadre === "cabeza" ? (casco.y - 0.02) * ficha.altura : ficha.altura * 0.5;
    const ancho = (alto * cw) / ch;
    camara.left = -ancho / 2;
    camara.right = ancho / 2;
    camara.top = alto / 2;
    camara.bottom = -alto / 2;
    camara.position.set(0, centroY + (c.encuadre === "cabeza" ? 0.5 : 0.25), 10);
    camara.lookAt(0, centroY, 0);
    camara.updateProjectionMatrix();
    const col = i % columnas;
    const fila = Math.floor(i / columnas);
    renderer.setViewport(col * cw, h - (fila + 1) * ch, cw, ch);
    renderer.setScissor(col * cw, h - (fila + 1) * ch, cw, ch);
    pj.grupo.visible = true;
    renderer.render(escena, camara);
    pj.grupo.visible = false;
    medidas[c.variante] = { llamadas: renderer.info.render.calls, triangulos: renderer.info.render.triangles };
  });
  const b = modelos.find((_, i) => celdas[i]!.variante === "B") as PersonajeB | undefined;
  const ventana = window as unknown as { __listo: boolean; __info: unknown };
  ventana.__info = { medidas, cascoVisible: conCasco || modo !== "giro", topologia: b?.topologia };
  ventana.__listo = true;
}

dibujar();
window.addEventListener("resize", dibujar);
