import { createHudFrame, createHudTab, hudFrameContent, voiceText, type UIHudGlyph } from "../atoms/hud-atoms";
import { CREDITS } from "../content/credits";
import { createHudChoice, type HudChoiceOption } from "../molecules/hud-choice";
import { createHudHoldGate } from "../molecules/hud-hold-gate";
import { createHudStepper } from "../molecules/hud-stepper";
import type { UIRegistry } from "../registry";
import { DEFAULT_SETTINGS, setSetting, stepSetting, type SettingsState, type VolumeKey } from "../state/settings";
import { createHudReply, type UIHudReplyParams } from "./crew-dialogue";

const TABS = [
  { id: "sound", label: "Sound", glyph: "sound" },
  { id: "play", label: "Play", glyph: "play" },
  { id: "grownups", label: "Grown-ups", glyph: "shield" },
] as const;
export type SettingsTab = (typeof TABS)[number]["id"];
export function isSettingsTab(value: string | null): value is SettingsTab {
  return TABS.some(tab => tab.id === value);
}

export interface SettingsCallbacks {
  onChange?: (state: SettingsState) => void;
  onPreview?: (channel: "voice") => void;
  onResetProgress?: () => void;
  onBack?: () => void;
}

const ON_OFF = [{ value: false, label: "Off" }, { value: true, label: "On" }] as const;
let nextId = 0;

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  return node;
}

function action(label: string, glyph: UIHudReplyParams["glyph"], run: () => void): HTMLButtonElement {
  const button = createHudReply({ label, glyph, voiceLine: label });
  button.addEventListener("click", run);
  return button;
}

function buildCredits(): HTMLElement {
  const content = element("div", "ui-settings__credits");
  for (const { sources, license, details } of CREDITS) {
    const entry = element("section", "ui-settings__credit");
    for (const { title, author, url } of sources) {
      const link = voiceText("a", "ui-settings__credit-source", `${title} by ${author}`);
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener";
      entry.append(link);
    }
    entry.append(voiceText("p", "ui-settings__license", license));
    for (const line of details) entry.append(voiceText("p", "", line));
    content.append(entry);
  }
  return content;
}

