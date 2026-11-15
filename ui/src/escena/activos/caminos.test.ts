import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { BANCO, LUGARES, TERRENO } from "../mundo";
import { ANILLO, CAMINO, CAMINOS, PLAZA, TRONCAL, distanciaTramo, geometriaCaminos, huellasDe, posicionesBalizas, sobreCamino } from "./caminos";

type Tri = { a: THREE.Vector3; b: THREE.Vector3; c: THREE.Vector3; n: THREE.Vector3 };

function triangulos(g: THREE.BufferGeometry): Tri[] {
  const p = g.getAttribute("position"), n = g.getAttribute("normal");
  const salida: Tri[] = [];
  for (let i = 0; i < p.count; i += 3)
    salida.push({
      a: new THREE.Vector3().fromBufferAttribute(p, i),
      b: new THREE.Vector3().fromBufferAttribute(p, i + 1),
      c: new THREE.Vector3().fromBufferAttribute(p, i + 2),
      n: new THREE.Vector3().fromBufferAttribute(n, i),
    });
  return salida;
}

/** (x, z) estrictamente dentro del triángulo t (proyectado en x/z). */
function dentro(x: number, z: number, t: Tri): boolean {
  const s = (p: THREE.Vector3, q: THREE.Vector3) => (q.x - p.x) * (z - p.z) - (q.z - p.z) * (x - p.x);
  const d1 = s(t.a, t.b), d2 = s(t.b, t.c), d3 = s(t.c, t.a);
  const e = 1e-6;
  return (d1 > e && d2 > e && d3 > e) || (d1 < -e && d2 < -e && d3 < -e);
}

