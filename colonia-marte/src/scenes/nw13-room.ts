import nw13Json from "../../data/layouts/rooms/nw-13.json";
import { mountInteriorRoom } from "./room-viewer";

export function mountCommsRoom(): void {
  mountInteriorRoom(nw13Json, "nw13-comms-ao-v1", [8.4, 1.5, 5.8]);
}
