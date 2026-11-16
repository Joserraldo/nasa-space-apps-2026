import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { tarjetasCienciaFinal } from "@solar-shield/data";
import { partidaDorada } from "@solar-shield/engine";
import { IdiomaContext, type Idioma } from "../i18n.js";
import { PantallaFinal } from "./PantallaFinal.js";
import { MedicionMarte } from "./PantallaTormenta.js";

const html = (el: ReactElement, idioma: Idioma = "en") => renderToStaticMarkup(<IdiomaContext.Provider value={idioma}>{el}</IdiomaContext.Provider>);

/** #137: datos de NASA que ya estaban en data/ y ninguna pantalla mostraba. */
describe("datos de NASA en pantalla (#137)", () => {
  it("el final muestra los estudios reales de OSDR y la CSA, cada uno con su fuente, y el crédito de la CSA", () => {
    const h = html(<PantallaFinal estado={partidaDorada()} onOtra={() => undefined} />);
    expect(h).toContain("Real space research");
    expect(h.match(/final-estudio/g)?.length).toBe(tarjetasCienciaFinal().length);
    expect(h).toContain("© Canadian Space Agency");
    expect(h).toContain("osdr.nasa.gov/bio/repo/data/studies/OSD-772");
    expect(html(<PantallaFinal estado={partidaDorada()} onOtra={() => undefined} />, "es")).toContain("Investigación espacial real");
  });

  it("la tormenta de la ruta dorada muestra la medición real de RAD en Marte", () => {
    const h = html(<MedicionMarte estado={partidaDorada()} />);
    expect(h).toMatch(/\d/);
    expect(h).toContain("tormenta-medicion");
  });

  it("sin medición en Marte no se inventa nada", () => {
    const s = partidaDorada();
    expect(html(<MedicionMarte estado={{ ...s, tormenta: null }} />)).toBe("");
  });
});
