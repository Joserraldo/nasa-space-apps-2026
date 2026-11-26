import { describe, expect, it } from "vitest";
import { cargar, CLAVE_PARTIDA, guardar } from "../../src/game/guardado";
import { continuar, decidirEnIntro, empezarCapitulo, escenaActual, nuevoJuego, responder, vistaDe, type Juego, type Plan } from "../../src/game/flujo";
import { estadoDialogo, estadoHud, estadoPausa, estadoTarjeta } from "../../src/game/adaptador";
import { DEFAULT_SETTINGS, resetProgress, type SettingsState } from "../../src/ui/state/settings";

const AJUSTES: Record<string, SettingsState> = { facil: DEFAULT_SETTINGS, media: { ...DEFAULT_SETTINGS, difficulty: "medium" } };

interface Ruta { final: Juego; elegidas: string[] }

/** Recorre todas las decisiones posibles de un capítulo. */
function rutas(inicio: Juego): Ruta[] {
  const fin: Ruta[] = [];
  const seguir = (juego: Juego, elegidas: string[]) => {
    if (juego.fase !== "escena") { fin.push({ final: juego, elegidas }); return; }
    expect(elegidas.length, "el capítulo no termina").toBeLessThan(30);
    const escena = escenaActual(juego);
    expect(escena.respuestas.length).toBeGreaterThan(0);
    for (const r of escena.respuestas) {
      const paso = responder(juego, r.id);
      expect(paso.rechazada, `${escena.id} ${r.id}`).toBe(false);
      seguir(paso.juego, [...elegidas, `${escena.id}:${r.id}`]);
    }
  };
  seguir(empezarCapitulo(inicio), []);
  return fin;
}

const ganadas = (lista: Ruta[]) => lista.filter((r) => r.final.partida.resultado === "exito").length / lista.length;

function enCapitulo2(ajustes: SettingsState): Juego {
  const c1 = rutas(decidirEnIntro(nuevoJuego(ajustes), "refugio")).find((r) => r.final.partida.resultado === "exito")!;
  return continuar(c1.final, ajustes);
}

describe("flujo del juego", () => {
  it("empieza en la intro, la decisión lleva a la tarjeta y C1 no vuelve a preguntar el plan", () => {
    const juego = nuevoJuego(DEFAULT_SETTINGS);
    expect(juego.fase).toBe("intro");
    const tarjeta = decidirEnIntro(juego, "escudo");
    expect(tarjeta.fase).toBe("tarjeta");
    for (const r of rutas(tarjeta)) expect(r.elegidas.some((e) => e.startsWith("c1-plan:"))).toBe(false);
  });

  for (const dificultad of ["facil", "media"] as const) {
    for (const plan of ["refugio", "escudo"] as Plan[])
      it(`C1 en ${dificultad} con ${plan}: todas las rutas terminan y varias ganan`, () => {
        const lista = rutas(decidirEnIntro(nuevoJuego(AJUSTES[dificultad]!), plan));
        expect(lista.every((r) => r.final.fase === "resultado")).toBe(true);
        expect(ganadas(lista)).toBeGreaterThan(0.15);
        expect(ganadas(lista)).toBeLessThan(1);
      });

    it(`C2 en ${dificultad}: todas las rutas terminan, hay forma de ganar y aguantar pierde`, () => {
      const lista = rutas(enCapitulo2(AJUSTES[dificultad]!));
      expect(lista.every((r) => r.final.fase === "resultado")).toBe(true);
      expect(ganadas(lista)).toBeGreaterThan(0.15);
      expect(ganadas(lista.filter((r) => r.elegidas.includes("c2-dilema:aguantar")))).toBeLessThan(0.1);
    });
  }

  it("al ganar pasa al capítulo siguiente y al final termina; al perder se repite con otra semilla", () => {
    const c2 = enCapitulo2(DEFAULT_SETTINGS);
    expect(c2).toMatchObject({ fase: "tarjeta", capitulo: 1, intento: 0, plan: null });
    const lista = rutas(c2);
    const exito = lista.find((r) => r.final.partida.resultado === "exito")!.final;
    expect(continuar(exito, DEFAULT_SETTINGS).fase).toBe("terminado");
    const fallo = lista.find((r) => r.final.partida.resultado === "fallo")!.final;
    const otra = continuar(fallo, DEFAULT_SETTINGS);
    expect(otra).toMatchObject({ fase: "tarjeta", capitulo: 1, intento: 1 });
    expect(otra.partida.seed).not.toBe(fallo.partida.seed);
  });

  it("si se salta el plan, C1 lo pregunta", () => {
    const juego = empezarCapitulo({ ...nuevoJuego(DEFAULT_SETTINGS), fase: "tarjeta" });
    const a = responder(responder(juego, "ok").juego, "ok").juego;
    expect(escenaActual(a).id).toBe("c1-plan");
    expect(responder(a, "escudo").juego.plan).toBe("escudo");
  });

  it("una respuesta que no existe no cambia nada", () => {
    const juego = empezarCapitulo(decidirEnIntro(nuevoJuego(DEFAULT_SETTINGS), "refugio"));
    const paso = responder(juego, "no-existe");
    expect(paso).toMatchObject({ rechazada: true, sonidos: ["rechazada"] });
    expect(paso.juego).toBe(juego);
  });

  it("el adaptador pinta cada escena de una partida completa", () => {
    let juego = empezarCapitulo(decidirEnIntro(nuevoJuego(DEFAULT_SETTINGS), "refugio"));
    while (juego.fase === "escena") {
      estadoHud(vistaDe(juego), "es", DEFAULT_SETTINGS);
      estadoPausa(vistaDe(juego), "es");
      const escena = escenaActual(juego);
      estadoDialogo(escena, "es");
      juego = responder(juego, escena.respuestas[0]!.id).juego;
    }
    expect(estadoTarjeta(vistaDe(juego), "es").tipo).not.toBe("inicio");
  });
});

describe("guardado", () => {
  function almacen() {
    const datos = new Map<string, string>();
    return {
      datos,
      getItem: (k: string) => datos.get(k) ?? null,
      setItem: (k: string, v: string) => void datos.set(k, v),
      removeItem: (k: string) => void datos.delete(k),
      key: (i: number) => [...datos.keys()][i] ?? null,
      get length() { return datos.size; },
      clear: () => datos.clear(),
    };
  }

  it("guarda y recupera la partida, pero no la intro", () => {
    const a = almacen();
    guardar(a, nuevoJuego(DEFAULT_SETTINGS));
    expect(cargar(a)).toBeNull();
    const juego = empezarCapitulo(decidirEnIntro(nuevoJuego(DEFAULT_SETTINGS), "refugio"));
    guardar(a, juego);
    expect(cargar(a)).toEqual(juego);
    resetProgress(a);
    expect(cargar(a)).toBeNull();
  });

  it("descarta datos rotos", () => {
    const a = almacen();
    for (const malo of ["{", "null", '{"version":2}', '{"version":1,"fase":"escena","capitulo":9}']) {
      a.setItem(CLAVE_PARTIDA, malo);
      expect(cargar(a), malo).toBeNull();
    }
    const juego = empezarCapitulo(decidirEnIntro(nuevoJuego(DEFAULT_SETTINGS), "refugio"));
    a.setItem(CLAVE_PARTIDA, JSON.stringify({ ...juego, partida: { ...juego.partida, tick: -1 } }));
    expect(cargar(a)).toBeNull();
  });
});
