/**
 * el mundo 3D cambia de paleta según la misión.
 *
 * La escena lee los colores del entorno (tokens), del cielo y de la luz al construirse, y se vuelve
 * a montar en cada partida nueva. Aquí se reescriben esos valores ANTES de montarla: el relieve sigue
 * siendo el DEM de Jezero (no hay otro con la forma que espera la escena), pero el suelo, las rocas,
 * el cielo, la niebla y la luz pasan a ser de Marte polar, de la Luna o del espacio.
 * Si esto pasa a producción, lo limpio es que la escena reciba el tema como opción, no mutar módulos.
 */
import { COLORES } from "../estilos/tokens";
import { LUZ, PALETA_CIELO } from "./cielo";

export type TemaMundo = "marte" | "marte-polar" | "luna" | "espacio";

interface Paleta {
  suelo: { "regolito-claro": string; "regolito-medio": string; "roca-basalto": string; "sombra-suelo": string };
  dia: { cenit: string; horizonte: string; halo: string; niebla: string };
  atardecer: { cenit: string; horizonte: string; halo: string; niebla: string };
  hemi: { diaCielo: string; atardecerCielo: string; suelo: string };
  colorSol: string;
}

type Mutable<T> = { -readonly [K in keyof T]: Mutable<T[K]> };
const colores = COLORES as unknown as Mutable<Record<string, string>>;
const cielo = PALETA_CIELO as unknown as Mutable<typeof PALETA_CIELO>;
const luz = LUZ as unknown as Mutable<{ colorSol: string; hemisferica: Record<"dia" | "atardecer", { cielo: string; suelo: string }> }>;

/** La paleta de Marte tal como está en el código, copiada antes de cualquier cambio. */
const MARTE: Paleta = {
  suelo: {
    "regolito-claro": colores["regolito-claro"]!,
    "regolito-medio": colores["regolito-medio"]!,
    "roca-basalto": colores["roca-basalto"]!,
    "sombra-suelo": colores["sombra-suelo"]!,
  },
  dia: { ...PALETA_CIELO.dia },
  atardecer: { ...PALETA_CIELO.atardecer },
  hemi: { diaCielo: LUZ.hemisferica.dia.cielo, atardecerCielo: LUZ.hemisferica.atardecer.cielo, suelo: LUZ.hemisferica.dia.suelo },
  colorSol: LUZ.colorSol,
};

/** Luna: regolito gris y cielo negro (sin atmósfera). Sol blanco y duro. */
const LUNA: Paleta = {
  suelo: { "regolito-claro": "#BDBAB6", "regolito-medio": "#8A8890", "roca-basalto": "#57555F", "sombra-suelo": "#A3A6B8" },
  dia: { cenit: "#05060F", horizonte: "#1B1F33", halo: "#FFFFFF", niebla: "#1B1F33" },
  atardecer: { cenit: "#05060F", horizonte: "#1B1F33", halo: "#FFFFFF", niebla: "#1B1F33" },
  hemi: { diaCielo: "#A9B0D6", atardecerCielo: "#7E86B0", suelo: "#8A8890" },
  colorSol: "#FFFFFF",
};

const TEMAS: Record<TemaMundo, Paleta> = {
  marte: MARTE,
  // Polo norte de Marte: el mismo polvo, aclarado por la escarcha; cielo un poco más pálido.
  "marte-polar": {
    suelo: { "regolito-claro": "#F3D2C6", "regolito-medio": "#C9A1AA", "roca-basalto": "#8C6070", "sombra-suelo": "#F6E0E4" },
    dia: { cenit: "#D6B3A8", horizonte: "#F6E2D4", halo: "#E8F0F4", niebla: "#F6E2D4" },
    atardecer: { ...MARTE.atardecer },
    hemi: { diaCielo: "#DDD3EC", atardecerCielo: MARTE.hemi.atardecerCielo, suelo: "#C9A1AA" },
    colorSol: "#FFF3E6",
  },
  luna: LUNA,
  // Outpost en el espacio: la Luna pero con el fondo aún más negro.
  espacio: { ...LUNA, dia: { ...LUNA.dia, horizonte: "#0B0D1C", niebla: "#0B0D1C" }, atardecer: { ...LUNA.atardecer, horizonte: "#0B0D1C", niebla: "#0B0D1C" } },
};

/** Tema de cada misión (id de missions/). Las que no están, Marte. */
const TEMA_DE_MISION: Record<string, TemaMundo> = {
  "marte-polo-norte": "marte-polar",
  "luna-polo-sur": "luna",
  "luna-lado-visible": "luna",
  "outpost-sorpresa": "espacio",
};

export function temaDeMision(misionId: string): TemaMundo {
  return TEMA_DE_MISION[misionId] ?? "marte";
}

let actual: TemaMundo = "marte";

/** Aplica el tema. Debe llamarse antes de montar la escena; no hace nada si ya está puesto. */
export function aplicarTemaMundo(tema: TemaMundo): void {
  if (tema === actual) return;
  actual = tema;
  const p = TEMAS[tema];
  Object.assign(colores, p.suelo);
  Object.assign(cielo.dia, p.dia);
  Object.assign(cielo.atardecer, p.atardecer);
  luz.hemisferica.dia.cielo = p.hemi.diaCielo;
  luz.hemisferica.dia.suelo = p.hemi.suelo;
  luz.hemisferica.atardecer.cielo = p.hemi.atardecerCielo;
  luz.hemisferica.atardecer.suelo = p.hemi.suelo;
  luz.colorSol = p.colorSol;
}
