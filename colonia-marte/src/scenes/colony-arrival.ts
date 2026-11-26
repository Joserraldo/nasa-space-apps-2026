import { MathUtils } from "three";
import type { PieceRegistry } from "../kit/registry";
import type { ColonyPlacementSpec } from "./colony-layout";
import { LANDING_PAD_DECK_HEIGHT } from "../kit/pieces/mars/landing-pad";

const LANDING_SECONDS = 9;

export function createFamilyArrival(pad: ColonyPlacementSpec, ground: number, registry: PieceRegistry) {
  const deck = ground + (pad.yOffset ?? 0) + LANDING_PAD_DECK_HEIGHT;
  const ship = registry.build("MV-10", { detail: "near" });
  ship.scale.setScalar(0.255);
  ship.rotation.y = MathUtils.degToRad((pad.rot ?? 0) + 8);
  ship.visible = false;
  let time = LANDING_SECONDS;

  const place = () => {
    const descent = MathUtils.smootherstep(time, 0, LANDING_SECONDS);
    ship.position.set(pad.at[0] - 1.8 * (1 - descent), deck + 6.5 * (1 - descent), pad.at[1] - 2 * (1 - descent));
    return ship.position.y - deck;
  };

  return {
    ship,
    show(active: boolean, reducedMotion: boolean) {
      ship.visible = active;
      if (active) time = reducedMotion ? LANDING_SECONDS : 0;
      return place();
    },
    advance(dt: number) {
      if (!ship.visible || time >= LANDING_SECONDS) return null;
      time = Math.min(LANDING_SECONDS, time + dt);
      return place();
    },
  };
}
