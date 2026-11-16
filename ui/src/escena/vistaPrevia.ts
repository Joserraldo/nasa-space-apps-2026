/**
 * Vista previa SOLO para desarrollo (`/escena.html` con `npm run dev -w ui`): monta la escena 3D a
 * pantalla completa con una `VistaEscena` de ejemplo, sin pasar por la app. No entra en el build
 * (Vite solo empaqueta `index.html`). Parámetros: `?camara=primera`, `?calidad=baja|media|alta`,
 * `?modulos=todos` (los cinco módulos funcionando, para revisar formas y presupuesto),
 * `?medir=1` (recuadro con fps, draw calls, triángulos, calidad y lienzo, para medir en un
 * celular o PC real), `?destino=<LugarId>` (camina hasta ese lugar con la ruta planeada),
 * `?reducido=1` (fuerza movimiento reducido), `?montar=0` (página vacía, para que una prueba monte
 * y desmonte la escena por su cuenta) e `?idioma=es|en` (inglés por defecto).
 * Se camina con `WASD`/flechas, `V` cambia de cámara, arrastrar gira y la rueda acerca.
 */
import type { CalidadGrafica } from "../juego/ajustes";
import { COLORES, conAlfa } from "../estilos/tokens";
import { traducir, type Idioma, type Vars } from "../i18n";
import * as THREE from "three";
import { crearCorredorInterior, zonaCorredor } from "./activos/interiores/corredor";
import { crearHabitatInterior } from "./activos/interiores/habitat";
import { crearTaller } from "./activos/interiores/taller";
import { fusionar } from "./activos/fusionar";
import { crearEscena3D } from "./escena3d";
import { colorToken, crearMateriales } from "./materiales";
import { LUGARES, type LugarId } from "./mundo";
import { prefiereMenosMovimiento } from "./soporte";
import type { VistaEscena } from "./vista";

const VISTA_EJEMPLO: VistaEscena = {
  fase: "base",
  modulos: {
    panel_solar: "funcionando",
    antena: "instalando",
    bateria: "ausente",
    reciclador_agua: "ausente",
    escudo: "ausente",
    invernadero: "ausente",
    ia_base: "funcionando",
  },
  iris: { nivel: "pistas", averiada: false },
  tormenta: { anunciada: false, activa: false },
  lugarObjetivo: "panel_solar",
  resultado: "en_curso",
};

const parametros = new URLSearchParams(location.search);
// `?fase=tormenta|final` (D3): ver la luz de la tarde o del atardecer.
const fasePedida = parametros.get("fase");
if (fasePedida === "tormenta" || fasePedida === "final") VISTA_EJEMPLO.fase = fasePedida;
if (parametros.get("modulos") === "todos") {
  for (const id of ["panel_solar", "antena", "reciclador_agua", "escudo", "invernadero"] as const) VISTA_EJEMPLO.modulos[id] = "funcionando";
}
const calidad = (["alta", "media", "baja"] as const).find((c) => c === parametros.get("calidad")) ?? "alta";
const idioma: Idioma = parametros.get("idioma") === "es" ? "es" : "en";
const t = (clave: string, vars?: Vars) => traducir(idioma, clave, vars);
function montar(): void {
  const canvas = document.getElementById("escena") as HTMLCanvasElement;
  let camara: "tercera" | "primera" = parametros.get("camara") === "primera" ? "primera" : "tercera";
  const escena = crearEscena3D(canvas, {
    medir: parametros.get("medir") === "1",
    calidad,
    movimientoReducido: parametros.get("reducido") === "1" || prefiereMenosMovimiento(),
    alExceso: (nivel: CalidadGrafica) => console.warn("[vista previa] la escena propone calidad", nivel),
    alPerderContexto: () => console.warn("[vista previa] contexto WebGL perdido"),
    alCambiarCamara: () => {
      camara = camara === "primera" ? "tercera" : "primera";
      escena.fijarCamara(camara);
    },
    alLugarCercano: (l) => console.info("[vista previa] lugar cercano", l),
    alUsar: (l) => console.info("[vista previa] usar", l),
    alDestino: (tipo, l) => console.info("[vista previa] destino", tipo, l),
  });
  escena.actualizar(VISTA_EJEMPLO, []);
  escena.fijarCamara(camara);
  const destino = LUGARES.find((l) => l.id === parametros.get("destino"))?.id as LugarId | undefined;
  if (destino) escena.fijarDestino(destino);
  const medir = () => escena.redimensionar(innerWidth, innerHeight);
  medir();
  addEventListener("resize", medir);
  void escena.listo.then(() => console.info("[vista previa] presupuesto (cota alta)", escena.contar()));

  // Modo `?medir=1`: recuadro con fps (ventana de 5 s), draw calls, triángulos, calidad y lienzo.
  if (parametros.get("medir") === "1") {
    const recuadro = document.createElement("div");
    recuadro.setAttribute("role", "status");
    recuadro.style.cssText = [
      "position:fixed",
      "top:8px",
      "left:8px",
      "z-index:10",
      "padding:8px 10px",
      "border-radius:8px",
      "font:12px/1.5 monospace",
      `background:${conAlfa("espacio", 0.85)}`,
      `color:${COLORES.marfil}`,
      "pointer-events:none",
    ].join(";");
    document.body.appendChild(recuadro);

    const filas = (): string => {
      const cuenta = escena.medicion();
      const promedio = cuenta?.fpsPromedio == null ? "—" : String(Math.round(cuenta.fpsPromedio));
      const minimo = cuenta?.fpsMinimo == null ? "—" : String(Math.round(cuenta.fpsMinimo));
      const lienzo = `${canvas.width}×${canvas.height}`;
      return [
        `${t("ui.medir.fps_prom")}: ${promedio}`,
        `${t("ui.medir.fps_min")}: ${minimo}`,
        `${t("ui.medir.draw_calls")}: ${cuenta?.drawCalls ?? 0}`,
        `${t("ui.medir.triangulos")}: ${cuenta?.triangulos ?? 0}`,
        `${t("ui.medir.calidad")}: ${t(`ui.medir.calidad.${cuenta?.calidad ?? calidad}`)}`,
        `${t("ui.medir.lienzo")}: ${lienzo}`,
      ].join("<br>");
    };
    const refrescar = () => {
      recuadro.innerHTML = filas();
    };
    void escena.listo.then(refrescar);
    setInterval(refrescar, 1000);
  }
}

