import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { partidaDorada } from "@solar-shield/engine";
import { armarEscena } from "./armado";
import { DISTANCIA_HABLAR, interactivoCercano, solidosBase } from "./escena3d";
import { crearMateriales } from "./materiales";
import { crearMovimiento } from "./movimientoBase";
import { ANCLAJES_EXPERTAS, DOCK_IRIS, lugar } from "./mundo";
import { EXPERTAS_BASE } from "./tripulacionBase";
import { vistaEscena } from "./vista";

describe("las tres expertas en sus estaciones (A6)", () => {
  it("la Ingeniera, la Doctora y la Meteoróloga están en sus anclajes y se vuelven hacia el niño al acercarse", () => {
    const a = armarEscena(crearMateriales(), null);
    const t = a.tripulacion;
    a.aplicarVista(vistaEscena(partidaDorada(), { fase: "base", colocados: [] }));
    for (const id of EXPERTAS_BASE) {
      const g = t.expertas[id].grupo;
      expect(g.parent, id).toBe(t.grupo);
      expect(g.position.x, id).toBe(ANCLAJES_EXPERTAS[id].x);
      expect(g.position.z, id).toBe(ANCLAJES_EXPERTAS[id].z);
      // Con el niño al lado, la experta gira hacia él.
      const anc = ANCLAJES_EXPERTAS[id];
      t.jugador.grupo.position.set(anc.x + 1.5, 0, anc.z + 1.5);
      for (let ms = 0; ms <= 3000; ms += 50) a.animar(1000 + ms, false);
      const haciaNino = Math.atan2(1.5, 1.5);
      const diferencia = Math.atan2(Math.sin(g.rotation.y - haciaNino), Math.cos(g.rotation.y - haciaNino));
      expect(Math.abs(diferencia), id).toBeLessThan(0.05);
    }
    a.liberar();
  });

  it("los cuatro cascos son un solo InstancedMesh que sigue a cada cabeza, y en primera persona el del niño desaparece", () => {
    const a = armarEscena(crearMateriales(), null);
    const t = a.tripulacion;
    const cascos = t.grupo.getObjectByName("Cascos_Instanciados") as THREE.InstancedMesh;
    expect(cascos).toBeInstanceOf(THREE.InstancedMesh);
    expect(cascos.count).toBe(4);
    for (const pj of [t.jugador, t.ingeniera, t.doctora, t.meteorologa]) expect(pj.grupo.getObjectByName("casco")!.visible).toBe(false);
    a.animar(500, false);
    const m = new THREE.Matrix4();
    const p = new THREE.Vector3();
    cascos.getMatrixAt(1, m);
    p.setFromMatrixPosition(m);
    // El casco de la Ingeniera está sobre ella, a la altura de la cabeza.
    expect(Math.hypot(p.x - ANCLAJES_EXPERTAS.ingeniera.x, p.z - ANCLAJES_EXPERTAS.ingeniera.z)).toBeLessThan(0.5);
    expect(p.y).toBeGreaterThan(1);
    t.jugador.grupo.visible = false;
    a.animar(600, false);
    cascos.getMatrixAt(0, m);
    expect(new THREE.Vector3().setFromMatrixScale(m).length()).toBe(0);
    a.liberar();
  });

  it("cerca de una experta lo que hay al alcance es ella; lejos de todas, el lugar o nada; Iris nunca", () => {
    for (const id of EXPERTAS_BASE) {
      // Del lado de la experta opuesto al punto de uso de su estación, a 0,9 m de ella.
      const anc = ANCLAJES_EXPERTAS[id];
      const est = lugar(anc.lugarId);
      const d = Math.hypot(anc.x - est.x, anc.z - est.z);
      const x = anc.x + ((anc.x - est.x) / d) * 0.9, z = anc.z + ((anc.z - est.z) / d) * 0.9;
      expect(interactivoCercano(x, z), id).toEqual({ tipo: "actor", actor: id });
    }
    // En el punto de uso del taller manda el lugar (ahí está la acción de reparar), aunque la Ingeniera esté cerca.
    const taller = lugar("taller");
    expect(interactivoCercano(taller.x, taller.z)).toEqual({ tipo: "lugar", lugar: "taller" });
    expect(interactivoCercano(60, 60)).toBeNull();
    expect(interactivoCercano(DOCK_IRIS.x, DOCK_IRIS.z)?.tipo).not.toBe("actor");
    expect(DISTANCIA_HABLAR).toBeGreaterThan(0.4 + 0.38); // más que el radio de la experta más el del niño
  });

  it("el niño no atraviesa a ninguna experta", () => {
    const solidos = solidosBase({}, []);
    for (const id of EXPERTAS_BASE) {
      const anc = ANCLAJES_EXPERTAS[id];
      const m = crearMovimiento(solidos, { inicio: { x: anc.x + 2.5, z: anc.z } });
      m.fijarEntrada(-1, 0);
      let minimo = Infinity;
      for (let i = 0; i < 180; i++) {
        m.avanzar(1 / 60);
        minimo = Math.min(minimo, Math.hypot(m.jugador.x - anc.x, m.jugador.z - anc.z));
      }
      expect(minimo, id).toBeGreaterThan(0.7);
    }
  });
});
