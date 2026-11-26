import { Vector3 } from "three";
import canteenJson from "../../data/layouts/rooms/canteen.json";
import { CANTEEN_HUD_STATE, createGameHud } from "../ui/organisms/game-hud";
import { createPauseMenu, DEFAULT_PAUSE_STATE } from "../ui/organisms/pause-menu";
import { createCrewDialogue, TESS_DISPENSER_DIALOGUE } from "../ui/organisms/crew-dialogue";
import { DIALOGUE_SAMPLES } from "../ui/organisms/crew-dialogue.samples";
import { createSettingsMenu, isSettingsTab, type SettingsTab } from "../ui/organisms/settings-menu";
import { DEFAULT_SETTINGS, loadSettings, resetProgress, saveSettings, type SettingsState } from "../ui/state/settings";
import { mountInteriorRoom } from "./room-viewer";

/** Salad dispenser display (DN-04 at x 10.12): the diegetic prompt is anchored here. */
const DISPENSER_ANCHOR = new Vector3(10.12, 1.75, 0.85);

function previewStorage(): Storage | undefined {
  try { return localStorage; } catch { return undefined; }
}

function applySettings(state: SettingsState): void {
  if (state.bigText) document.documentElement.classList.add("ui-big-text");
  else document.documentElement.classList.remove("ui-big-text");
  document.body.dataset.joystickSide = state.joystickSide;
}

/** Container: owns the scene and projects the anchor each frame; the HUD organism stays presentational. */
export function mountHudPreview(): void {
  document.body.classList.add("hud-preview");
  const storage = previewStorage();
  const initial = storage ? loadSettings(storage) : DEFAULT_SETTINGS;
  const params = new URLSearchParams(location.search);
  applySettings(initial);
  let follow = () => {};
  mountInteriorRoom(canteenJson, "canteen-pilot-ao-v3", [11.5, 1.5, 4.2], {
    onReady: ({ camera, viewport }) => {
      const pause = createPauseMenu(DEFAULT_PAUSE_STATE, id => { if (id === "settings") openSettings(); });
      const settingsItem = pause.dialog.querySelector<HTMLButtonElement>('[data-pause-action="settings"]');
      const settings = createSettingsMenu(initial, {
        onChange: state => {
          applySettings(state);
          try { if (storage) saveSettings(storage, state); } catch { /* Keep in-memory changes usable. */ }
        },
        onResetProgress: () => {
          try { if (storage) resetProgress(storage); } catch { /* Storage may be unavailable in the preview. */ }
        },
      });
      function openSettings(tab?: SettingsTab): void {
        pause.open();
        settingsItem?.focus();
        settings.open(tab);
      }
      document.body.append(pause.dialog, settings.dialog);
      let talking: ReturnType<typeof createCrewDialogue> | null = null;
      const sampleKey = params.get("dialogue");
      const talk = () => {
        if (talking) return;
        const state = (sampleKey && DIALOGUE_SAMPLES[sampleKey]) || TESS_DISPENSER_DIALOGUE;
        talking = createCrewDialogue(state, () => {
          talking?.root.remove(); talking = null; hud.setMode("explore");
        });
        hud.setMode("dialogue");
        hud.layer.append(talking.root);
        talking.focusFirstReply();
      };
      const hud = createGameHud(CANTEEN_HUD_STATE, talk, () => pause.open());
      viewport.append(hud.layer);
      if (sampleKey) talk();
      addEventListener("keydown", event => { if (event.key === "p" || event.key === "P") pause.open(); });
      const settingsTab = params.get("settings");
      if (isSettingsTab(settingsTab)) openSettings(settingsTab);
      else if (params.get("pause") === "1") pause.open();
      const point = new Vector3();
      follow = () => {
        point.copy(DISPENSER_ANCHOR).project(camera);
        const onScreen = point.z < 1 && Math.abs(point.x) < 0.95 && Math.abs(point.y) < 0.95;
        hud.placeInteraction(onScreen
          ? { x: (point.x + 1) / 2 * hud.layer.clientWidth, y: (1 - point.y) / 2 * hud.layer.clientHeight }
          : null);
      };
      follow();
    },
    onFrame: () => follow(),
  });
}
