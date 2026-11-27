import type { GameHudState } from "../organisms/game-hud";
import type { PauseMenuState } from "../organisms/pause-menu";
import type { CrewDialogueState } from "../organisms/crew-dialogue";

export const CANTEEN_HUD_ES: GameHudState = {
  zone: { name: "Comedor", deck: "Cubierta 1", glyph: "canteen", voiceLine: "Estás en el comedor." },
  objective: { title: "Prepara el almuerzo", step: "Paso 1 de 3", voiceLine: "Tu meta: prepara el almuerzo." },
  status: {
    name: "Iris", role: "Compañera", ringLevel: .72,
    resources: [
      { glyph: "battery", label: "Energía", level: .75, tone: "Accent" },
      { glyph: "air", label: "Aire", level: .9, tone: "Accent" },
      { glyph: "shield", label: "Escudo", level: .5, tone: "Ink" },
    ],
  },
  minimap: { label: "Cubierta 1", heading: -18 },
  interaction: { target: "Máquina de ensaladas", action: "Toca para usar", voiceLine: "Toca la máquina para servirte." },
};

export const PAUSE_STATE_ES: PauseMenuState = {
  items: [
    { id: "resume", label: "Seguir jugando", glyph: "play", voiceLine: "Seguir jugando." },
    { id: "settings", label: "Ajustes", glyph: "gear", voiceLine: "Abrir ajustes." },
    { id: "map", label: "Mapa de la colonia", glyph: "home", voiceLine: "Volver al mapa de la colonia." },
  ],
  chapter: "Capítulo 1 · Llegada",
  objective: "Prepara el almuerzo",
  voiceLine: "El juego está en pausa.",
};

const samples = {
  medium: ["Ingeniera", "La máquina de ensaladas necesita energía. ¿Qué hacemos?", ["Ayudar a Tess", "Hacer sopa", "Pedir ayuda a Iris"]],
  short: ["Matemático", "¡Quedan cinco fusibles! Son suficientes.", ["Genial", "Contar otra vez"]],
  long: ["Experta solar", "En dos soles llega una llamarada solar. ¡La llamo Chispa! Habrá mucha radiación afuera. Busquemos refugio antes de que llegue.", ["Ir al refugio", "Medir la radiación primero", "Preguntar a Iris"]],
  labels: ["Doctora", "Tu traje tiene un rasguño. Deja que lo revise.", ["Sí, revisa mi traje", "Luego, después del almuerzo", "Ponle una curita a Iris"]],
  sentence: ["Matemático", "Si la cúpula pierde aire cada hora y quedan veinte horas de aire podemos esperar diecinueve horas sin peligro.", ["Entendido"]],
} satisfies Record<string, [string, string, string[]]>;

export function spanishDialogue(key: string, state: CrewDialogueState): CrewDialogueState {
  const [role, line, replies] = samples[key as keyof typeof samples] ?? samples.medium;
  return { ...state, speaker: { ...state.speaker, role }, line, voiceLine: line,
    replies: state.replies.map((reply, index) => ({ ...reply, label: replies[index], voiceLine: `${replies[index]}.` })) };
}
