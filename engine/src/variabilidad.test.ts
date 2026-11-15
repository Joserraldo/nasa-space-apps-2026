/**
 * P3 (ORQUESTACION, puerta del dom 11:00): dos semillas dan escenarios distintos y con las dos se
 * puede ganar y perder. Solo la API pública del motor, sin tocar recursos a mano ni forzar resultados.
 * Las estrategias no son de balance (eso es de design/): solo muestran que el resultado depende de
 * las decisiones del jugador en cualquier semilla.
 */
import { describe, expect, it } from "vitest";
import type { GameState } from "@solar-shield/contracts";
import { eventosCurados } from "@solar-shield/data";
import { MISION_JEZERO } from "@solar-shield/missions";
import { aplicarAccion, aterrizar, avanzarTick } from "./acciones.js";
import { partidaDeMision, SEMILLA_DORADA, tormentaActiva } from "./dorada.js";
import { crearPartida } from "./escenario.js";

const m = MISION_JEZERO;
/** La dorada, una que cambia todo el escenario libre y otra que cambia la suerte dentro de la misión. */
const SEMILLAS = [SEMILLA_DORADA, "olympus-7", "valles-3"] as const;

type Plan = "cuidar" | "descuidar";

/**
 * Misma preparación para las dos: aterrizar, panel y escudo. En la tormenta, "cuidar" se refugia y
 * avisa a la Tierra; "descuidar" sube el escudo y después sale cada turno al exterior sin protegerse.
 */
function jugar(semilla: string, plan: Plan): { final: GameState; traza: string[] } {
  let s = aterrizar(partidaDeMision(m, semilla), "llanura-central", m);
  s = aplicarAccion(s, { tipo: "colocar_modulo", modulo: "panel_solar" }, m);
  s = aplicarAccion(s, { tipo: "colocar_modulo", modulo: "escudo" }, m);
  const traza: string[] = [];
  let guarda = 0;
  while (!tormentaActiva(s, m) && s.resultado === "en_curso" && guarda++ < 20) s = avanzarTick(s, m);
  if (plan === "cuidar") {
    s = aplicarAccion(s, { tipo: "refugiarse" }, m);
    s = aplicarAccion(s, { tipo: "enviar_telemetria" }, m);
  } else {
    s = aplicarAccion(s, { tipo: "subir_escudo", nivel: 2 }, m);
  }
  guarda = 0;
  while (s.resultado === "en_curso" && guarda++ < 40) {
    if (plan === "descuidar") s = aplicarAccion(s, { tipo: "salida_exterior", objetivo: "panel_solar" }, m);
    s = avanzarTick(s, m);
    traza.push(`${s.tick}:${s.recursos.energia}/${s.recursos.soporte_vital}/${s.recursos.blindaje}`);
  }
  return { final: s, traza };
}

describe("variabilidad (P3): semillas distintas, escenarios distintos, las dos se ganan y se pierden", () => {
  it("con el catálogo curado, cada semilla arma otro escenario (sitio, objetivo, tormenta, avería u órbita)", () => {
    const [a, b] = [SEMILLAS[0], SEMILLAS[1]].map((x) => crearPartida(x, { tormentas: eventosCurados }));
    const rasgo = (s: GameState) => ({
      sitio: s.sitio,
      objetivo: s.objetivo,
      tormenta: s.tormenta?.id,
      averia: Object.entries(s.equipos).find(([, e]) => e === "averiado")?.[0],
      orbita: s.orbita?.alturaKm,
    });
    const ra = rasgo(a!), rb = rasgo(b!);
    const distintos = (Object.keys(ra) as (keyof typeof ra)[]).filter((k) => ra[k] !== rb[k]);
    expect(distintos.length, JSON.stringify({ ra, rb })).toBeGreaterThanOrEqual(4);
  });

  it("en la misma misión, la semilla cambia lo que pasa (mala suerte y tripulación), no las reglas", () => {
    const [a, b] = [SEMILLAS[0], SEMILLAS[2]].map((x) => partidaDeMision(m, x));
    expect(a!.sitio).toBe(b!.sitio);
    expect(a!.tormenta?.id).toBe(b!.tormenta?.id);
    expect(a!.tripulacion.map((t) => t.sesgo)).not.toEqual(b!.tripulacion.map((t) => t.sesgo));
    expect(jugar(SEMILLAS[0], "descuidar").traza).not.toEqual(jugar(SEMILLAS[2], "descuidar").traza);
  });

  for (const semilla of SEMILLAS) {
    it(`semilla "${semilla}": cuidar a la tripulación gana; descuidarla pierde`, () => {
      const gana = jugar(semilla, "cuidar");
      const pierde = jugar(semilla, "descuidar");
      expect(gana.final.resultado, gana.traza.join(" ")).toBe("exito");
      expect(pierde.final.resultado, pierde.traza.join(" ")).toBe("fallo");
    });
  }

  it("misma semilla y mismas decisiones: misma partida", () => {
    for (const semilla of SEMILLAS) expect(jugar(semilla, "cuidar").final).toEqual(jugar(semilla, "cuidar").final);
  });
});
