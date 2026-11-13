/**
 * Modelo de órbita simple (fase satélite). Solo datos; la lógica está en engine/orbita.ts.
 * Son valores de juego, no cifras de NASA.
 */
export const ORBITA = {
  /** Altura permitida en km. */
  alturaMinKm: 200,
  alturaMaxKm: 600,
  /** Ticks que dura una vuelta a 300 km; sube con la altura. */
  ticksPorVueltaBase: 4,
  kmPorTickExtra: 150,
  /** Fracción de la vuelta con contacto directo (franja 1) a 300 km; sube con la altura. */
  franjaBase: 0.5,
  franjaPorKm: 0.001,
  /** Batería: carga al sol, gasta en sombra. */
  cargaSolPct: 15,
  gastoSombraPct: 10,
  /** Señal = franja × 100, menos castigo si la antena está averiada. */
  castigoAntenaAveriadaPct: 40,
  /** Escudo del satélite: se desgasta con la tormenta y nunca se repara solo. */
  desgastePorIntensidadPct: 8,
  /** Órbita baja = más arrastre: pierde altura por tick bajo este umbral. */
  arrastreBajoKm: 250,
  arrastreKmPorTick: 5,
} as const;
