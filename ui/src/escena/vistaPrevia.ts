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
import { crearEscena3D } from "./escena3d";
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

if (parametros.get("montar") !== "0") montar();
