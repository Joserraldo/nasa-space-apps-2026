import { describe, expect, it } from "vitest";
import { estadoDialogo, estadoHud, estadoPausa, estadoTarjeta, type EstadoJuego, type LineaGuion } from "../../src/game/adaptador";
import { dificultadDe, misionPara } from "../../src/game/dificultad";
import { HABLANTES, hablante } from "../../src/game/hablantes";
import { existe } from "../../src/game/i18n";
import { MISION_VIAJE_MARTE, partidaDeMision } from "../../src/game/motor";
import { SALAS, type SalaId } from "../../src/game/salas";
import { parseHudReplyParams } from "../../src/ui/organisms/crew-dialogue";
import { parseHudInteractionParams, parseHudObjectiveParams, parseHudStatusParams, parseHudZoneParams, parseHudMinimapParams } from "../../src/ui/molecules/hud-molecules";
import { DEFAULT_SETTINGS, type SettingsState } from "../../src/ui/state/settings";

const FACIL: SettingsState = { ...DEFAULT_SETTINGS };
const MEDIA: SettingsState = { ...DEFAULT_SETTINGS, difficulty: "medium" };
const IDIOMAS = ["en", "es"] as const;

function juego(ajustes = FACIL, cambios: Partial<EstadoJuego> = {}): EstadoJuego {
  const mision = misionPara(MISION_VIAJE_MARTE, ajustes);
  return { capitulo: 1, mision, partida: partidaDeMision(mision, "prueba"), paso: 1, sala: "nave-puente", ...cambios };
}

/** Todo texto que llega a la vista: ni vacío ni una clave sin traducir. */
function textos(valor: unknown): string[] {
  if (typeof valor === "string") return [valor];
  if (valor && typeof valor === "object") return Object.values(valor).flatMap(textos);
  return [];
}
const sinClaves = (valor: unknown) => {
  for (const texto of textos(valor)) {
    expect(texto.trim()).not.toBe("");
    expect(texto).not.toMatch(/^(juego|mision|causa|componente|agentes)\./);
  }
};

describe("dificultad", () => {
  it("traduce Ajustes a la dificultad del motor sin tocar la misión original", () => {
    expect(dificultadDe(FACIL)).toBe("facil");
    expect(dificultadDe(MEDIA)).toBe("media");
    expect(dificultadDe({ ...FACIL, difficulty: "hard" })).toBe("dificil");
    expect(dificultadDe({ ...FACIL, hardcore: true })).toBe("hardcore");
    expect(misionPara(MISION_VIAJE_MARTE, MEDIA).dificultad).toBe("media");
    expect(MISION_VIAJE_MARTE.dificultad).toBe("facil");
  });
});

describe("HUD", () => {
  it("la vista acepta el estado en cada sala, paso e idioma, con voz en todo (R1)", () => {
    for (const sala of Object.keys(SALAS) as SalaId[])
      for (const paso of MISION_VIAJE_MARTE.pasos)
        for (const idioma of IDIOMAS) {
          const hud = estadoHud(juego(FACIL, { sala, paso: paso.n }), idioma, FACIL);
          expect(parseHudZoneParams(hud.zone)).toEqual(hud.zone);
          expect(parseHudObjectiveParams(hud.objective)).toEqual(hud.objective);
          expect(parseHudStatusParams(hud.status)).toEqual(hud.status);
          expect(parseHudMinimapParams(hud.minimap)).toEqual(hud.minimap);
          expect(parseHudInteractionParams(hud.interaction)).toEqual(hud.interaction);
          sinClaves(hud);
        }
  });

  it("en Easy no hay números (R2) y en Medium sí", () => {
    for (const paso of MISION_VIAJE_MARTE.pasos)
      expect(textos(estadoHud(juego(FACIL, { paso: paso.n }), "es", FACIL)).filter((x) => /\d/.test(x))).toEqual([]);
    const medio = estadoHud(juego(MEDIA, { paso: 2 }), "en", MEDIA);
    expect(medio.objective.step).toBe("Step 2 of 8");
    expect(medio.status.resources![0]!.label).toBe("Power 60");
  });

  it("los medidores salen del motor y avisan cuando quedan poco", () => {
    const base = juego();
    const hud = estadoHud({ ...base, partida: { ...base.partida, recursos: { energia: 20, soporte_vital: 80, blindaje: 25 }, iaBase: "danada" } }, "en", FACIL);
    expect(hud.status.resources!.map((r) => [r.level, r.tone])).toEqual([[0.2, "Warning"], [0.8, "Accent"], [0.25, "Warning"]]);
    expect(hud.status.ringLevel).toBe(0.33);
  });
});

describe("diálogo", () => {
  const escena: LineaGuion = {
    hablante: "vera",
    linea: "mision.viaje.plan.pregunta",
    respuestas: [
      { id: "refugio", texto: "mision.viaje.plan.refugio", icono: "home" },
      { id: "escudo", texto: "mision.viaje.plan.escudo", icono: "shield" },
    ],
  };

  it("sale en los dos idiomas, con voz en la línea y en cada respuesta", () => {
    const es = estadoDialogo(escena, "es");
    expect(es.speaker.role).toBe("Experta del Sol");
    expect(es.voiceLine).toBe(es.line);
    for (const r of es.replies) expect(parseHudReplyParams(r)).toEqual({ glyph: r.glyph, label: r.label, voiceLine: r.voiceLine });
    sinClaves([es, estadoDialogo(escena, "en")]);
  });

  it("de 1 a 3 respuestas (R6)", () => {
    const cinco = { ...escena, respuestas: Array.from({ length: 5 }, (_, i) => ({ ...escena.respuestas[0]!, id: `r${i}` })) };
    expect(estadoDialogo(cinco, "en").replies).toHaveLength(3);
    expect(() => estadoDialogo({ ...escena, respuestas: [] }, "en")).toThrow();
  });

  it("cada hablante tiene nombre, rol y retrato", () => {
    for (const id of HABLANTES)
      for (const idioma of IDIOMAS) {
        const h = hablante(id, idioma);
        expect(h.portrait).toMatch(/^(\/ui\/portraits\/|data:image\/svg)/);
        sinClaves([h.name, h.role]);
      }
  });
});

describe("pausa y tarjeta de capítulo", () => {
  it("tres opciones, capítulo y objetivo en el idioma elegido", () => {
    const pausa = estadoPausa(juego(), "es");
    expect(pausa.items.map((i) => i.id)).toEqual(["resume", "settings", "menu"]);
    expect(pausa.chapter).toBe("Capítulo 1: El viaje");
    sinClaves(pausa);
  });

  it("la tarjeta cambia con el resultado de la partida", () => {
    for (const [resultado, accion] of [["en_curso", "empezar"], ["exito", "seguir"], ["fallo", "repetir"]] as const)
      for (const capitulo of [1, 2])
        for (const idioma of IDIOMAS) {
          const base = juego(FACIL, { capitulo });
          const tarjeta = estadoTarjeta({ ...base, partida: { ...base.partida, resultado } }, idioma);
          expect(tarjeta.accion.id).toBe(accion);
          sinClaves(tarjeta);
        }
  });

  it("cada sala tiene sus textos", () => {
    for (const sala of Object.values(SALAS))
      for (const clave of [sala.nombre, sala.area, sala.objeto]) for (const idioma of IDIOMAS) expect(existe(clave, idioma), clave).toBe(true);
  });
});
