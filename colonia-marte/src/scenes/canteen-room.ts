import canteenJson from "../../data/layouts/rooms/canteen.json";
import { mountInteriorRoom } from "./room-viewer";

export function mountCanteenRoom(): void {
  mountInteriorRoom(canteenJson, "canteen-pilot-ao-v3", [11.5, 1.5, 4.2]);
}