export function createSettingsMenu(initial: SettingsState, callbacks: SettingsCallbacks = {}) {
  let state = initial;
  let active: SettingsTab = "sound";
  let screen: "options" | "reset" | "credits" = "options";
  const id = `ui-settings-${++nextId}`;
  const dialog = element("dialog", "ui-pause ui-settings");
  dialog.setAttribute("aria-labelledby", `${id}-title`);
  const slab = element("div", "ui-pause__slab ui-settings__slab");
  const tablist = element("div", "ui-settings__tabs");
  tablist.setAttribute("role", "tablist");
  tablist.setAttribute("aria-label", "Settings sections");
  const panels = element("div", "ui-settings__panels");
  const updates: ((next: SettingsState, previous: SettingsState) => void)[] = [];

  const tabs = TABS.map(tab => {
    const button = action(tab.label, tab.glyph, () => activate(tab.id));
    button.id = `${id}-${tab.id}-tab`;
    button.setAttribute("role", "tab");
    const panel = element("section", "ui-settings__panel");
    panel.id = `${id}-${tab.id}-panel`;
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", button.id);
    tablist.append(button);
    panels.append(panel);
    return { ...tab, button, panel };
  });
  const [sound, play, adult] = tabs;
  tablist.addEventListener("keydown", event => {
    const current = tabs.findIndex(tab => tab.button === event.target);
    if (current < 0) return;
    const index = event.key === "ArrowRight" ? (current + 1) % tabs.length
      : event.key === "ArrowLeft" ? (current - 1 + tabs.length) % tabs.length
      : event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : -1;
    if (index < 0) return;
    event.preventDefault();
    activate(tabs[index].id);
    tabs[index].button.focus();
  });

  const volumeRows = [["music", "Music", "music"], ["voice", "Voices", "voice"], ["sound", "Sounds", "sound"]] as const;
  for (const [key, label, glyph] of volumeRows) {
    const stepper = createHudStepper({ label, glyph, level: state[key], onStep: delta => changeVolume(key, delta) });
    updates.push((next, previous) => { if (next[key] !== previous[key]) stepper.setLevel(next[key]); });
    sound.panel.append(stepper.root);
  }

  function choice<K extends "difficulty" | "bigText" | "joystickSide" | "hardcore">(
    key: K, label: string, glyph: UIHudGlyph,
    options: readonly [HudChoiceOption<SettingsState[K]>, HudChoiceOption<SettingsState[K]>, HudChoiceOption<SettingsState[K]>?],
  ) {
    const control = createHudChoice({
      label, glyph, value: state[key], options, onChange: value => change(setSetting(state, key, value)),
    });
    updates.push((next, previous) => { if (next[key] !== previous[key]) control.setValue(next[key]); });
    return control.root;
  }

  play.panel.append(
    choice("difficulty", "Challenge", "objective", [
      { value: "easy", label: "Easy", voiceLine: "Easy: no clock, no numbers." },
      { value: "medium", label: "Medium", voiceLine: "Medium: numbers appear." },
      { value: "hard", label: "Hard", voiceLine: "Hard: the clock runs." },
    ]),
    choice("bigText", "Big text", "text", ON_OFF),
    choice("joystickSide", "Joystick side", "tap", [{ value: "left", label: "Left" }, { value: "right", label: "Right" }]),
  );

  const adultOptions = element("div", "ui-settings__options");
  adultOptions.hidden = true;
  const hardcore = choice("hardcore", "Hardcore mode", "battery", ON_OFF);
  const hold = createHudHoldGate(() => {
    hold.root.hidden = true;
    adultOptions.hidden = false;
    hardcore.querySelector<HTMLButtonElement>("button")?.focus();
  });
  const resetButton = action("Reset progress", "home", () => show("reset", keep));
  const creditsButton = action("Credits", "iris", () => show("credits", creditsBack));
  for (const button of [resetButton, creditsButton]) button.classList.add("ui-settings__row");
  adultOptions.append(hardcore, resetButton, creditsButton);
  adult.panel.append(hold.root, adultOptions);

  const reset = element("section", "ui-settings__detail");
  const keep = action("Keep my game", "back", returnToAdult);
  const erase = action("Erase everything", "none", () => {
    callbacks.onResetProgress?.();
    returnToAdult();
  });
  const warning = voiceText("h2", "ui-settings__detail-title", "Erase your saved progress?");
  warning.id = `${id}-reset-title`;
  keep.setAttribute("aria-describedby", warning.id);
  erase.setAttribute("aria-describedby", warning.id);
  reset.append(warning, keep, erase);

  const credits = element("section", "ui-settings__detail");
  const creditsBack = action("Back to Grown-ups", "back", returnToAdult);
  const creditsHeading = voiceText("h2", "ui-settings__detail-title", "Credits");
  credits.append(creditsHeading, buildCredits(), creditsBack);
  const back = action("Back", "back", () => {
    if (screen === "options") close();
    else returnToAdult();
  });
  back.classList.add("ui-settings__back");
  slab.append(tablist, panels, reset, credits, back);

  const side = element("div", "ui-pause__side");
  const title = voiceText("h1", "ui-pause__status-word", "Settings");
  title.id = `${id}-title`;
  const card = createHudFrame({ corner: "top-left", double: true, accentEdge: true });
  card.classList.add("ui-pause__mission");
  hudFrameContent(card).append(createHudTab({ label: "Changes save by themselves", glyph: "none" }));
  side.append(title, card);
  dialog.append(element("span", "ui-pause__hex"), slab, side);

  function show(next: typeof screen, focus?: HTMLElement): void {
    screen = next;
    tablist.hidden = panels.hidden = back.hidden = next !== "options";
    reset.hidden = next !== "reset";
    credits.hidden = next !== "credits";
    focus?.focus();
  }

  function returnToAdult(): void {
    show("options", screen === "reset" ? resetButton : creditsButton);
  }

  function activate(id: SettingsTab): void {
    hold.cancel();
    active = id;
    for (const tab of tabs) {
      const selected = tab.id === active;
      tab.button.setAttribute("aria-selected", String(selected));
      tab.button.tabIndex = selected ? 0 : -1;
      if (selected) tab.button.setAttribute("autofocus", "");
      else tab.button.removeAttribute("autofocus");
      tab.panel.hidden = !selected;
    }
  }

  function setState(next: SettingsState): void {
    const previous = state;
    state = next;
    for (const update of updates) update(next, previous);
  }

  function change(next: SettingsState): void {
    setState(next);
    callbacks.onChange?.(next);
  }

  function changeVolume(key: VolumeKey, delta: number): void {
    const next = stepSetting(state, key, delta);
    if (next[key] === state[key]) return;
    change(next);
    if (key === "voice") callbacks.onPreview?.("voice");
  }

  function close(): void {
    if (dialog.open) dialog.close();
  }

  function handleInnerBack(event: Event): void {
    if (screen === "options") return;
    event.preventDefault();
    returnToAdult();
  }
  dialog.addEventListener("keydown", event => { if (event.key === "Escape") handleInnerBack(event); });
  dialog.addEventListener("cancel", handleInnerBack);
  dialog.addEventListener("close", () => {
    hold.cancel();
    callbacks.onBack?.();
  });

  show("options");
  activate("sound");
  return {
    dialog, close, setState,
    open(tab: SettingsTab = "sound") {
      if (dialog.open) return;
      hold.reset();
      hold.root.hidden = false;
      adultOptions.hidden = true;
      show("options");
      activate(tab);
      dialog.showModal();
    },
  };
}

export function registerSettingsMenu(registry: UIRegistry): void {
  registry.register("UI-ORGANISM-SETTINGS-MENU", {
    metadata: { layer: "organism", name: "Settings menu", figmaNodeId: "1:12", description: "Three settings sections on the pause slab." },
    variants: { Default: {} },
    parse: () => ({}),
    render: () => {
      const { dialog } = createSettingsMenu(DEFAULT_SETTINGS);
      const box = element("div", "ui-pause-showcase");
      dialog.setAttribute("open", "");
      box.append(dialog);
      return box;
    },
  });
}
