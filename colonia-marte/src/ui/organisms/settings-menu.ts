import { createHudFrame, createHudGlyph, createHudTab, hudFrameContent, voiceText, type UIHudGlyph } from "../atoms/hud-atoms";
import { CREDITS } from "../content/credits";
import { getUiStrings, uiText, type UIStrings } from "../i18n";
import { createHudChoice, type HudChoiceOption } from "../molecules/hud-choice";
import { createHudHoldGate } from "../molecules/hud-hold-gate";
import { createHudStepper } from "../molecules/hud-stepper";
import type { UIRegistry } from "../registry";
import { DEFAULT_SETTINGS, setSetting, stepSetting, type SettingsState, type VolumeKey } from "../state/settings";
import { createHudReply, type UIHudReplyParams } from "./crew-dialogue";

const TABS = [
  { id: "sound", key: "sonido", glyph: "sound" },
  { id: "play", key: "jugar", glyph: "play" },
  { id: "grownups", key: "adultos", glyph: "shield" },
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

function buildCredits(text: ReturnType<typeof uiText>): HTMLElement {
  const content = element("div", "ui-settings__credits");
  for (const { sources, license, details } of CREDITS) {
    const entry = element("section", "ui-settings__credit");
    for (const { title, author, url } of sources) {
      const link = voiceText("a", "ui-settings__credit-source", text("componente.ajustes.creditos.autor", { title, author }));
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener";
      entry.append(link);
    }
    for (const [index, line] of [license, ...details].entries()) {
      const paragraph = voiceText("p", index === 0 ? "ui-settings__license" : "", line);
      paragraph.setAttribute("lang", "en");
      entry.append(paragraph);
    }
    content.append(entry);
  }
  return content;
}

export function createSettingsMenu(initial: SettingsState, callbacks: SettingsCallbacks = {}, strings: UIStrings = getUiStrings(initial.language)) {
  const text = uiText(strings);
  const label = (key: string) => text(`componente.ajustes.${key}`);
  const onOff = [{ value: false, label: label("no") }, { value: true, label: label("si") }] as const;
  let state = initial;
  let active: SettingsTab = "sound";
  let screen: "options" | "reset" | "credits" = "options";
  const id = `ui-settings-${++nextId}`;
  const dialog = element("dialog", "ui-pause ui-settings");
  dialog.setAttribute("aria-labelledby", `${id}-title`);
  const slab = element("div", "ui-pause__slab ui-settings__slab");
  const tablist = element("div", "ui-settings__tabs");
  tablist.setAttribute("role", "tablist");
  tablist.setAttribute("aria-label", label("secciones"));
  const panels = element("div", "ui-settings__panels");
  const updates: ((next: SettingsState, previous: SettingsState) => void)[] = [];

  const tabs = TABS.map(tab => {
    const button = action(label(tab.key), tab.glyph, () => activate(tab.id));
    const glyph = button.querySelector<HTMLElement>(".ui-hud-reply__glyph");
    const check = createHudGlyph("check", "ui-hud-reply__glyph ui-settings__check");
    button.prepend(check);
    button.id = `${id}-${tab.id}-tab`;
    button.setAttribute("role", "tab");
    const panel = element("section", "ui-settings__panel");
    panel.id = `${id}-${tab.id}-panel`;
    button.setAttribute("aria-controls", panel.id);
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", button.id);
    tablist.append(button);
    panels.append(panel);
    return { ...tab, button, panel, glyph, check };
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

  const volumeRows = [["music", "musica", "music"], ["voice", "voces", "voice"], ["sound", "efectos", "sound"]] as const;
  for (const [key, name, glyph] of volumeRows) {
    const stepper = createHudStepper({ label: label(name), glyph, level: state[key], onStep: delta => changeVolume(key, delta), strings });
    updates.push((next, previous) => { if (next[key] !== previous[key]) stepper.setLevel(next[key]); });
    sound.panel.append(stepper.root);
  }

  function choice<K extends "difficulty" | "bigText" | "joystickSide" | "hardcore" | "language">(
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
    choice("difficulty", label("reto"), "objective", [
      { value: "easy", label: label("facil"), voiceLine: label("facil.voz") },
      { value: "medium", label: label("media"), voiceLine: label("media.voz") },
      { value: "hard", label: label("dificil"), voiceLine: label("dificil.voz") },
    ]),
    choice("bigText", label("textoGrande"), "text", onOff),
    choice("language", label("idioma"), "voice", [
      { value: "en", label: label("idioma.en") }, { value: "es", label: label("idioma.es") },
    ]),
  );

  const adultOptions = element("div", "ui-settings__options");
  adultOptions.hidden = true;
  const hardcore = choice("hardcore", label("hardcore"), "battery", onOff);
  const joystick = choice("joystickSide", label("joystick"), "tap", [
    { value: "left", label: label("izquierda") }, { value: "right", label: label("derecha") },
  ]);
  const hold = createHudHoldGate(() => {
    hold.root.hidden = true;
    adultOptions.hidden = false;
    hardcore.querySelector<HTMLButtonElement>("button")?.focus();
  }, strings);
  const resetButton = action(label("reiniciar"), "home", () => show("reset", keep));
  const creditsButton = action(label("creditos"), "iris", () => show("credits", creditsBack));
  for (const button of [resetButton, creditsButton]) button.classList.add("ui-settings__row");
  adultOptions.append(hardcore, joystick, resetButton, creditsButton);
  adult.panel.append(hold.root, adultOptions);

  const reset = element("section", "ui-settings__detail");
  const keep = action(label("conservar"), "back", returnToAdult);
  const erase = action(label("borrar"), "none", () => {
    callbacks.onResetProgress?.();
    returnToAdult();
  });
  const warning = voiceText("h2", "ui-settings__detail-title", label("reiniciar.pregunta"));
  warning.id = `${id}-reset-title`;
  keep.setAttribute("aria-describedby", warning.id);
  erase.setAttribute("aria-describedby", warning.id);
  reset.append(warning, keep, erase);

  const credits = element("section", "ui-settings__detail");
  const creditsBack = action(label("creditos.volver"), "back", returnToAdult);
  const creditsHeading = voiceText("h2", "ui-settings__detail-title", label("creditos"));
  credits.append(creditsHeading, buildCredits(text), creditsBack);
  const back = action(label("volver"), "back", () => {
    if (screen === "options") close();
    else returnToAdult();
  });
  back.classList.add("ui-settings__back");
  slab.append(tablist, panels, reset, credits, back);

  const side = element("div", "ui-pause__side");
  const title = voiceText("h1", "ui-pause__status-word", label("titulo"));
  title.id = `${id}-title`;
  const card = createHudFrame({ corner: "top-left", double: true, accentEdge: true });
  card.classList.add("ui-pause__mission");
  hudFrameContent(card).append(createHudTab({ label: label("guardado"), glyph: "none" }));
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
      tab.check.hidden = !selected;
      if (tab.glyph) tab.glyph.hidden = selected;
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
