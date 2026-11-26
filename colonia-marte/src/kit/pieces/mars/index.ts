import type { PieceRegistry } from "../../registry";
import { registerMarsBuildings } from "./buildings";
import { registerOpenFrameDome } from "./open-frame-dome";
import { registerCommandTower } from "./command-tower";
import { registerResidentialBlock } from "./residential-block";
import { registerMarsCommsDish } from "./comms-dish";
import { registerGreenhouse } from "./greenhouse";
import { registerMarsEntranceTower } from "./entrance-tower";
import { registerMarsHabitats } from "./habitats";
import { registerMarsIndustrial } from "./industrial";
import { registerMarsIndustrial03 } from "./industrial-03";
import { registerMarsInfrastructure } from "./infrastructure";
import { registerMarsRocks } from "./rocks";
import { registerMarsReconBuggy } from "./recon-buggy";
import { registerMarsRoverTruck } from "./rover-truck";
import { registerMarsStrandedRover } from "./stranded-rover";
import { registerMarsTransit } from "./transit";
import { registerMarsVehicleGarage } from "./vehicle-garage";

/**
 * WS2/WS3 exterior pieces (MT-T04/05/06, MB-01/02/03/04/07/10/14, MI-03/04/06/09/11, MV-01/03/09/11, NX-01).
 * Each family lives in its own module in this folder and is registered from here.
 */
export function registerMarsPieces(registry: PieceRegistry): void {
  registerMarsRocks(registry);
  registerMarsHabitats(registry);
  registerGreenhouse(registry);
  registerMarsBuildings(registry);
  registerOpenFrameDome(registry);
  registerCommandTower(registry);
  registerResidentialBlock(registry);
  registerMarsIndustrial(registry);
  registerMarsInfrastructure(registry);
  registerMarsCommsDish(registry);
  registerMarsTransit(registry);
  registerMarsRoverTruck(registry);
  registerMarsStrandedRover(registry);
  registerMarsReconBuggy(registry);
  registerMarsVehicleGarage(registry);
  registerMarsEntranceTower(registry);
  registerMarsIndustrial03(registry);
}