/** Cómo se ve cada sala en la vista previa: qué se arma, dónde va la cámara y la luz cálida. */
const SALAS_PREVIA = {
  // Corredor desde la entrada, a la altura de los ojos del niño, mirando al fondo como `exterior/01`.
  corredor: () => {
    const zona = zonaCorredor();
    return {
      raiz: crearCorredorInterior(crearMateriales()),
      camara: [zona.entrada.x, 1.35, zona.entrada.z + 0.6] as const,
      mira: [0, 1.2, 0] as const,
      luz: [0.5, 3, zona.entrada.z] as const,
    };
  },
  // Taller en corte, como la lámina `estaciones/05`: desde el frente abierto, arriba y a la izquierda.
  taller: () => ({ raiz: crearTaller(crearMateriales()), camara: [-2.5, 5.2, 7.5] as const, mira: [0.4, 0.8, -0.6] as const, luz: [-2, 6, 4] as const }),
  // Hábitat en corte, como las láminas `estaciones/06` y `07`.
  habitat: () => ({ raiz: crearHabitatInterior(crearMateriales()), camara: [-2.5, 5.4, 8] as const, mira: [0.3, 0.8, -0.5] as const, luz: [-2, 6, 4] as const }),
} as const;

/**
 * `?sala=corredor|taller|habitat` (D5): una sala sola, en su propia vista, con la cámara de `SALAS_PREVIA`. Luz
 * provisional de interior (la definitiva va con A8). Con `?medir=1` muestra fps, draw calls y triángulos.
 */
function montarSala(sala: keyof typeof SALAS_PREVIA): void {
  const canvas = document.getElementById("escena") as HTMLCanvasElement;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: calidad !== "baja" });
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, calidad === "alta" ? 1.5 : 1));
  const escena = new THREE.Scene();
  escena.background = colorToken("lila");
  const cfg = SALAS_PREVIA[sala]();
  escena.add(fusionar(cfg.raiz, `Sala_${sala}`), new THREE.HemisphereLight(colorToken("marfil"), colorToken("lila"), 2.4));
  const luz = new THREE.DirectionalLight(colorToken("aviso-fondo"), 1.2);
  luz.position.set(cfg.luz[0], cfg.luz[1], cfg.luz[2]);
  luz.target.position.set(0, 0, 0);
  escena.add(luz, luz.target);
  const camara = new THREE.PerspectiveCamera(sala === "corredor" ? 62 : 45, 1, 0.1, 60);
  camara.position.set(cfg.camara[0], cfg.camara[1], cfg.camara[2]);
  camara.lookAt(cfg.mira[0], cfg.mira[1], cfg.mira[2]);
  const ajustar = () => {
    renderer.setSize(innerWidth, innerHeight, false);
    camara.aspect = innerWidth / innerHeight;
    camara.updateProjectionMatrix();
  };
  ajustar();
  addEventListener("resize", ajustar);
  const tiempos: number[] = [];
  let recuadro: HTMLDivElement | null = null;
  if (parametros.get("medir") === "1") {
    recuadro = document.createElement("div");
    recuadro.setAttribute("role", "status");
    recuadro.style.cssText = `position:fixed;top:8px;left:8px;padding:8px 10px;border-radius:8px;font:12px/1.5 monospace;background:${conAlfa("espacio", 0.85)};color:${COLORES.marfil}`;
    document.body.appendChild(recuadro);
  }
  const cuadro = (ahora: number) => {
    renderer.render(escena, camara);
    tiempos.push(ahora);
    while (tiempos.length && ahora - tiempos[0]! > 5000) tiempos.shift();
    if (recuadro && tiempos.length > 1) {
      const fps = ((tiempos.length - 1) * 1000) / (ahora - tiempos[0]!);
      recuadro.innerHTML = [
        `${t("ui.medir.fps_prom")}: ${Math.round(fps)}`,
        `${t("ui.medir.draw_calls")}: ${renderer.info.render.calls}`,
        `${t("ui.medir.triangulos")}: ${renderer.info.render.triangles}`,
      ].join("<br>");
    }
    requestAnimationFrame(cuadro);
  };
  requestAnimationFrame(cuadro);
}

const salaPedida = parametros.get("sala");
if (salaPedida === "corredor" || salaPedida === "taller" || salaPedida === "habitat") montarSala(salaPedida);
else if (parametros.get("montar") !== "0") montar();
