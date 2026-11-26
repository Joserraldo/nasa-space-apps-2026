import nw05Json from "../../data/layouts/rooms/nw-05.json";
import { mountInteriorRoom } from "./room-viewer";

export function mountAirlockRoom(): void {
  mountInteriorRoom(nw05Json, "nw05-airlock-ao-v2", [4.8, 1.5, 5.2]);
}
