import { describe, expect, it } from "vitest";
import { interactivoCercano, PUERTA_HABITAT } from "./escena3d";
import { destinoInterior, verboInterior } from "./InteriorBase";
import { lugar } from "./mundo";

describe("habitat airlock door", () => {
  it("offers to go in from in front of the step", () => {
    expect(interactivoCercano(PUERTA_HABITAT.x, PUERTA_HABITAT.z)).toEqual({ tipo: "puerta", sala: "habitat", entrar: true });
  });

  it("gives the doctor's spot back one step away from the door", () => {
    const h = lugar("habitat");
    expect(interactivoCercano(h.x, h.z)?.tipo).not.toBe("puerta");
  });

  it("is reachable: in front of the step, not inside the building", () => {
    const h = lugar("habitat");
    expect(PUERTA_HABITAT.z).toBeGreaterThan(h.mz + 2.9);
  });
});

describe("verboInterior", () => {
  it("words the hint like the outdoor HUD", () => {
    expect(verboInterior(null)).toBeNull();
    expect(verboInterior("puerta:base")).toBe("ui.interaccion.salir");
    expect(verboInterior("puerta:taller")).toBe("ui.interaccion.entrar");
    expect(verboInterior("cultivoVeggie")).toBe("ui.interaccion.usar");
  });

  it("names the room behind a door, nothing for furniture", () => {
    expect(destinoInterior("puerta:invernadero")).toBe("ui.interior.sala.invernadero");
    expect(destinoInterior("mesaMapa")).toBeNull();
    expect(destinoInterior(null)).toBeNull();
  });
});
