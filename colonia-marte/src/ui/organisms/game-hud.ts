import "@fontsource/chakra-petch/600.css";
import "@fontsource/chakra-petch/700.css";
import "@fontsource/exo-2/500.css";
import "@fontsource/exo-2/600.css";
import {
  createHudInteraction, createHudMinimap, createHudObjective, createHudStatus, createHudZone,
  type HudPromptSide, type UIHudInteractionParams, type UIHudMinimapParams, type UIHudObjectiveParams,
  type UIHudStatusParams, type UIHudZoneParams,
} from "../molecules/hud-molecules";
import { createHudGlyph } from "../atoms/hud-atoms";
import type { UIRegistry } from "../registry";
import { uiText, type UIStrings } from "../i18n";

/**
 * Game HUD organism (UI v3): places the HUD molecules on the screen corners and keeps the
 * centre clear except for the diegetic interaction prompt. Container pattern stays outside:
 * the scene owns state and calls `placeInteraction` every frame.
 */
export interface GameHudState {
  zone: Partial<UIHudZoneParams>;
  objective: Partial<UIHudObjectiveParams>;
  status: Partial<UIHudStatusParams>;
  minimap: Partial<UIHudMinimapParams>;
  interaction: Partial<UIHudInteractionParams>;
}

export function createGameHud(state: GameHudState, onUse: () => void = () => {}, onPause: () => void = () => {}, strings?: UIStrings) {
  const text = uiText(strings);
  const layer = document.createElement("div");
  layer.className = "ui-game-hud";
  layer.setAttribute("role", "region");
  layer.setAttribute("aria-label", text("componente.hud.region"));
  const slot = (name: string, child: HTMLElement) => {
    const wrapper = document.createElement("div");
    wrapper.className = `ui-game-hud__slot ui-game-hud__slot--${name}`;
    wrapper.append(child);
    return wrapper;
  };
  const interaction = createHudInteraction(state.interaction);
  const minimap = createHudMinimap(state.minimap, strings);
  const objective = createHudObjective(state.objective, strings);
  const status = createHudStatus(state.status, strings);
  const zone = createHudZone(state.zone, strings);
  interaction.button.addEventListener("click", onUse);
  const pause = document.createElement("button");
  pause.type = "button";
  pause.className = "ui-hud-pause";
  pause.setAttribute("aria-label", text("componente.hud.pausa"));
  pause.dataset.voiceLine = text("componente.hud.pausa.voz");
  pause.append(createHudGlyph("pause", "ui-hud-pause__glyph"));
  pause.addEventListener("click", onPause);
  layer.append(
    slot("top-centre", pause),
    slot("top-left", minimap),
    slot("top-right", objective),
    slot("bottom-left", status),
    slot("bottom-right", zone),
    interaction.root,
  );
  return {
    layer,
    update(partial: Partial<GameHudState>) {
      if (partial.minimap) minimap.update(partial.minimap);
      if (partial.objective) objective.update(partial.objective);
      if (partial.status) status.update(partial.status);
      if (partial.zone) zone.update(partial.zone);
      if (partial.interaction) interaction.update(partial.interaction);
    },
    /** "dialogue" hides the bottom corners and the prompt so the crew dialogue owns the bottom band. */
    setMode(mode: "explore" | "dialogue") { layer.classList.toggle("is-dialogue", mode === "dialogue"); },
    /** Anchor in CSS px inside the layer (null = off screen). Chooses a side that avoids the corners. */
    placeInteraction(point: { x: number; y: number } | null) {
      let side: HudPromptSide = "right";
      if (point) {
        if (layer.clientHeight <= 460) side = "below";
        else if (point.x > layer.clientWidth * 0.5) side = "left";
      }
      interaction.place(point, side);
    },
  };
}

export function registerGameHudOrganism(registry: UIRegistry): void {
  registry.register("UI-ORGANISM-GAME-HUD", {
    metadata: { layer: "organism", name: "Game HUD", figmaNodeId: "1:12",
      description: "Corner-anchored HUD: minimap, objective, companion status, zone label, diegetic prompt." },
    variants: { Canteen: {} },
    parse: () => ({}),
    render: () => {
      const box = document.createElement("div");
      box.style.cssText = "position:relative;width:1100px;height:560px;background:#c9ced0";
      const hud = createGameHud(CANTEEN_HUD_STATE);
      box.append(hud.layer);
      const frame = globalThis.requestAnimationFrame ?? ((callback: FrameRequestCallback) => { callback(0); return 0; });
      frame(() => hud.placeInteraction({ x: 560, y: 300 }));
      return box;
    },
  });
}

export const CANTEEN_HUD_STATE: GameHudState = {
  zone: { name: "Canteen", deck: "Habitat deck 1", glyph: "canteen", voiceLine: "You are in the canteen." },
  objective: { title: "Get lunch for the crew", step: "Step 1 of 3", voiceLine: "Your goal: get lunch for the crew." },
  status: {
    name: "Iris", role: "Companion", ringLevel: 0.72,
    resources: [
      { glyph: "battery", label: "Power", level: 0.75, tone: "Accent" },
      { glyph: "air", label: "Air", level: 0.9, tone: "Accent" },
      { glyph: "shield", label: "Shield", level: 0.5, tone: "Ink" },
    ],
  },
  minimap: { label: "Habitat deck 1", heading: -18 },
  interaction: { target: "Salad dispenser", action: "Tap to use", voiceLine: "Tap the dispenser to get a salad." },
};
