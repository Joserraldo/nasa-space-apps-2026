/**
 * Adaptador del motor a la vista: funciones puras `(estado, idioma, ajustes) -> estado de vista`.
 * Aquí se aplican las reglas para niños: sin números en Easy (R2), de 1 a 3 respuestas (R6) y una
 * línea de voz en todo (R1). La vista no importa nada del motor.
 */
import type { GameHudState } from "../ui/organisms/game-hud";
import type { CrewDialogueState } from "../ui/organisms/crew-dialogue";
import type { PauseMenuState } from "../ui/organisms/pause-menu";
import type { UIHudResourceParams } from "../ui/molecules/hud-molecules";
import type { SettingsState } from "../ui/state/settings";
import { muestraNumeros } from "./dificultad";
import { hablante, type HablanteId } from "./hablantes";
import { traducir, type Idioma, type Vars } from "./i18n";
import type { BaseAiLevel, GameState, Mision, Resource } from "./motor";
import { SALAS, type SalaId } from "./salas";

/** Lo que el flujo del juego sabe y el motor no: capítulo, paso de la historia y sala. */
export interface EstadoJuego {
  capitulo: number;
  mision: Mision;
  partida: GameState;
  /** Número de paso de `mision.pasos` (1 a 8). */
  paso: number;
  sala: SalaId;
}

/** Un medidor en este nivel o menos se pinta como aviso (valor de juego, igual que en la vista). */
export const NIVEL_BAJO = 25;

const MEDIDORES: readonly { recurso: Resource; glyph: UIHudResourceParams["glyph"]; clave: string; tono: "Accent" | "Ink" }[] = [
  { recurso: "energia", glyph: "battery", clave: "juego.recurso.energia", tono: "Accent" },
  { recurso: "soporte_vital", glyph: "air", clave: "juego.recurso.aire", tono: "Accent" },
  { recurso: "blindaje", glyph: "shield", clave: "juego.recurso.escudo", tono: "Ink" },
];

/** El anillo de Iris se vacía a medida que ayuda menos. */
const ANILLO: Record<BaseAiLevel, number> = { tutorial: 1, pistas: 0.66, danada: 0.33, offline: 0 };

function pasoActual(juego: EstadoJuego) {
  const indice = Math.max(0, juego.mision.pasos.findIndex((p) => p.n === juego.paso));
  return { paso: juego.mision.pasos[indice]!, indice, total: juego.mision.pasos.length };
}

function textoPaso(juego: EstadoJuego, idioma: Idioma, ajustes: SettingsState): string {
  const { indice, total } = pasoActual(juego);
  if (muestraNumeros(ajustes)) return traducir(idioma, "juego.paso.numero", { n: indice + 1, total });
  const clave = indice === 0 ? "juego.paso.primero" : indice === total - 1 ? "juego.paso.ultimo" : "juego.paso.siguiente";
  return traducir(idioma, clave);
}

export function estadoHud(juego: EstadoJuego, idioma: Idioma, ajustes: SettingsState): GameHudState {
  const t = (clave: string, vars?: Vars) => traducir(idioma, clave, vars);
  const sala = SALAS[juego.sala];
  const titulo = t(pasoActual(juego).paso.tituloKey);
  const nombreSala = t(sala.nombre);
  const objeto = t(sala.objeto);
  return {
    zone: { name: nombreSala, deck: t(sala.area), glyph: sala.glyph, voiceLine: t("juego.voz.zona", { sala: nombreSala }) },
    objective: { title: titulo, step: textoPaso(juego, idioma, ajustes), voiceLine: t("juego.voz.objetivo", { objetivo: titulo }) },
    status: {
      name: "Iris",
      role: t("juego.rol.iris"),
      ringLevel: ANILLO[juego.partida.iaBase],
      resources: MEDIDORES.map(({ recurso, glyph, clave, tono }) => {
        const valor = juego.partida.recursos[recurso];
        const nombre = t(clave);
        return {
          glyph,
          label: muestraNumeros(ajustes) ? `${nombre} ${Math.round(valor)}` : nombre,
          level: Math.min(1, Math.max(0, valor / 100)),
          tone: valor <= NIVEL_BAJO ? "Warning" : tono,
        };
      }),
    },
    minimap: { label: t(sala.area), heading: sala.rumbo },
    interaction: { target: objeto, action: t("juego.usar"), voiceLine: t("juego.voz.usar", { objeto }) },
  };
}

export interface RespuestaGuion {
  id: string;
  /** Clave del texto. */
  texto: string;
  icono: CrewDialogueState["replies"][number]["glyph"];
}

export interface LineaGuion {
  hablante: HablanteId;
  /** Clave de la línea. */
  linea: string;
  respuestas: RespuestaGuion[];
}

export const MAX_RESPUESTAS = 3;

export function estadoDialogo(escena: LineaGuion, idioma: Idioma, vars?: Vars): CrewDialogueState {
  if (!escena.respuestas.length) throw new Error(`diálogo sin respuestas: ${escena.linea}`);
  const linea = traducir(idioma, escena.linea, vars);
  return {
    speaker: hablante(escena.hablante, idioma),
    line: linea,
    voiceLine: linea,
    replies: escena.respuestas.slice(0, MAX_RESPUESTAS).map((r) => {
      const texto = traducir(idioma, r.texto);
      return { id: r.id, label: texto, glyph: r.icono, voiceLine: texto };
    }),
  };
}

function nombreCapitulo(juego: EstadoJuego, idioma: Idioma): string {
  return traducir(idioma, "juego.capitulo.linea", { n: juego.capitulo, tituloKey: `juego.capitulo.c${juego.capitulo}` });
}

export function estadoPausa(juego: EstadoJuego, idioma: Idioma): PauseMenuState {
  const t = (clave: string) => traducir(idioma, clave);
  const opcion = (id: string, glyph: PauseMenuState["items"][number]["glyph"]) => ({
    id, glyph, label: t(`juego.pausa.${id}`), voiceLine: t(`juego.pausa.${id}.voz`),
  });
  return {
    items: [opcion("resume", "play"), opcion("settings", "gear"), opcion("menu", "home")],
    chapter: nombreCapitulo(juego, idioma),
    objective: t(pasoActual(juego).paso.tituloKey),
    voiceLine: t("juego.pausa.voz"),
  };
}

/** Contenido de la tarjeta de inicio o fin de capítulo. La vista de la tarjeta está en curso. */
export interface EstadoTarjeta {
  tipo: "inicio" | "exito" | "fallo";
  capitulo: string;
  texto: string;
  accion: { id: "empezar" | "seguir" | "repetir"; label: string; voiceLine: string };
  voiceLine: string;
}

export function estadoTarjeta(juego: EstadoJuego, idioma: Idioma): EstadoTarjeta {
  const resultado = juego.partida.resultado;
  const tipo = resultado === "en_curso" ? "inicio" : resultado;
  const id = tipo === "inicio" ? "empezar" : tipo === "exito" ? "seguir" : "repetir";
  const capitulo = nombreCapitulo(juego, idioma);
  const texto = traducir(idioma, `juego.capitulo.c${juego.capitulo}.${tipo}`);
  const label = traducir(idioma, `juego.accion.${id}`);
  return { tipo, capitulo, texto, accion: { id, label, voiceLine: label }, voiceLine: `${capitulo}. ${texto}` };
}
