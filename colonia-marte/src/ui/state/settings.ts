export type Level = 0 | 1 | 2 | 3 | 4;

export interface SettingsState {
  music: Level;
  voice: Level;
  sound: Level;
  difficulty: "easy" | "medium" | "hard";
  hardcore: boolean;
  bigText: boolean;
  joystickSide: "left" | "right";
}

export type VolumeKey = "music" | "voice" | "sound";
export const SETTINGS_KEY = "colonia.settings.v1";
const PROGRESS_PREFIX = "colonia.progress.";

export const DEFAULT_SETTINGS: Readonly<SettingsState> = Object.freeze({
  music: 3, voice: 4, sound: 3, difficulty: "easy", hardcore: false, bigText: false, joystickSide: "left",
});

export function effectiveDifficulty(state: SettingsState): SettingsState["difficulty"] | "hardcore" {
  return state.hardcore ? "hardcore" : state.difficulty;
}

export function stepSetting(state: SettingsState, key: VolumeKey, delta: number): SettingsState {
  const level = state[key] + (Number.isFinite(delta) ? Math.trunc(delta) : 0);
  return setSetting(state, key, Math.min(4, Math.max(0, level)));
}

export function setSetting(state: SettingsState, key: keyof SettingsState, value: unknown): SettingsState {
  switch (key) {
    case "music":
    case "voice":
    case "sound":
      if (typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 4) return { ...state, [key]: value as Level };
      break;
    case "difficulty":
      if (value === "easy" || value === "medium" || value === "hard") return { ...state, difficulty: value };
      break;
    case "joystickSide":
      if (value === "left" || value === "right") return { ...state, joystickSide: value };
      break;
    case "hardcore":
    case "bigText":
      if (typeof value === "boolean") return { ...state, [key]: value };
  }
  return { ...state };
}

export function loadSettings(storage: Storage): SettingsState {
  const defaults = { ...DEFAULT_SETTINGS };
  try {
    const data: unknown = JSON.parse(storage.getItem(SETTINGS_KEY) ?? "null");
    if (!data || typeof data !== "object" || Array.isArray(data)) return defaults;
    const record = data as Record<string, unknown>;
    return (Object.keys(defaults) as (keyof SettingsState)[])
      .reduce((state, key) => setSetting(state, key, record[key]), defaults);
  } catch {
    return defaults;
  }
}

export function saveSettings(storage: Storage, state: SettingsState): void {
  storage.setItem(SETTINGS_KEY, JSON.stringify(state));
}

export function resetProgress(storage: Storage): void {
  for (let index = storage.length - 1; index >= 0; index--) {
    const key = storage.key(index);
    if (key?.startsWith(PROGRESS_PREFIX)) storage.removeItem(key);
  }
}
