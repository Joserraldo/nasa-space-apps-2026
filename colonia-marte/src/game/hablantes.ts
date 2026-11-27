/** Quién habla: la tripulación aprobada (DV-02), Iris y Control de Misión. */
import { CREW_SPEAKERS } from "../ui/organisms/crew-dialogue.samples";
import type { CrewSpeaker } from "../ui/organisms/crew-dialogue";
import { traducir, type Idioma } from "./i18n";

const FIJOS = {
  tess: CREW_SPEAKERS.tess,
  nia: CREW_SPEAKERS.nia,
  vera: CREW_SPEAKERS.vera,
  teo: CREW_SPEAKERS.teo,
  iris: { id: "iris", name: "Iris", role: "", portrait: "/ui/portraits/iris.png", accent: "#75CEBA" },
  control: { id: "control", name: "", role: "", portrait: "/ui/portraits/control.png", accent: "#6F8BC7" },
} satisfies Record<string, CrewSpeaker>;

export type HablanteId = keyof typeof FIJOS;
export const HABLANTES = Object.keys(FIJOS) as HablanteId[];

export function hablante(id: HablanteId, idioma: Idioma): CrewSpeaker {
  const base = FIJOS[id];
  const nombre = id === "control" ? traducir(idioma, "juego.nombre.control") : base.name;
  return { ...base, name: nombre, role: traducir(idioma, `juego.rol.${id}`) };
}
