import { MathUtils } from "three";
import type { PieceRegistry } from "../kit/registry";
import type { ColonyPlacementSpec } from "./colony-layout";
import { LANDING_PAD_DECK_HEIGHT } from "../kit/pieces/mars/landing-pad";
import { createLandingEffects } from "./landing-effects";

const LANDING_SECONDS = 9;
const DUST_SECONDS = 2.4;

export function createFamilyArrival(pad: ColonyPlacementSpec, ground: number, registry: PieceRegistry) {
  const deck = ground + (pad.yOffset ?? 0) + LANDING_PAD_DECK_HEIGHT;
  const ship = registry.build("MV-12", { detail: "near" });
  ship.rotation.y = MathUtils.degToRad((pad.rot ?? 0) + 8);
  ship.visible = false;
  const effects = createLandingEffects();
  ship.add(effects.flames);
  effects.dust.position.set(pad.at[0], deck + 0.016, pad.at[1]);
  const legs = ship.children.filter(part => part.name.startsWith("landing-leg-"));
  let time = LANDING_SECONDS;

  const place = (reducedMotion = false) => {
    const descent = MathUtils.smootherstep(time, 0, LANDING_SECONDS);
    ship.position.set(pad.at[0] - 1.8 * (1 - descent), deck + 6.5 * (1 - descent), pad.at[1] - 2 * (1 - descent));
    const deployed = MathUtils.smootherstep(descent, 0.18, 0.58);
    for (const leg of legs) leg.rotation.z = 1.10 * (1 - deployed);
    const altitude = ship.position.y - deck;
    const enginesOn = ship.visible && time < LANDING_SECONDS;
    effects.flames.visible = enginesOn;
    effects.flames.material.opacity = 0.72 + 0.11 * Math.sin(time * 32);
    const settled = Math.max(0, time - LANDING_SECONDS);
    const strength = ship.visible && !reducedMotion
      ? (1 - MathUtils.smoothstep(altitude, 0.23, 2.2)) * (1 - MathUtils.smoothstep(settled, 0, DUST_SECONDS))
      : 0;
    const spread = 0.42 * (1 - MathUtils.smoothstep(altitude, 0, 2.2)) + 0.58 * settled / DUST_SECONDS;
    effects.updateDust(strength, spread);
    return altitude;
  };

  return {
    ship,
    dust: effects.dust,
    dispose: effects.dispose,
    show(active: boolean, reducedMotion: boolean) {
      ship.visible = active;
      if (active) time = reducedMotion ? LANDING_SECONDS + DUST_SECONDS : 0;
      return place(reducedMotion);
    },
    advance(dt: number) {
      if (!ship.visible || time >= LANDING_SECONDS + DUST_SECONDS) return null;
      time = Math.min(LANDING_SECONDS + DUST_SECONDS, time + dt);
      return place();
    },
  };
}
