import type { PieceRegistry } from "../../registry";
import { registerAirlockArchitecture } from "./airlock-arch";
import { registerBridgePieces } from "./bridge-pieces";
import { registerCanteenPieces } from "./canteen";
import { registerCanteenProps } from "./canteen-props";
import { registerCommsRoomPieces } from "./comms-room";
import { registerControlFurniture } from "./control-furniture";
import { registerEvaGearPieces } from "./eva-gear";
import { registerGreenhousePieces } from "./greenhouse-pieces";
import { registerHydroponicPieces } from "./hydroponics";
import { registerShipCommonPieces } from "./ship-common";
import { registerShelterPieces } from "./shelter-pieces";
import { registerStationPortals } from "./portals";
import { registerStationProps } from "./props";
import { registerStationSlabs } from "./slabs";
import { registerTechAndAirlockPieces } from "./tech-rooms";
import { registerStationWalls } from "./walls";

/**
 * WS4 interior pieces (ST-*, DN-*, PR-*, CR-*, CF-*, NW-*, NX-05). Each family lives in
 * its own module in this folder and is registered from here.
 */
export function registerStationPieces(registry: PieceRegistry): void {
  registerStationWalls(registry);
  registerAirlockArchitecture(registry);
  registerStationPortals(registry);
  registerStationSlabs(registry);
  registerBridgePieces(registry);
  registerCanteenPieces(registry);
  registerCanteenProps(registry);
  registerCommsRoomPieces(registry);
  registerControlFurniture(registry);
  registerEvaGearPieces(registry);
  registerGreenhousePieces(registry);
  registerShipCommonPieces(registry);
  registerShelterPieces(registry);
  registerStationProps(registry);
  registerTechAndAirlockPieces(registry);
  registerHydroponicPieces(registry);
}
