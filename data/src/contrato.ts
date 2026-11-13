/**
 * Contrato SpaceWeatherEvent: se reexporta del contrato REAL de /contracts (v0.2.0, PR #29).
 * Ya no hay copia: si el motor cambia el contrato, las pruebas de data/ lo detectan.
 * (data/ ya es workspace desde #46.)
 */
export {
  SourceCardSchema,
  SpaceWeatherKindSchema,
  SpaceWeatherPhaseSchema,
  SpaceWeatherEventSchema,
  MarsArrivalSchema,
  MarsMeasurementSchema,
  type SourceCard,
  type SpaceWeatherKind,
  type SpaceWeatherPhase,
  type SpaceWeatherEvent,
} from "@solar-shield/contracts";
