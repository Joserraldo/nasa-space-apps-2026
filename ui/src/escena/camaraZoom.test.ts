import { describe, expect, it } from "vitest";
import { ESPERA_TRAS_CHOQUE, RITMO_CAMARA, curva, distanciaLibreRayo, siguienteDistancia, type DistanciaCamara } from "./escena3d";

const DT = 1 / 60;

describe("cámara sin zooms raros (A13)", () => {
  it("la distancia libre se mide sin escalones: sigue a la pared de forma continua", () => {
    // Pared a 2,37 m: con 16 tramos de 0,25 m antes daba 2,25; ahora queda a menos de 1 cm.
    expect(distanciaLibreRayo(4, (t) => t >= 2.37, 1.2)).toBeGreaterThan(2.36);
    expect(distanciaLibreRayo(4, (t) => t >= 2.37, 1.2)).toBeLessThan(2.37);
    // Acercar la pared 1 cm cambia la distancia en ~1 cm, no en un tramo entero.
    const a = distanciaLibreRayo(4, (t) => t >= 2.37, 1.2), b = distanciaLibreRayo(4, (t) => t >= 2.36, 1.2);
    expect(a - b).toBeLessThan(0.02);
    expect(distanciaLibreRayo(4, () => false, 1.2)).toBe(4);
    expect(distanciaLibreRayo(4, () => true, 1.2)).toBe(1.2);
  });

  it("sin choque, la distancia no salta entre fotogramas aunque el encuadre pedido cambie de golpe", () => {
    // Abrir un panel o el mapa cambia el aspecto: la meta pasa de 3,3 a 4,4 m en un fotograma.
    const e: DistanciaCamara = { d: 3.3, espera: 0 };
    let meta = 3.3, enc = 3.3;
    let maximo = 0;
    for (let i = 0; i < 120; i++) {
      if (i === 10) meta = 4.4;
      enc = curva(enc, meta, RITMO_CAMARA.encuadre, DT);
      const antes = e.d;
      siguienteDistancia(e, enc, Infinity, DT, false);
      maximo = Math.max(maximo, Math.abs(e.d - antes));
    }
    // Paso máximo: (4,4 − 3,3) · (1 − e^(−6/60)) ≈ 0,105 m en el primer fotograma, y menos después.
    expect(maximo).toBeLessThan(1.1 * (1 - Math.exp(-RITMO_CAMARA.encuadre * DT)) + 1e-9);
    expect(e.d).toBeGreaterThan(4.3);
  });

  it("un choque la acerca en el acto, y no se vuelve a alejar hasta que pasa la espera", () => {
    const e: DistanciaCamara = { d: 4, espera: 0 };
    siguienteDistancia(e, 4, 2.2, DT, false);
    expect(e.d).toBe(2.2); // nunca dentro de la pared
    // El tope vuelve a estar libre un fotograma sí y otro no (rozando un borde): no hay sierra.
    const vistos: number[] = [];
    for (let i = 0; i < 12; i++) {
      siguienteDistancia(e, 4, i % 2 ? 2.2 : 4, DT, false);
      vistos.push(e.d);
    }
    expect(Math.max(...vistos)).toBe(2.2);
    // Libre de verdad: espera y después se aleja con curva, sin saltos.
    let antes = e.d, maxPaso = 0;
    for (let t = 0; t < ESPERA_TRAS_CHOQUE + 1.5; t += DT) {
      siguienteDistancia(e, 4, 4, DT, false);
      maxPaso = Math.max(maxPaso, e.d - antes);
      antes = e.d;
    }
    expect(e.d).toBeGreaterThan(3.9);
    expect(maxPaso).toBeLessThan(1.8 * (1 - Math.exp(-RITMO_CAMARA.alejar * DT)) + 1e-9);
  });

  it("con movimiento reducido o sin valor previo va directo, sin curvas", () => {
    const e: DistanciaCamara = { d: -1, espera: 0 };
    siguienteDistancia(e, 3.3, 5, DT, false);
    expect(e.d).toBe(3.3);
    siguienteDistancia(e, 4.4, 5, DT, true);
    expect(e.d).toBe(4.4);
  });
});
