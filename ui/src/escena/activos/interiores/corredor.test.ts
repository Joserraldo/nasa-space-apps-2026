import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { crearMateriales } from "../../materiales";
import { fusionar } from "../fusionar";
import { CORREDOR_INTERIOR, crearCorredorInterior, octogonoInterior, zonaCorredor } from "./corredor";

function contar(raiz: THREE.Object3D): { llamadas: number; triangulos: number } {
  let llamadas = 0, triangulos = 0;
  raiz.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    llamadas++;
    const g = o.geometry as THREE.BufferGeometry;
    triangulos += (g.index ? g.index.count : g.getAttribute("position").count) / 3;
  });
  return { llamadas, triangulos };
}

describe("corredor de conexión (D5)", () => {
  it("fusionado entra holgado en el presupuesto de una vista (80 draw calls, 80 000 triángulos)", () => {
    const { llamadas, triangulos } = contar(fusionar(crearCorredorInterior(crearMateriales()), "Sala_Corredor"));
    expect(llamadas).toBeLessThanOrEqual(10);
    expect(triangulos).toBeLessThan(5000);
  });

  it("la sección es un octógono cerrado con piso en y = 0 y del ancho y alto pedidos", () => {
    const p = octogonoInterior();
    expect(p).toHaveLength(8);
    const xs = p.map(([x]) => x), ys = p.map(([, y]) => y);
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(CORREDOR_INTERIOR.ancho);
    expect(Math.min(...ys)).toBe(0);
    expect(Math.max(...ys)).toBeCloseTo(CORREDOR_INTERIOR.alto);
  });

  it("la zona caminable queda dentro del piso y la entrada dentro de la zona, mirando al fondo", () => {
    const { caminable: c, entrada: e } = zonaCorredor();
    const [piso0, piso1] = octogonoInterior();
    expect(c.x0).toBeGreaterThanOrEqual(piso0![0]);
    expect(c.x1).toBeLessThanOrEqual(piso1![0]);
    expect(c.z0).toBeGreaterThan(0);
    expect(c.z1).toBeLessThan(CORREDOR_INTERIOR.largo);
    expect(e.x).toBeGreaterThanOrEqual(c.x0);
    expect(e.x).toBeLessThanOrEqual(c.x1);
    expect(e.z).toBeGreaterThanOrEqual(c.z0);
    expect(e.z).toBeLessThanOrEqual(c.z1);
    expect(Math.cos(e.rumbo)).toBeCloseTo(-1); // mira hacia -z
  });

  it("tiene las piezas de la lámina: puerta del fondo, puerta lateral, ventana, luces guía y tiras cian", () => {
    const nombres = new Set<string>();
    crearCorredorInterior(crearMateriales()).traverse((o) => nombres.add(o.name));
    for (const n of ["Corridor_EndDoor", "Corridor_SideDoor", "Corridor_WindowGlass", "Corridor_GuideLight", "Corridor_CyanStrip", "Corridor_Rib", "Greenhouse_Crop"]) {
      expect(nombres.has(n), n).toBe(true);
    }
  });

  it("los cultivos solo están del otro lado del vidrio (dentro del invernadero), nunca en el corredor", () => {
    const vidrioX = -CORREDOR_INTERIOR.ancho / 2;
    const raiz = crearCorredorInterior(crearMateriales());
    raiz.updateMatrixWorld(true);
    raiz.traverse((o) => {
      if (o.name === "Greenhouse_Crop") expect(o.getWorldPosition(new THREE.Vector3()).x).toBeLessThan(vidrioX);
    });
  });
});
