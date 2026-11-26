import nw17Json from "../../data/layouts/rooms/nw-17.json";
import { mountInteriorRoom } from "./room-viewer";

export function mountShipShelterRoom(): void {
  mountInteriorRoom(nw17Json, "nw17-shelter-ao-v1", [3.0, 1.5, 5.8]);
}
