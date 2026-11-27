import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { en } from "../../src/ui/i18n/strings.en";
import { es } from "../../src/ui/i18n/strings.es";
import { getUiStrings, uiText } from "../../src/ui/i18n";
import { CANTEEN_HUD_ES, PAUSE_STATE_ES } from "../../src/ui/content/preview-es";
import { createGameHud } from "../../src/ui/organisms/game-hud";
import { createPauseMenu } from "../../src/ui/organisms/pause-menu";
import { createSettingsMenu } from "../../src/ui/organisms/settings-menu";
import { createMainMenu } from "../../src/ui/organisms/main-menu";
import { createLoading } from "../../src/ui/organisms/loading";
import { loadSettings, saveSettings, setSetting, SETTINGS_KEY } from "../../src/ui/state/settings";
import { installDomShim } from "./helpers/dom-shim";

describe("Santiago's component text contract", () => {
  it("matches every published key and both language values exactly", () => {
    const doc = readFileSync(new URL("../../docs/CLAVES-UI-santiago.md", import.meta.url), "utf8");
    const rows = [...doc.matchAll(/^\| `(componente\.[^`]+)` \| ([^|]+?) \| ([^|]+?) \|/gm)];
    expect(rows).toHaveLength(57);
    expect(en).toEqual(Object.fromEntries(rows.map(([, key, english]) => [key, english.trim()])));
    expect(es).toEqual(Object.fromEntries(rows.map(([, key, , spanish]) => [key, spanish.trim()])));
  });

  it("uses the supplied dictionary, then English, and fills all named values", () => {
    const text = uiText({ "componente.ajustes.nivel": "{value} sobre 4" });
    expect(text("componente.ajustes.nivel", { value: 3 })).toBe("3 sobre 4");
    expect(text("componente.ajustes.volver")).toBe("Back");
    expect(uiText(getUiStrings("es"))("componente.hud.estado", { name: "Iris" })).toBe("Estado de Iris");
    expect(uiText(getUiStrings("es"))("componente.ajustes.creditos.autor", { title: "Atlas", author: "Ana" }))
      .toBe("Atlas, de Ana");
  });

  it("round-trips language and renders Spanish copy instead of English chrome", () => {
    installDomShim();
    const values = new Map([[SETTINGS_KEY, '{"bigText":true}']]);
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); },
    } as Storage;
    const old = loadSettings(storage);
    expect(old.language).toBe("en");
    expect(setSetting(old, "language", "fr").language).toBe("en");
    saveSettings(storage, setSetting(old, "language", "es"));
    const state = loadSettings(storage);
    expect(state).toMatchObject({ language: "es", bigText: true });

    const strings = getUiStrings(state.language);
    const hud = createGameHud(CANTEEN_HUD_ES, undefined, undefined, strings);
    const roots = [
      hud.layer,
      createPauseMenu(PAUSE_STATE_ES, undefined, strings).dialog,
      createSettingsMenu(state, {}, strings).dialog,
      createMainMenu("C2", {}, strings).dialog,
      createLoading("Un día marciano dura casi 25 horas.", undefined, strings).root,
    ];
    const copy = roots.map(root => root.textContent).join("\n");
    for (const label of ["Objetivo", "Opciones", "Idioma", "Continuar", "Cargando"]) expect(copy).toContain(label);
    expect(copy).not.toMatch(/\b(?:Objective|Options|Language|Continue|Loading)\b/);
    expect(hud.layer.querySelector(".ui-hud-pause")?.getAttribute("aria-label")).toBe("Pausa");
  });
});
