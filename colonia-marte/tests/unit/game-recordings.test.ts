import { existsSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ARCHIVOS, grabacionDe } from "../../src/audio/grabados";
import { estadoTarjeta, type EstadoJuego } from "../../src/game/adaptador";
import { CAPITULOS } from "../../src/game/historia";
import { traducir } from "../../src/game/i18n";
import { cargarIntro } from "../../src/game/intro";
import { partidaDeMision } from "../../src/game/motor";
import { paginateLine } from "../../src/ui/organisms/crew-dialogue";

const IDIOMAS = ["en", "es"] as const;

describe("audios grabados", () => {
  it("cada archivo de la lista existe y no está vacío", () => {
    const todos = [...IDIOMAS.flatMap((i) => Object.values(ARCHIVOS.voz[i])), ...Object.values(ARCHIVOS.musica), ...Object.values(ARCHIVOS.efectos)];
    expect(todos.length).toBe(199);
    for (const archivo of todos) {
      const ruta = `public/audio/${archivo}`;
      expect(existsSync(ruta), ruta).toBe(true);
      expect(statSync(ruta).size, ruta).toBeGreaterThan(1000);
    }
  });

  it("hay voz en los dos idiomas para cada línea y respuesta de la intro y los capítulos", () => {
    const intro = cargarIntro();
    const claves = [
      ...intro.tomas.flatMap((t) => [...t.lineas.map((l) => l.linea), ...(t.decision?.map((r) => r.texto) ?? [])]),
      ...Object.values(intro.despues).flat().map((l) => l.linea),
      ...CAPITULOS.flatMap((c) => c.escenas.flatMap((e) => e.respuestas.map((r) => r.texto))),
    ];
    for (const idioma of IDIOMAS) {
      for (const clave of claves) expect(grabacionDe(traducir(idioma, clave), idioma), `${idioma} ${clave}`).not.toBeNull();
      // El diálogo lee por páginas: cada página necesita su audio.
      for (const { escenas } of CAPITULOS)
        for (const e of escenas)
          for (const pagina of paginateLine(traducir(idioma, e.linea)))
            expect(grabacionDe(pagina, idioma), `${idioma} ${e.id}: ${pagina}`).not.toBeNull();
    }
  });

  it("hay voz para cada tarjeta de capítulo, ganada o perdida por cualquier motivo", () => {
    for (const [indice, { mision, capitulo }] of CAPITULOS.entries()) {
      const base = partidaDeMision(mision, "voz");
      const partidas = [
        base,
        { ...base, resultado: "exito" as const },
        ...(["energia", "soporte_vital", "blindaje"] as const).map((r) => ({ ...base, resultado: "fallo" as const, recursos: { ...base.recursos, [r]: 0 } })),
        { ...base, resultado: "fallo" as const, causas: [{ tick: 1, origen: "sistema" as const, descripcionKey: "causa.limite_radiacion" }] },
        { ...base, resultado: "fallo" as const },
      ];
      for (const partida of partidas) {
        const juego: EstadoJuego = { capitulo, mision, partida, paso: 1, sala: CAPITULOS[indice]!.escenas[0]!.sala };
        for (const idioma of IDIOMAS) {
          const { voiceLine } = estadoTarjeta(juego, idioma);
          expect(grabacionDe(voiceLine, idioma), `${idioma}: ${voiceLine}`).not.toBeNull();
        }
      }
    }
  });
});
