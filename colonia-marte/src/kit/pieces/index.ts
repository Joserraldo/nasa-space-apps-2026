import { PieceRegistry } from "../registry";
import { registerMarsPieces } from "./mars";
import { registerStationPieces } from "./station";
import { registerCrewPieces } from "./crew";

/**
 * Production registry: every inventory piece built by WS3/WS4 registers here.
 * The demo registry in src/core/demo-pieces.ts stays as a WS0 test fixture only.
 */
export function createProductionRegistry(): PieceRegistry {
  const registry = new PieceRegistry();
  registerStationPieces(registry);
  registerMarsPieces(registry);
  registerCrewPieces(registry);
  return registry;
}
