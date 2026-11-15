import * as THREE from "three";
import { animar, GESTOS, type Gesto } from "./animaciones.js";
import { EXPRESIONES, type Expresion } from "./cabeza.js";
import { FICHAS, type IdPersonaje } from "./fichas.js";
import { CARAS_IRIS, crearIris as crearIrisA, type CaraIris, type Iris } from "./iris.js";
import { crearIrisB } from "./irisB.js";
import { crearPersonaje as crearPersonajeA, type Personaje } from "./personaje.js";
import { crearPersonajeB } from "./personajeB.js";

/**
 * Hoja de revisión de la tripulación (herramienta de desarrollo, no forma parte del juego).
 *   /personajes.html                          -> los cuatro tripulantes e Iris, frente / lado / espalda
 *   /personajes.html?p=ingeniera              -> giro de uno (ingeniera, doctora, meteorologa, nino, iris)
 *   /personajes.html?p=ingeniera&modo=caras   -> las ocho expresiones
 *   /personajes.html?p=ingeniera&modo=gestos  -> los diez gestos
 *   &vivo=1 anima en bucle; &t=1.2 fija el instante (capturas).
 */

interface Celda {
  id: IdPersonaje | "iris";
  giro: number;
  expresion?: Expresion;
  gesto?: Gesto;
  cara?: CaraIris;
  averiada?: boolean;
  velocidad?: number;
  t?: number;
  encuadre: "cuerpo" | "cabeza";
}

const q = new URLSearchParams(location.search);
const ids = Object.keys(FICHAS) as IdPersonaje[];
const elegido = q.get("p") as IdPersonaje | "iris" | null;
const modo = q.get("modo") ?? "giro";
const vivo = q.get("vivo") === "1";
const tFijo = q.has("t") ? Number(q.get("t")) : null;

/** Instante representativo de cada gesto para la hoja fija. */
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
  observar: 0.5,
  alertar: 0.3,
  verificar: 0.5,
};

let columnas = 3;
const celdas: Celda[] = [];
const GIROS = [0, Math.PI / 2, Math.PI];
if (elegido === "iris") {
  columnas = 4;
  for (const giro of [0.6, 0, Math.PI / 2, Math.PI + 0.6]) celdas.push({ id: "iris", giro, encuadre: "cuerpo" });
  for (const cara of ["feliz", "pensando", "parpadeo"] as const) celdas.push({ id: "iris", giro: 0.45, cara, encuadre: "cuerpo" });
  celdas.push({ id: "iris", giro: 0.45, averiada: true, encuadre: "cuerpo" });
} else if (elegido && modo === "caras") {
  columnas = 4;
  for (const e of EXPRESIONES) celdas.push({ id: elegido, giro: -0.45, expresion: e, encuadre: "cabeza" });
} else if (elegido && modo === "gestos") {
  columnas = 5;
  for (const gesto of GESTOS) celdas.push({ id: elegido, giro: gesto === "caminar" || gesto === "arrodillarse" ? 1.1 : 0.4, gesto, encuadre: "cuerpo" });
} else if (elegido) {
  for (const g of GIROS) celdas.push({ id: elegido, giro: g, encuadre: "cuerpo" });
} else {
  for (const id of [...ids, "iris" as const]) for (const g of GIROS) celdas.push({ id, giro: g, encuadre: "cuerpo" });
}
const filas = Math.ceil(celdas.length / columnas);

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

const usarA = q.get("variante") === "a";
type Modelo = { tipo: "pj"; pj: Personaje } | { tipo: "iris"; iris: Iris };
const modelos: Modelo[] = celdas.map((c) => {
  const modelo: Modelo =
    c.id === "iris"
      ? { tipo: "iris", iris: usarA ? crearIrisA() : crearIrisB() }
      : { tipo: "pj", pj: usarA ? crearPersonajeA(c.id) : crearPersonajeB(c.id) };
  const grupo = modelo.tipo === "iris" ? modelo.iris.grupo : modelo.pj.grupo;
  grupo.rotation.y = c.giro;
  grupo.visible = false;
  escena.add(grupo);
  return modelo;
});

const camara = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 50);

function dibujar(reloj: number): void {
  const w = lienzo.clientWidth;
  const h = lienzo.clientHeight;
  renderer.setSize(w, h, false);
  renderer.setScissorTest(false);
  renderer.clear();
  renderer.setScissorTest(true);
  const cw = w / columnas;
  const ch = h / filas;
  let llamadas = 0;
  let triangulos = 0;
  celdas.forEach((c, i) => {
    const modelo = modelos[i]!;
    const col = i % columnas;
    const fila = Math.floor(i / columnas);
    let alto: number;
    let centroY: number;
    let grupo: THREE.Group;
    if (modelo.tipo === "iris") {
      const t = vivo ? reloj : (tFijo ?? 0.5);
      modelo.iris.animar(t, { averiada: c.averiada, cara: c.cara, velocidad: c.velocidad ?? (vivo ? 0.8 : 0), quieto: !vivo && tFijo === null });
      grupo = modelo.iris.grupo;
      alto = 1.25;
      centroY = 0.38;
    } else {
      const f = FICHAS[modelo.pj.id];
      const casco = f.proporciones.casco;
      const fijo = !vivo && tFijo === null;
      const t = vivo ? reloj : (tFijo ?? T_GESTO[c.gesto ?? "reposo"]);
      animar(modelo.pj, c.gesto ?? "reposo", t, { quieto: fijo && !c.gesto, expresion: c.expresion });
      if (fijo && c.expresion) modelo.pj.expresion(c.expresion);
      grupo = modelo.pj.grupo;
      alto = c.encuadre === "cabeza" ? casco.ry * 2.5 * f.altura : f.altura * 1.22;
      centroY = c.encuadre === "cabeza" ? (casco.y - 0.03) * f.altura : f.altura * 0.5;
    }
    const ancho = (alto * cw) / ch;
    camara.left = -ancho / 2;
    camara.right = ancho / 2;
    camara.top = alto / 2;
    camara.bottom = -alto / 2;
    camara.position.set(0, centroY + (c.encuadre === "cabeza" ? 0.5 : 0.25) * (modelo.tipo === "iris" ? 6 : 1), 10);
    camara.lookAt(0, centroY, 0);
    camara.updateProjectionMatrix();
    renderer.setViewport(col * cw, h - (fila + 1) * ch, cw, ch);
    renderer.setScissor(col * cw, h - (fila + 1) * ch, cw, ch);
    grupo.visible = true;
    renderer.render(escena, camara);
    grupo.visible = false;
    if (i === celdas.length - 1) {
      llamadas = renderer.info.render.calls;
      triangulos = renderer.info.render.triangles;
    }
  });
  const ventana = window as unknown as { __listo: boolean; __info: unknown };
  ventana.__info = { llamadas, triangulos };
  ventana.__listo = true;
}

if (vivo) {
  const inicio = performance.now();
  const ciclo = () => {
    dibujar((performance.now() - inicio) / 1000);
    requestAnimationFrame(ciclo);
  };
  ciclo();
} else {
  dibujar(0);
  window.addEventListener("resize", () => dibujar(0));
}
