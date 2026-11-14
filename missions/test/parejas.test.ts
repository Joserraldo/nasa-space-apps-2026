/**
 * Misión 1 (#88 §3): las 10 parejas de módulos con la semilla dorada, hasta que pasa la tormenta.
 * Comprueba que ninguna pareja "gana gratis" y que ninguna domina a todas las demás.
 *
 * Vive en missions/test/ (fuera de src/) porque usa el motor: missions no puede depender de engine
 * en su código, ya que engine importa missions. Si el motor cambia la API de la semilla dorada,
 * avisar a diseño (Santiago, Camilo).
 */
import { describe, expect, it } from "vitest";
import type { GameState, Resource } from "@solar-shield/contracts";
import { partidaDorada, paso, tormentaActiva } from "@solar-shield/engine";
import { MISION_JEZERO } from "@solar-shield/missions";

const RECURSOS: readonly Resource[] = ["energia", "soporte_vital", "blindaje"];
/** Ticks que se juegan después de que la tormenta se activa (paso 5 → paso 6). */
const TICKS_TORMENTA = 3;

function jugar(a: (typeof MISION_JEZERO.modulosDisponibles)[number], b: typeof a): GameState {
  let s = partidaDorada();
  s = paso(s, { tipo: "colocar_modulo", modulo: a });
  s = paso(s, { tipo: "colocar_modulo", modulo: b });
  let guarda = 0;
  while (!tormentaActiva(s) && guarda++ < 20) s = paso(s);
  for (let i = 0; i < TICKS_TORMENTA; i++) s = paso(s);
  return s;
}

const mods = MISION_JEZERO.modulosDisponibles;
const parejas: [string, GameState][] = [];
for (let i = 0; i < mods.length; i++)
  for (let j = i + 1; j < mods.length; j++) parejas.push([`${mods[i]}+${mods[j]}`, jugar(mods[i]!, mods[j]!)]);

describe("misión 1: las 10 parejas de módulos (semilla dorada, tormenta del 20 may 2024)", () => {
  const inicio = partidaDorada().recursos;

  it("hay exactamente 10 parejas y todas llegan a la tormenta", () => {
    expect(parejas).toHaveLength(10);
    for (const [, s] of parejas) expect(s.tick).toBeGreaterThanOrEqual(MISION_JEZERO.tickTormenta);
  });

  it("ninguna pareja gana gratis: con cada una, al menos un medidor termina por debajo del inicio", () => {
    for (const [nombre, s] of parejas) {
      expect(RECURSOS.some((r) => s.recursos[r] < inicio[r]), nombre).toBe(true);
    }
  });

  it("ninguna pareja es la mejor en los tres medidores a la vez", () => {
    for (const [nombre, s] of parejas) {
      const dominaATodas = parejas.every(
        ([otra, t]) => otra === nombre || RECURSOS.every((r) => s.recursos[r] >= t.recursos[r]),
      );
      expect(dominaATodas, nombre).toBe(false);
    }
  });

  it("no todas las parejas dan el mismo resultado (la elección importa)", () => {
    const distintos = new Set(parejas.map(([, s]) => RECURSOS.map((r) => s.recursos[r]).join(",")));
    expect(distintos.size).toBeGreaterThan(1);
  });
});
