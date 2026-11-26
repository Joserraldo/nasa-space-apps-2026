import nw14Json from "../../data/layouts/rooms/nw-14.json";
import { mountInteriorRoom } from "./room-viewer";

export function mountShelterRoom(): void {
  mountInteriorRoom(nw14Json, "nw14-shelter-ao-v1", [4.8, 1.5, 4.2]);
}
