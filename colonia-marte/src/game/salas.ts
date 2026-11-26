/** Salas del juego y su punto de uso. Los textos son claves de data/story/i18n. */
import type { UIHudZoneParams } from "../ui/molecules/hud-molecules";
import type { EscenarioId } from "./intro";

export interface Sala {
  /** Clave del nombre de la sala. */
  nombre: string;
  /** Clave de la cubierta o área. */
  area: string;
  glyph: UIHudZoneParams["glyph"];
  rumbo: number;
  /** Clave del objeto que se usa en la sala. */
  objeto: string;
  /** Escenario 3D y su ambiente. */
  escenario: EscenarioId;
  ambiente: string;
}

export const SALAS = {
  "nave-puente": { nombre: "juego.sala.puente", area: "juego.area.nave", glyph: "map", rumbo: 0, objeto: "juego.objeto.mandos", escenario: "nw-15", ambiente: "AMB-02" },
  "nave-comun": { nombre: "juego.sala.comun", area: "juego.area.nave", glyph: "iris", rumbo: 0, objeto: "juego.objeto.mesa", escenario: "nw-16", ambiente: "AMB-02" },
  "nave-refugio": { nombre: "juego.sala.refugioNave", area: "juego.area.nave", glyph: "objective", rumbo: 0, objeto: "juego.objeto.puerta", escenario: "nw-17", ambiente: "AMB-03" },
  "colonia-exterior": { nombre: "juego.sala.exterior", area: "juego.area.jezero", glyph: "map", rumbo: -18, objeto: "juego.objeto.modulo", escenario: "colonia", ambiente: "AMB-04" },
  "colonia-refugio": { nombre: "juego.sala.refugioColonia", area: "juego.area.jezero", glyph: "objective", rumbo: 0, objeto: "juego.objeto.puerta", escenario: "nw-14", ambiente: "AMB-03" },
} as const satisfies Record<string, Sala>;

export type SalaId = keyof typeof SALAS;
