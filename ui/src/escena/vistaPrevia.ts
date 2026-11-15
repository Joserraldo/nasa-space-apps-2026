/**
 * Vista previa SOLO para desarrollo (`/escena.html` con `npm run dev -w ui`): monta la escena 3D a
 * pantalla completa con una `VistaEscena` de ejemplo, sin pasar por la app. No entra en el build
 * (Vite solo empaqueta `index.html`). Parámetros: `?camara=primera`, `?calidad=baja|media|alta`,
 * `?modulos=todos` (los cinco módulos funcionando, para revisar formas y presupuesto),
 * `?medir=1` (recuadro con fps, draw calls, triángulos, calidad y lienzo, para medir en un
 * celular o PC real) e `?idioma=es|en` (inglés por defecto).
 */
import type { CalidadGrafica } from "../juego/ajustes";
import { COLORES, conAlfa } from "../estilos/tokens";
import { traducir, type Idioma, type Vars } from "../i18n";
import { crearEscena3D } from "./escena3d";
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
if (parametros.get("modulos") === "todos") {
  for (const id of ["panel_solar", "antena", "reciclador_agua", "escudo", "invernadero"] as const) VISTA_EJEMPLO.modulos[id] = "funcionando";
}
const calidad = (["alta", "media", "baja"] as const).find((c) => c === parametros.get("calidad")) ?? "alta";
const idioma: Idioma = parametros.get("idioma") === "es" ? "es" : "en";
const t = (clave: string, vars?: Vars) => traducir(idioma, clave, vars);
const canvas = document.getElementById("escena") as HTMLCanvasElement;
const escena = crearEscena3D(canvas, {
  calidad,
  movimientoReducido: prefiereMenosMovimiento(),
  alExceso: (nivel: CalidadGrafica) => console.warn("[vista previa] la escena propone calidad", nivel),
  alPerderContexto: () => console.warn("[vista previa] contexto WebGL perdido"),
});
escena.actualizar(VISTA_EJEMPLO, []);
let camara: "tercera" | "primera" = parametros.get("camara") === "primera" ? "primera" : "tercera";
escena.fijarCamara(camara);
const medir = () => escena.redimensionar(innerWidth, innerHeight);
medir();
addEventListener("resize", medir);
addEventListener("keydown", (e) => {
  if (e.key !== "v" && e.key !== "V") return;
  camara = camara === "primera" ? "tercera" : "primera";
  escena.fijarCamara(camara);
});
void escena.listo.then(() => console.info("[vista previa] presupuesto (cota alta)", escena.contar()));

// Modo `?medir=1`: recuadro con fps (ventana de 5 s), draw calls, triángulos, calidad y lienzo.
if (parametros.get("medir") === "1") {
  const VENTANA_MS = 5000;
  const marcas: number[] = [];
  const fotogramaMedido = (ahora: number) => {
    marcas.push(ahora);
    while (marcas.length > 0 && ahora - marcas[0] > VENTANA_MS) marcas.shift();
    requestAnimationFrame(fotogramaMedido);
  };
  requestAnimationFrame(fotogramaMedido);

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
    let promedio = "—";
    let minimo = "—";
    if (marcas.length > 1) {
      const duracion = marcas[marcas.length - 1] - marcas[0];
      promedio = String(Math.round(((marcas.length - 1) * 1000) / duracion));
      let mayorHueco = 0;
      for (let i = 1; i < marcas.length; i++) mayorHueco = Math.max(mayorHueco, marcas[i] - marcas[i - 1]);
      minimo = String(Math.round(1000 / mayorHueco));
    }
    const cuenta = escena.contar();
    const lienzo = `${canvas.width}×${canvas.height}`;
    return [
      `${t("ui.medir.fps_prom")}: ${promedio}`,
      `${t("ui.medir.fps_min")}: ${minimo}`,
      `${t("ui.medir.draw_calls")}: ${cuenta.drawCalls} ${t("ui.medir.cota")}`,
      `${t("ui.medir.triangulos")}: ${cuenta.triangulos} ${t("ui.medir.cota")}`,
      `${t("ui.medir.calidad")}: ${t(`ui.medir.calidad.${calidad}`)}`,
      `${t("ui.medir.lienzo")}: ${lienzo}`,
    ].join("<br>");
  };
  const refrescar = () => {
    recuadro.innerHTML = filas();
  };
  void escena.listo.then(refrescar);
  setInterval(refrescar, 1000);
}
