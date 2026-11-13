import {
  CONTRACTS_VERSION,
  DifficultySchema,
  EquipmentSchema,
  ExpertSchema,
  MissionGoalSchema,
  SiteSchema,
  type Difficulty,
  type GameState,
  type Seed,
  type SpaceWeatherEvent,
} from "@solar-shield/contracts";
import { RECURSOS_INICIALES, SIMULACIONES_POR_DIFICULTAD } from "@solar-shield/design";
import { elegir, enteroEntre, hashSeed, siguiente } from "./rng.js";

export interface OpcionesPartida {
  dificultad?: Difficulty;
  /** Catálogo curado por el rol datos. Si está vacío, la partida arranca sin tormenta. */
  tormentas?: readonly SpaceWeatherEvent[];
  /** Fuerza el sitio (ruta dorada = marte_jezero). Si falta, lo sortea la semilla. */
  sitio?: GameState["sitio"];
}

/**
 * Crea el estado inicial a partir de la semilla. Puro: misma semilla + mismas
 * opciones => mismo estado. Todo lo aleatorio sale del RNG con estado.
 */
export function crearPartida(seed: Seed, opciones: OpcionesPartida = {}): GameState {
  let rng = hashSeed(seed);

  const sitioSorteo = elegir(rng, SiteSchema.options);
  rng = sitioSorteo.estado;
  const sitio = opciones.sitio ?? sitioSorteo.elegido;

  const dificultad = opciones.dificultad ?? DifficultySchema.options[1];

  const objetivoSorteo = elegir(rng, MissionGoalSchema.options);
  rng = objetivoSorteo.estado;

  const tormentas = opciones.tormentas ?? [];
  let tormenta: SpaceWeatherEvent | null = null;
  if (tormentas.length > 0) {
    const t = elegir(rng, tormentas);
    rng = t.estado;
    tormenta = t.elegido;
  }

  // Una avería inicial sorteada (nunca la IA de la base al arrancar, salvo hardcore).
  const equiposAveriables = EquipmentSchema.options.filter((e) => e !== "ia_base");
  const averia = elegir(rng, equiposAveriables);
  rng = averia.estado;
  const equipos = Object.fromEntries(
    EquipmentSchema.options.map((e) => [e, e === averia.elegido ? "averiado" : "ok"]),
  ) as GameState["equipos"];

  const tripulacion: GameState["tripulacion"] = ExpertSchema.options.map((id) => {
    const s = siguiente(rng);
    rng = s.estado;
    return {
      id,
      // Rebanada vertical: Matemático y Control de Misión entran después (PLAN §2.2).
      disponible: id !== "matematico" && id !== "control_mision",
      sesgo: Math.round((s.valor * 2 - 1) * 100) / 100,
      dosisMSv: 0,
    };
  });

  const orbitaSorteo = enteroEntre(rng, 300, 450);
  rng = orbitaSorteo.estado;

  return {
    version: CONTRACTS_VERSION,
    seed,
    sitio,
    dificultad,
    objetivo: objetivoSorteo.elegido,
    tick: 0,
    dia: 1,
    pausado: false,
    recursos: { ...RECURSOS_INICIALES[sitio] },
    equipos,
    tripulacion,
    iaBase: dificultad === "hardcore" ? "danada" : "tutorial",
    rendimiento: { rachaAciertos: 0, erroresRecientes: 0, ticksSinAccion: 0 },
    tormenta,
    orbita: {
      alturaKm: orbitaSorteo.entero,
      franja: 1,
      bateriaPct: 100,
      senalPct: 100,
      escudoPct: 100,
    },
    efectosPendientes: [],
    causas: [],
    simulacionesRestantes: SIMULACIONES_POR_DIFICULTAD[dificultad],
    rngEstado: rng,
    resultado: "en_curso",
  };
}
