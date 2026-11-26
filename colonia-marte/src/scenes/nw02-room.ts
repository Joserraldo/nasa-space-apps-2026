import nw02Json from "../../data/layouts/rooms/nw-02.json";
import { mountInteriorRoom } from "./room-viewer";

export function mountGreenhouseRoom(): void {
  mountInteriorRoom(nw02Json, "nw02-greenhouse-ao-v1", [7.2, 1.5, 5.8]);
}
