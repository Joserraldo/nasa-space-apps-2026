import nw15Json from "../../data/layouts/rooms/nw-15.json";
import { mountInteriorRoom } from "./room-viewer";

export function mountBridgeRoom(): void {
  mountInteriorRoom(nw15Json, "nw15-bridge-ao-v1", [8.4, 1.5, 6.2]);
}
