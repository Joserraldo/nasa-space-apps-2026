import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { crearMateriales } from "../materiales";
import { armarEscena } from "../armado";
import { PANELES, armarAntenaReal, armarPanelReal, materialCeldas, pintarPolvo, type ModelosModulos } from "./modelosModulos";
import { PIEZAS_KIT } from "./colonia";
import type { VistaEscena } from "../vista";

/** Modelos de prueba con los nombres de material que deja `construir_modelos.py` (sin red ni GLB). */
function modelosFalsos(): ModelosModulos {
  const malla = (nombre: string, material: THREE.Material) => {
    const g = new THREE.Group();
    g.name = nombre;
    g.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material));
    return g;
  };
  // Kit de la colonia: una malla `Kit_<pieza>` por pieza, como lo deja `construir_modelos.py`.
  const kit = new THREE.Group();
  kit.name = "kit";
  for (const p of PIEZAS_KIT) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ name: "Kit" }));
    m.name = `Kit_${p}`;
    kit.add(m);
  }
  // Un material con transmisión (como el lambert del HDU) obliga a redibujar la escena: la preparación la apaga.
  const rotores = malla("ingenuity", new THREE.MeshStandardMaterial({ name: "Ingenuity_VC", vertexColors: true }));
  for (const n of ["rotors_01", "rotors_02"]) {
    const r = new THREE.Mesh(new THREE.BoxGeometry(1, 0.02, 0.1), new THREE.MeshStandardMaterial());
    r.name = n;
    rotores.add(r);
  }
  return {
    antena: malla("dish", new THREE.MeshPhysicalMaterial({ name: "Dish_White", transmission: 1 })),
    kit,
    habitat: malla("habitat", new THREE.MeshStandardMaterial({ name: "Habitat" })),
    torre: malla("torre", new THREE.MeshStandardMaterial({ name: "Tower" })),
    reciclador: malla("reciclador", new THREE.MeshStandardMaterial({ name: "Recycler_VC", vertexColors: true })),
    capsula: malla("capsula", new THREE.MeshStandardMaterial({ name: "Capsule_VC", vertexColors: true })),
    ingenuity: rotores,
    tripulante: malla("tripulante", new THREE.MeshStandardMaterial({ name: "Suit" })),
    quaternius: (() => {
      const g = new THREE.Group();
      for (const n of ["Q_Ramp", "Q_Rover"]) g.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial()), { name: n }));
      return g;
    })(),
  };
}

function vista(polvo: boolean): VistaEscena {
  return {
    fase: "base",
    modulos: { panel_solar: "funcionando", antena: "funcionando", bateria: "ausente", reciclador_agua: "ausente", escudo: "ausente", invernadero: "ausente", ia_base: "funcionando" },
    iris: { nivel: "pistas", averiada: false },
    tormenta: { anunciada: false, activa: false },
    panelConPolvo: polvo,
    lugarObjetivo: null,
    resultado: "en_curso",
  };
}

describe("modelos reales de la Etapa D", () => {
  it("el polvo del panel es más rojizo y sin reflejo, y limpiar lo devuelve", () => {
    const m = new THREE.MeshStandardMaterial();
    pintarPolvo(m, false);
    const limpio = { r: m.color.r, b: m.color.b, rug: m.roughness };
    pintarPolvo(m, true);
    expect(m.color.r).toBeGreaterThan(limpio.r);
    expect(m.color.r).toBeGreaterThan(m.color.b);
    expect(m.roughness).toBeGreaterThan(limpio.rug);
    expect(m.metalness).toBe(0);
    pintarPolvo(m, false);
    expect(m.color.r).toBeCloseTo(limpio.r);
    expect(m.roughness).toBeCloseTo(limpio.rug);
  });

  it("los paneles comparten un solo material de celdas (pintar una vez cambia los tres)", () => {
    const { grupo, celdas } = armarPanelReal();
    expect(celdas).not.toBeNull();
    const usados = new Set<THREE.Material>();
    grupo.traverse((o) => {
      if (o instanceof THREE.Mesh && (o.material as THREE.Material).name === "Panel_Cells") usados.add(o.material as THREE.Material);
    });
    expect(usados.size).toBe(1);
    expect(materialCeldas(grupo)).toBe(celdas);
    expect(grupo.children.length).toBe(PANELES.n + 1);
  });

  it("armar dos veces no acumula el tinte de polvo en el material del GLB", () => {
    const modelos = modelosFalsos();
    const original = (modelos.antena.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial;
    const antes = original.color.getHex();
    const tono = () => {
      let c = 0;
      armarAntenaReal(modelos).traverse((o) => {
        if (o instanceof THREE.Mesh && (o.material as THREE.Material).name === "Dish_White") c = (o.material as THREE.MeshStandardMaterial).color.getHex();
      });
      return c;
    };
    expect(tono()).toBe(tono());
    expect(original.color.getHex()).toBe(antes);
  });

  it("ponerModelos cambia antena y panel sin perder el estado, y la vista pinta el polvo", () => {
    const armada = armarEscena(crearMateriales(), vista(true));
    const panelViejo = armada.modulos.panel_solar.solido;
    armada.ponerModelos(modelosFalsos());
    const panel = armada.modulos.panel_solar;
    expect(panel.solido).not.toBe(panelViejo);
    expect(panel.solido.visible).toBe(true);
    expect(panel.solido.parent).toBe(panel.raiz);
    // Sin transmisión: si no, three redibuja la escena entera en un pase extra.
    armada.modulos.antena.solido.traverse((o) => {
      if (o instanceof THREE.Mesh && o.material instanceof THREE.MeshPhysicalMaterial) expect(o.material.transmission).toBe(0);
    });
    const celdas = materialCeldas(panel.solido)!;
    const conPolvo = celdas.roughness;
    armada.aplicarVista(vista(false));
    expect(celdas.roughness).toBeLessThan(conPolvo);
    armada.liberar();
  });
});
