import nw01Json from "../../data/layouts/rooms/nw-01.json";
import { mountInteriorRoom } from "./room-viewer";

export function mountServerRoom(): void {
  mountInteriorRoom(nw01Json, "nw01-servers-ao-v2", [8.5, 1.5, 5.8]);
}
