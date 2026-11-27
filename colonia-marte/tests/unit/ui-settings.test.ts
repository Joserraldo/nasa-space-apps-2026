import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHudChoice, createHudHoldGate, createHudStepper, createSettingsMenu, createUIRegistry } from "../../src/ui";
import { DEFAULT_SETTINGS, effectiveDifficulty, loadSettings, resetProgress, saveSettings, setSetting, stepSetting } from "../../src/ui/state/settings";
import { fireDomEvent, installDomShim } from "./helpers/dom-shim";

function memoryStorage(): Storage {
  const entries = new Map<string, string>();
  return {
    get length() { return entries.size; },
    clear: () => entries.clear(),
    getItem: key => entries.get(key) ?? null,
    key: index => [...entries.keys()][index] ?? null,
    removeItem: key => { entries.delete(key); },
    setItem: (key, value) => { entries.set(key, value); },
  };
}

describe("settings state", () => {
  it("bounds volume steps without mutating the state", () => {
    expect(stepSetting(DEFAULT_SETTINGS, "voice", 1)).toEqual(DEFAULT_SETTINGS);
    expect(stepSetting(DEFAULT_SETTINGS, "music", -9)).toMatchObject({ music: 0 });
    expect(stepSetting(DEFAULT_SETTINGS, "sound", 1)).toMatchObject({ sound: 4 });
    expect(stepSetting(DEFAULT_SETTINGS, "voice", 1)).not.toBe(DEFAULT_SETTINGS);
  });

  it("ignores invalid values without mutating the state", () => {
    for (const [key, value] of [["music", 4.5], ["voice", -1], ["sound", "3"], ["difficulty", "hardcore"], ["bigText", 1], ["joystickSide", "up"]] as const) {
      expect(setSetting(DEFAULT_SETTINGS, key, value)).toEqual(DEFAULT_SETTINGS);
    }
    expect(setSetting(DEFAULT_SETTINGS, "bigText", true)).toMatchObject({ bigText: true });
  });

  it("defaults absent, malformed, inaccessible and invalid stored fields independently", () => {
    const storage = memoryStorage();
    expect(loadSettings(storage)).toEqual(DEFAULT_SETTINGS);
    storage.setItem("colonia.settings.v1", "{broken");
    expect(loadSettings(storage)).toEqual(DEFAULT_SETTINGS);
    storage.setItem("colonia.settings.v1", '{"music":99,"voice":0,"hardcore":"true"}');
    expect(loadSettings(storage)).toEqual({ ...DEFAULT_SETTINGS, voice: 0 });
    storage.getItem = () => { throw new Error("unavailable"); };
    expect(loadSettings(storage)).toEqual(DEFAULT_SETTINGS);
  });

  it("round-trips preferences and resets only progress entries", () => {
    const storage = memoryStorage();
    const state = setSetting(setSetting(DEFAULT_SETTINGS, "music", 1), "joystickSide", "right");
    storage.setItem("colonia.progress.c1", "a");
    saveSettings(storage, state);
    storage.setItem("colonia.progress.c2", "b");
    storage.setItem("colonia.progression", "keep");
    resetProgress(storage);
    expect(storage.length).toBe(2);
    expect(storage.getItem("colonia.progression")).toBe("keep");
    expect(loadSettings(storage)).toEqual(state);
  });

  it("uses hardcore only as an override", () => {
    const state = setSetting(DEFAULT_SETTINGS, "difficulty", "medium");
    expect(effectiveDifficulty(state)).toBe("medium");
    expect(effectiveDifficulty(setSetting(state, "hardcore", true))).toBe("hardcore");
    expect(state.difficulty).toBe("medium");
  });
});

function visibleText(root: HTMLElement): HTMLElement[] {
  if (root.hidden) return [];
  const children = Array.from(root.children) as HTMLElement[];
  return children.length ? children.flatMap(visibleText) : root.textContent?.trim() ? [root] : [];
}

