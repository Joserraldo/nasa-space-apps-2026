import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Dialogo } from "@solar-shield/agents";
import { IdiomaContext } from "../i18n.js";
import { Burbuja } from "./Dialogos.js";

const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}]/u;
const html = (d: Dialogo) => renderToStaticMarkup(<IdiomaContext.Provider value="en"><Burbuja d={d} /></IdiomaContext.Provider>);
const dialogo = (experto: string): Dialogo => ({ experto, lineas: [{ clave: "ui.continuar" }], prioridad: "normal" } as unknown as Dialogo);

describe("Burbuja sin emojis (E7, PLAN-JUGABILIDAD #19)", () => {
  it("el código de Dialogos.tsx no tiene emojis", () => {
    expect(readFileSync(new URL("./Dialogos.tsx", import.meta.url), "utf8")).not.toMatch(EMOJI);
  });

  it("quien habla lleva su retrato; quien no es de la tripulación, un icono; nunca un emoji", () => {
    for (const experto of ["ingeniera", "doctora", "meteorologa", "ia_base", "control_mision", "matematico"]) {
      const h = html(dialogo(experto));
      expect(h).not.toMatch(EMOJI);
      expect(h).toMatch(/<(svg|img)\b/);
    }
  });
});
