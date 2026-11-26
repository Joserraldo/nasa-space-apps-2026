import nw16Json from "../../data/layouts/rooms/nw-16.json";
import { mountInteriorRoom } from "./room-viewer";

export function mountShipCommonRoom(): void {
  mountInteriorRoom(nw16Json, "nw16-common-ao-v1", [6.0, 1.5, 6.4]);
}
