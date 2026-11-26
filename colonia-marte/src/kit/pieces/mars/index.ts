import type { PieceRegistry } from "../../registry";
import { registerMarsBuildings } from "./buildings";
import { registerMarsCommsDish } from "./comms-dish";
import { registerMarsHabitats } from "./habitats";
import { registerMarsIndustrial } from "./industrial";
import { registerMarsInfrastructure } from "./infrastructure";
import { registerMarsRocks } from "./rocks";
import { registerMarsTransit } from "./transit";

/**
 * WS2/WS3 exterior pieces (MT-T04/05/06, MB-01/02/03/04/07/10, MI-03/04/06/09/11).
 * Each family lives in its own module in this folder and is registered from here.
 */
export function registerMarsPieces(registry: PieceRegistry): void {
  registerMarsRocks(registry);
  registerMarsHabitats(registry);
  registerMarsBuildings(registry);
  registerMarsIndustrial(registry);
  registerMarsInfrastructure(registry);
  registerMarsCommsDish(registry);
  registerMarsTransit(registry);
}