describe("settings controls", () => {
  beforeEach(() => { installDomShim(); });

  it("enforces stepper endpoints and exposes the real level and Off label", () => {
    const step = vi.fn();
    const control = createHudStepper({ label: "Music", glyph: "music", level: 0, onStep: step });
    const [minus, plus] = Array.from(control.root.querySelectorAll<HTMLButtonElement>("button"));
    const meter = control.root.querySelector('[role="meter"]')!;
    expect(minus.disabled).toBe(true);
    expect(plus.disabled).toBe(false);
    expect(meter.getAttribute("aria-valuenow")).toBe("0");
    expect(meter.getAttribute("aria-valuetext")).toBe("Off");
    expect(meter.querySelectorAll(".is-on")).toHaveLength(0);
    plus.click();
    expect(step).toHaveBeenCalledWith(1);
    control.setLevel(4);
    expect(minus.disabled).toBe(false);
    expect(plus.disabled).toBe(true);
    expect(meter.getAttribute("aria-valuenow")).toBe("4");
    expect(meter.querySelectorAll(".is-on")).toHaveLength(5);
  });

  it("keeps only the chosen option pressed and reports changes", () => {
    const change = vi.fn();
    const control = createHudChoice({
      label: "Big text", glyph: "text", value: false, onChange: change,
      options: [{ value: false, label: "Off" }, { value: true, label: "On" }],
    });
    const [off, on] = Array.from(control.root.querySelectorAll("button"));
    expect(off.getAttribute("aria-pressed")).toBe("true");
    expect(on.getAttribute("aria-pressed")).toBe("false");
    expect(off.querySelector(".ui-settings__check")?.hasAttribute("hidden")).toBe(false);
    expect(on.querySelector(".ui-settings__check")?.hasAttribute("hidden")).toBe(true);
    on.click();
    expect(change).toHaveBeenCalledWith(true);
    control.setValue(true);
    expect(off.getAttribute("aria-pressed")).toBe("false");
    expect(on.getAttribute("aria-pressed")).toBe("true");
    expect(on.querySelector(".ui-settings__check")?.hasAttribute("hidden")).toBe(false);
  });

  it("cancels early holds and unlocks once after a full keyboard hold", () => {
    vi.useFakeTimers();
    try {
      const unlock = vi.fn();
      const { button } = createHudHoldGate(unlock);
      button.click();
      fireDomEvent(button, "keydown", { key: " " });
      vi.advanceTimersByTime(2999);
      fireDomEvent(button, "keyup", { key: " " });
      vi.advanceTimersByTime(1000);
      expect(unlock).not.toHaveBeenCalled();
      fireDomEvent(button, "keydown", { key: "Enter" });
      vi.advanceTimersByTime(3000);
      fireDomEvent(button, "keyup", { key: "Enter" });
      expect(unlock).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("shows at most three rows, and voices every visible text in every tab and subview", () => {
    vi.useFakeTimers();
    try {
      const menu = createSettingsMenu(DEFAULT_SETTINGS);
      const tabs = Array.from(menu.dialog.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
      const panels = Array.from(menu.dialog.querySelectorAll<HTMLElement>('[role="tabpanel"]'));
      const checkText = () => {
        const texts = visibleText(menu.dialog);
        expect(texts.length).toBeGreaterThan(4);
        for (const el of texts) {
          expect(el.dataset.voiceLine, el.textContent ?? "").toBeTruthy();
          expect(el.dataset.voiceLine?.trim().split(/\s+/).length).toBeLessThanOrEqual(12);
        }
      };
      expect(tabs).toHaveLength(3);
      for (const tab of tabs) {
        tab.click();
        expect(panels.filter(panel => !panel.hidden)).toHaveLength(1);
        checkText();
      }
      const gate = menu.dialog.querySelector(".ui-hud-hold-gate__button")!;
      fireDomEvent(gate, "keydown", { key: " " });
      vi.advanceTimersByTime(3000);
      checkText();
      const action = (label: string) => Array.from(menu.dialog.querySelectorAll("button")).find(button => button.textContent?.trim() === label)!;
      action("Reset progress").click();
      expect(document.activeElement).toBe(action("Keep my game"));
      checkText();
      action("Keep my game").click();
      action("Credits").click();
      checkText();
      const source = readFileSync(new URL("../../CREDITS.md", import.meta.url), "utf8");
      const credits = menu.dialog.querySelector(".ui-settings__credits")!;
      const attributions = [...source.matchAll(/by ([A-Za-z]+(?: Games)?)(?= \[| \()/g)].map(match => match[1]);
      const licenses = [...source.matchAll(/CC-BY|CC0(?: 1\.0)?/g)].map(match => match[0]);
      for (const value of [...attributions, ...licenses]) expect(credits.textContent).toContain(value);
      expect(credits.querySelectorAll("a")).toHaveLength(4);
      expect(panels.map(panel => panel.querySelectorAll(".ui-settings__row").length)).toEqual([3, 3, 4]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("registers all new Settings kit components", () => {
    expect(createUIRegistry().ids()).toEqual(expect.arrayContaining([
      "UI-MOLECULE-HUD-STEPPER", "UI-MOLECULE-HUD-CHOICE", "UI-MOLECULE-HUD-HOLD-GATE", "UI-ORGANISM-SETTINGS-MENU",
    ]));
  });
});
