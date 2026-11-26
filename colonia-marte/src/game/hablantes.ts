/** Quién habla: la tripulación aprobada (DV-02), Iris y Control de Misión. */
import { CREW_SPEAKERS } from "../ui/organisms/crew-dialogue.samples";
import type { CrewSpeaker } from "../ui/organisms/crew-dialogue";
import { traducir, type Idioma } from "./i18n";

/** Retrato provisional (un círculo con la inicial) hasta que lleguen los de Iris y Control (pedido B2). */
function provisional(inicial: string, color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><circle cx="256" cy="256" r="200" fill="none" stroke="${color}" stroke-width="24"/><text x="256" y="330" text-anchor="middle" font-family="sans-serif" font-size="220" fill="${color}">${inicial}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const FIJOS = {
  tess: CREW_SPEAKERS.tess,
  nia: CREW_SPEAKERS.nia,
  vera: CREW_SPEAKERS.vera,
  teo: CREW_SPEAKERS.teo,
  iris: { id: "iris", name: "Iris", role: "", portrait: provisional("I", "#75CEBA"), accent: "#75CEBA" },
  control: { id: "control", name: "", role: "", portrait: provisional("C", "#6F8BC7"), accent: "#6F8BC7" },
} satisfies Record<string, CrewSpeaker>;

export type HablanteId = keyof typeof FIJOS;
export const HABLANTES = Object.keys(FIJOS) as HablanteId[];

export function hablante(id: HablanteId, idioma: Idioma): CrewSpeaker {
  const base = FIJOS[id];
  const nombre = id === "control" ? traducir(idioma, "juego.nombre.control") : base.name;
  return { ...base, name: nombre, role: traducir(idioma, `juego.rol.${id}`) };
}
