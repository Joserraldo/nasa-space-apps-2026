import { describe, expect, it } from "vitest";
import { EntradaTactil, RADIO_JOYSTICK_PX } from "../escena/entradaTactil.js";
import { AdaptadorTactil, zonaDe } from "./adaptadorTactil.js";

const caja = { left: 0, width: 800 };

function crear() {
  let t = 0;
  const entrada = new EntradaTactil({ onRecentrar: () => undefined, permiteZoom: () => true });
  const adaptador = new AdaptadorTactil(entrada, () => t);
  return { entrada, adaptador, avanzar: (ms: number) => { t += ms; } };
}

describe("capa táctil (ESCENAS §3.5)", () => {
  it("la mitad izquierda mueve y la derecha mira", () => {
    expect(zonaDe(10, caja)).toBe("mover");
    expect(zonaDe(399, caja)).toBe("mover");
    expect(zonaDe(400, caja)).toBe("mirar");
    expect(zonaDe(790, { left: 400, width: 800 })).toBe("mover");
  });

  it("un dedo a la izquierda arma el joystick donde apoya y la perilla se limita a 48 px", () => {
    const { entrada, adaptador } = crear();
    expect(adaptador.abajo({ pointerId: 1, clientX: 100, clientY: 300 }, caja)).toBe(true);
    expect(entrada.estado.joystickActivo).toBe(true);
    expect([entrada.estado.origenX, entrada.estado.origenY]).toEqual([100, 300]);
    adaptador.mover({ pointerId: 1, clientX: 300, clientY: 300 });
    expect(entrada.estado.perillaX).toBe(RADIO_JOYSTICK_PX);
    expect(entrada.estado.moverX).toBeCloseTo(1);
    adaptador.arriba({ pointerId: 1, clientX: 300, clientY: 300 });
    expect(entrada.estado.joystickActivo).toBe(false);
    expect(entrada.estado.moverX).toBe(0);
  });

  it("mover y mirar a la vez con dos dedos; un segundo dedo en el joystick no lo roba", () => {
    const { entrada, adaptador } = crear();
    adaptador.abajo({ pointerId: 1, clientX: 100, clientY: 300 }, caja);
    expect(adaptador.abajo({ pointerId: 2, clientX: 600, clientY: 300 }, caja)).toBe(true);
    expect(adaptador.abajo({ pointerId: 3, clientX: 120, clientY: 300 }, caja)).toBe(false);
    adaptador.mover({ pointerId: 2, clientX: 640, clientY: 300 });
    expect(entrada.estado.mirarX).toBeGreaterThan(0);
    expect(entrada.estado.joystickActivo).toBe(true);
  });

  it("soltar todo (panel abierto, teclado) deja el joystick quieto", () => {
    const { entrada, adaptador } = crear();
    adaptador.abajo({ pointerId: 1, clientX: 100, clientY: 300 }, caja);
    adaptador.mover({ pointerId: 1, clientX: 160, clientY: 300 });
    adaptador.soltarTodo();
    expect(entrada.estado).toMatchObject({ joystickActivo: false, moverX: 0, moverZ: 0, perillaX: 0 });
  });
});
