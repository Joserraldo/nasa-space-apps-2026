/**
 * Vista previa SOLO para desarrollo (`/escena.html` con `npm run dev -w ui`): monta la escena 3D a
 * pantalla completa con una `VistaEscena` de ejemplo, sin pasar por la app. No entra en el build
 * (Vite solo empaqueta `index.html`). Parámetros: `?camara=primera`, `?calidad=baja|media|alta`.
 */
import type { CalidadGrafica } from "../juego/ajustes";
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
const calidad = (["alta", "media", "baja"] as const).find((c) => c === parametros.get("calidad")) ?? "alta";
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