describe("caminos de losas", () => {
  const g = geometriaCaminos();
  const tris = triangulos(g);

  it("es una sola geometría con color por vértice y dentro del presupuesto de la red (≤ 4 000 triángulos)", () => {
    expect(g.getAttribute("color").count).toBe(g.getAttribute("position").count);
    expect(tris.length).toBeGreaterThan(100);
    expect(tris.length).toBeLessThan(4000);
  });

  it("solo hay caras horizontales hacia arriba y paredes verticales", () => {
    for (const t of tris) {
      const horizontal = Math.abs(t.n.y - 1) < 1e-4;
      const vertical = Math.abs(t.n.y) < 1e-4;
      expect(horizontal || vertical).toBe(true);
    }
  });

  it("ninguna cara de arriba se superpone a otra a la misma altura (sin z-fighting)", () => {
    const arriba = tris.filter(t => t.n.y > 0.5);
    const porAltura = new Map<number, Tri[]>();
    for (const t of arriba) {
      const y = Math.round(t.a.y * 1e4);
      porAltura.set(y, [...(porAltura.get(y) ?? []), t]);
    }
    // Losa, bordillo, plaza y las juntas sobre losa y plaza: alturas distintas.
    expect(porAltura.size).toBe(5);
    for (const lista of porAltura.values()) {
      for (const t of lista) {
        const cx = (t.a.x + t.b.x + t.c.x) / 3, cz = (t.a.z + t.b.z + t.c.z) / 3;
        const encima = lista.filter(o => o !== t && dentro(cx, cz, o));
        expect(encima.length, `cara en (${cx.toFixed(2)}, ${cz.toFixed(2)})`).toBe(0);
      }
    }
  });

  it("la losa queda por debajo del bordillo y la plaza es el escalón más alto", () => {
    expect(CAMINO.altoLosa).toBeLessThan(CAMINO.altoBordillo);
    expect(CAMINO.altoBordillo).toBeLessThan(CAMINO.altoPlaza);
  });

  it("ningún tramo (losa + bordillo) pisa sólidos de TERRENO ni el banco fuera de los rellanos de sus puestos", () => {
    const w = CAMINO.ancho / 2 + CAMINO.bordillo;
    const solido = (x: number, z: number) =>
      TERRENO.circulos.some(c => Math.hypot(x - c.x, z - c.z) < c.r)
      || TERRENO.capsulas.some(c => Math.hypot(x - Math.max(c.x0, Math.min(c.x1, x)), z - c.z) < c.r)
      || (x > BANCO.x0 && x < BANCO.x1 && z > BANCO.zBajo && z < BANCO.zFondo);
    const rellano = (x: number, z: number) => LUGARES.some(l => Math.hypot(x - l.x, z - l.z) < w * 1.2);
    for (const tramo of CAMINOS)
      for (let i = 1; i < tramo.length; i++) {
        const a = tramo[i - 1]!, b = tramo[i]!;
        const largo = Math.hypot(b[0] - a[0], b[1] - a[1]);
        const ux = (b[0] - a[0]) / largo, uz = (b[1] - a[1]) / largo;
        for (let t = 0; t <= largo; t += 0.1)
          for (const s of [-w, 0, w]) {
            const x = a[0] + ux * t - uz * s, z = a[1] + uz * t + ux * s;
            if (rellano(x, z)) continue;
            expect(solido(x, z), `tramo ${a} → ${b} en (${x.toFixed(2)}, ${z.toFixed(2)})`).toBe(false);
          }
      }
  });

  it("la pared exterior de la plataforma se emite una sola vez por cara (sin paredes coplanares)", () => {
    const alto = CAMINO.altoPlaza + 0.02;
    const caras = [
      { n: [0, -1], d: PLAZA.z0, largo: PLAZA.x1 - PLAZA.x0, eje: "z" },
      { n: [0, 1], d: PLAZA.z1, largo: PLAZA.x1 - PLAZA.x0, eje: "z" },
      { n: [-1, 0], d: PLAZA.x0, largo: PLAZA.z1 - PLAZA.z0, eje: "x" },
      { n: [1, 0], d: PLAZA.x1, largo: PLAZA.z1 - PLAZA.z0, eje: "x" },
    ] as const;
    let area = 0;
    for (const c of caras)
      for (const t of tris) {
        const enPlano = [t.a, t.b, t.c].every(p => Math.abs(p[c.eje] - c.d) < 1e-6);
        if (enPlano && t.n.x * c.n[0] + t.n.z * c.n[1] > 0.9) area += new THREE.Triangle(t.a, t.b, t.c).getArea();
      }
    // Los ramales se comen un trozo de la pared: nunca sobra área (ninguna cara repetida).
    expect(area).toBeLessThanOrEqual(2 * (PLAZA.x1 - PLAZA.x0 + PLAZA.z1 - PLAZA.z0) * alto + 1e-6);
    expect(area).toBeGreaterThan(0.5 * (PLAZA.x1 - PLAZA.x0) * alto);
  });

  it("el centro de la plataforma y su marco comparten vértices en la arista común (sin grietas en T)", () => {
    const col = g.getAttribute("color"), pos = g.getAttribute("position");
    const porColor = new Map<string, THREE.Vector3[]>();
    for (let i = 0; i < pos.count; i += 3) {
      if (Math.abs(pos.getY(i) - CAMINO.altoPlaza) > 1e-6 || pos.getY(i + 1) !== pos.getY(i) || pos.getY(i + 2) !== pos.getY(i)) continue;
      const clave = [col.getX(i), col.getY(i), col.getZ(i)].map(c => c.toFixed(4)).join();
      porColor.set(clave, [...(porColor.get(clave) ?? []), ...[0, 1, 2].map(k => new THREE.Vector3().fromBufferAttribute(pos, i + k))]);
    }
    expect(porColor.size).toBe(2); // centro y marco
    const [uno, otro] = [...porColor.values()] as [THREE.Vector3[], THREE.Vector3[]];
    const b = CAMINO.bordePlaza;
    const enBorde = (v: THREE.Vector3) => {
      const dentro = v.x > PLAZA.x0 + b - 1e-6 && v.x < PLAZA.x1 - b + 1e-6 && v.z > PLAZA.z0 + b - 1e-6 && v.z < PLAZA.z1 - b + 1e-6;
      const enLinea = [PLAZA.x0 + b, PLAZA.x1 - b].some(x => Math.abs(v.x - x) < 1e-6) || [PLAZA.z0 + b, PLAZA.z1 - b].some(z => Math.abs(v.z - z) < 1e-6);
      return dentro && enLinea;
    };
    const tiene = (lista: THREE.Vector3[], v: THREE.Vector3) => lista.some(o => o.distanceTo(v) < 1e-6);
    for (const [a, c] of [[uno, otro], [otro, uno]] as const)
      for (const v of a.filter(enBorde)) expect(tiene(c, v), `vértice (${v.x.toFixed(3)}, ${v.z.toFixed(3)}) de un lado sin pareja en el otro`).toBe(true);
  });

  it("el pavimento cubre los codos, también los muy cerrados (inglete limitado)", () => {
    const w = CAMINO.ancho / 2;
    type Pt = readonly [number, number];
    /** Punto dentro de un polígono convexo (vértices en cualquier sentido). */
    const dentroConvexo = (h: readonly Pt[], x: number, z: number) => {
      const c = h.map((a, i) => { const b = h[(i + 1) % h.length]!; return (b[0] - a[0]) * (z - a[1]) - (b[1] - a[1]) * (x - a[0]); });
      return c.every(v => v >= -1e-9) || c.every(v => v <= 1e-9);
    };
    const cubierto = (huellas: readonly (readonly Pt[])[], x: number, z: number) => huellas.some(h => dentroConvexo(h, x, z));
    // Giros de 60° a 170°: por fuera del codo, sobre la bisectriz, hasta 1,5·w del vértice.
    for (const grados of [60, 100, 120, 140, 160, 170]) {
      const t = (grados * Math.PI) / 180;
      const huellas = huellasDe([[[-5, 0], [0, 0], [5 * Math.cos(t), 5 * Math.sin(t)]]], w);
      const l = Math.hypot(Math.sin(t), 1 + Math.cos(t));
      const d: Pt = [Math.sin(t) / l, -(1 + Math.cos(t)) / l];
      const punta = Math.min(Math.sqrt(2 / (1 + Math.cos(t))), Math.sqrt(2 / 0.6)); // largo del inglete, en w
      for (const f of [0.3, 0.6, 0.9, 0.97])
        expect(cubierto(huellas, d[0] * f * punta * w, d[1] * f * punta * w), `giro de ${grados}°, al ${f * 100} % del inglete`).toBe(true);
    }
    // Los codos reales de la red: el disco de radio w alrededor de cada vértice interior queda lleno.
    const red = huellasDe(CAMINOS, w);
    for (const tramo of CAMINOS)
      for (let i = 1; i < tramo.length - 1; i++)
        for (let a = 0; a < 360; a += 15) {
          const x = tramo[i]![0] + Math.cos((a * Math.PI) / 180) * w * 0.95, z = tramo[i]![1] + Math.sin((a * Math.PI) / 180) * w * 0.95;
          expect(cubierto(red, x, z), `codo ${tramo[i]} a ${a}°`).toBe(true);
        }
  });

  it("el anillo exterior es un lazo cerrado que rodea todos los lugares", () => {
    expect(ANILLO[0]).toEqual(ANILLO[ANILLO.length - 1]);
    for (const l of LUGARES) {
      let dentro = false;
      for (let i = 1; i < ANILLO.length; i++) {
        const a = ANILLO[i - 1]!, b = ANILLO[i]!;
        if ((a[1] > l.z) !== (b[1] > l.z) && l.x < a[0] + ((l.z - a[1]) / (b[1] - a[1])) * (b[0] - a[0])) dentro = !dentro;
      }
      expect(dentro, l.id).toBe(true);
    }
    for (const [x, z] of ANILLO) expect(Math.hypot(x, z)).toBeLessThan(TERRENO.limite);
  });

  it("la plataforma abarca la consola de la mesa y el punto donde se para el jugador", () => {
    const mesa = LUGARES.find(l => l.id === "mesa")!;
    expect(mesa.mx - 1.2).toBeGreaterThan(PLAZA.x0);
    expect(mesa.mz).toBeGreaterThan(PLAZA.z0 + 0.6);
    expect(mesa.z).toBeLessThan(PLAZA.z1);
  });
  it("el camino ancho sale del primer plano y llega a la plataforma de la consola, más ancho que el resto", () => {
    expect(CAMINO.anchoTroncal).toBeGreaterThan(CAMINO.ancho * 1.4);
    const t = TRONCAL[0]!;
    expect(t[0]![1]).toBeGreaterThan(8);
    const fin = t[t.length - 1]!;
    expect(fin[1]).toBeGreaterThan(PLAZA.z1);
    expect(fin[1] - PLAZA.z1).toBeLessThan(0.5);
    expect(fin[0]).toBeGreaterThan(PLAZA.x0);
    expect(fin[0]).toBeLessThan(PLAZA.x1);
  });

  it("la red es una sola cinta: todo tramo se une a otro o acaba en un lugar o en la plataforma", () => {
    const toca = (p: readonly [number, number], o: readonly (readonly [number, number])[]) => o.some((q, k) => k > 0 && distanciaTramo(p[0], p[1], o[k - 1]!, q) < 1e-6);
    for (const tramo of CAMINOS)
      for (const p of [tramo[0]!, tramo[tramo.length - 1]!]) {
        const enLugar = LUGARES.some(l => Math.hypot(l.x - p[0], l.z - p[1]) < 0.6);
        const enPlaza = Math.abs(p[1] - (PLAZA.z1 + 0.2)) < 0.3 || p[0] < PLAZA.x0 + 0.01 || p[0] > PLAZA.x1 - 0.01 || p[1] < PLAZA.z0 + 0.01 || Math.hypot(p[0] - PLAZA.x, p[1] - PLAZA.z) < 4.5;
        const enOtro = CAMINOS.some(o => o !== tramo && toca(p, o));
        const entrada = tramo === TRONCAL[0] && p === tramo[0];
        expect(enLugar || enPlaza || enOtro || entrada, `extremo ${p}`).toBe(true);
      }
  });

  it("las balizas van a los bordes de los caminos, separadas y fuera de la losa", () => {
    const b = posicionesBalizas();
    expect(b.length).toBeGreaterThanOrEqual(6);
    for (const [x, z] of b) {
      expect(sobreCamino(x, z, 0)).toBe(false);
      expect(sobreCamino(x, z, 0.6)).toBe(true);
    }
  });
});
