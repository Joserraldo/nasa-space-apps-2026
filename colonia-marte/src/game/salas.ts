/** Salas del juego y su punto de uso. Los textos son claves de data/story/i18n. */
import type { UIHudZoneParams } from "../ui/molecules/hud-molecules";

export interface Sala {
  /** Clave del nombre de la sala. */
  nombre: string;
  /** Clave de la cubierta o área. */
  area: string;
  glyph: UIHudZoneParams["glyph"];
  rumbo: number;
  /** Clave del objeto que se usa en la sala. */
  objeto: string;
}

export const SALAS = {
  "nave-puente": { nombre: "juego.sala.puente", area: "juego.area.nave", glyph: "map", rumbo: 0, objeto: "juego.objeto.mandos" },
  "nave-comun": { nombre: "juego.sala.comun", area: "juego.area.nave", glyph: "iris", rumbo: 0, objeto: "juego.objeto.mesa" },
  "nave-refugio": { nombre: "juego.sala.refugioNave", area: "juego.area.nave", glyph: "objective", rumbo: 0, objeto: "juego.objeto.puerta" },
  "colonia-exterior": { nombre: "juego.sala.exterior", area: "juego.area.jezero", glyph: "map", rumbo: -18, objeto: "juego.objeto.modulo" },
  "colonia-refugio": { nombre: "juego.sala.refugioColonia", area: "juego.area.jezero", glyph: "objective", rumbo: 0, objeto: "juego.objeto.puerta" },
} as const satisfies Record<string, Sala>;

export type SalaId = keyof typeof SALAS;
