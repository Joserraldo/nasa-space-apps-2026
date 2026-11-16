import { describe, expect, it, vi } from "vitest";
import { EntradaTactil, RADIO_JOYSTICK_PX, ZONA_MUERTA_TACTIL } from "./entradaTactil.js";

function crear(zoom = true) {
  const onRecentrar = vi.fn();
  return { e: new EntradaTactil({ onRecentrar, permiteZoom: () => zoom }), onRecentrar };
}
const delta = () => ({ x: 0, y: 0, zoom: 0 });

describe("entrada táctil", () => {
  it("respeta la zona muerta del 12 % y la velocidad proporcional", () => {
    const { e } = crear();
    e.iniciar(1, 100, 100, "mover", 0);
    e.mover(1, 100 + RADIO_JOYSTICK_PX * ZONA_MUERTA_TACTIL, 100);
    expect(e.estado.moverX).toBeCloseTo(0);
    e.mover(1, 100 + RADIO_JOYSTICK_PX * 0.56, 100);
    expect(e.estado.moverX).toBeCloseTo(0.5);
    expect(e.estado.moverZ).toBe(0);
  });

  it("limita diagonales y perilla sin acelerar por alejar el dedo", () => {
    const { e } = crear();
    e.iniciar(1, 0, 0, "mover", 0); e.mover(1, 400, -400);
    expect(Math.hypot(e.estado.moverX, e.estado.moverZ)).toBeCloseTo(1);
    expect(Math.hypot(e.estado.perillaX, e.estado.perillaY)).toBeCloseTo(48);
    expect(e.estado.moverZ).toBeLessThan(0);
  });

  it("conserva cada zona por pointerId y permite mover y mirar a la vez", () => {
    const { e } = crear();
    e.iniciar(1, 100, 100, "mover", 0); e.iniciar(2, 700, 100, "mirar", 0);
    e.mover(1, 800, 100); e.mover(2, 300, 130);
    expect(e.estado.moverX).toBe(1);
    expect(e.estado.mirarX).toBe(-400);
    expect(e.estado.mirarY).toBe(30);
    e.terminar(2, 500);
    expect(e.estado.moverX).toBe(1);
    e.terminar(1, 500);
    expect(e.estado.moverX).toBe(0);
    expect(e.estado.joystickActivo).toBe(false);
  });

  it("rechaza punteros duplicados, otro pulgar izquierdo y un tercer dedo de cámara", () => {
    const { e } = crear();
    expect(e.iniciar(1, 0, 0, "mover", 0)).toBe(true);
    expect(e.iniciar(1, 0, 0, "mirar", 0)).toBe(false);
    expect(e.iniciar(2, 0, 0, "mover", 0)).toBe(false);
    expect(e.iniciar(2, 20, 0, "mirar", 0)).toBe(true);
    expect(e.iniciar(3, 40, 0, "mirar", 0)).toBe(true);
    expect(e.iniciar(4, 60, 0, "mirar", 0)).toBe(false);
  });

  it("consume cada delta de cámara una vez, reutilizando estado y salida", () => {
    const { e } = crear(), s = delta(), estado = e.estado;
    e.iniciar(1, 0, 0, "mirar", 0); e.mover(1, 20, 10); e.mover(1, 35, 20);
    e.consumirCamara(s); expect(s).toEqual({ x: 35, y: 20, zoom: 0 });
    e.consumirCamara(s); expect(s).toEqual(delta());
    expect(e.estado).toBe(estado);
  });

  it.each([true, false])("aplica pellizco solo si la cámara permite zoom: %s", zoom => {
    const { e, onRecentrar } = crear(zoom);
    e.iniciar(1, 0, 0, "mirar", 0); e.iniciar(2, 100, 0, "mirar", 0);
    e.mover(2, 200, 0);
    expect(e.estado.zoom).toBeCloseTo(zoom ? Math.log(2) : 0);
    expect(e.estado.mirarX).toBe(0);
    e.terminar(1, 50); e.mover(2, 215, 0); e.terminar(2, 100);
    expect(e.estado.mirarX).toBe(15);
    expect(onRecentrar).not.toHaveBeenCalled();
  });

  it("recentra una sola vez con doble toque cercano y breve; el ruido no gira", () => {
    const { e, onRecentrar } = crear();
    for (let i = 0; i < 3; i++) {
      e.iniciar(1, 100, 100, "mirar", i * 100);
      e.mover(1, 102, 101); e.terminar(1, i * 100 + 40);
    }
    expect(onRecentrar).toHaveBeenCalledTimes(1);
    expect(e.estado.mirarX).toBe(0);
  });

  it.each(["lejano", "lento", "arrastre", "cancelado"])("no interpreta como doble toque: %s", caso => {
    const { e, onRecentrar } = crear();
    e.iniciar(1, 0, 0, "mirar", 0); e.terminar(1, 40);
    e.iniciar(2, caso === "lejano" ? 100 : 0, 0, "mirar", caso === "lento" ? 500 : 100);
    if (caso === "arrastre") e.mover(2, 30, 0);
    e.terminar(2, caso === "lento" ? 540 : 140, caso === "cancelado");
    expect(onRecentrar).not.toHaveBeenCalled();
  });

  it("cancela sin movimiento residual, sin recentrado y permite volver a capturar", () => {
    const { e, onRecentrar } = crear();
    e.iniciar(1, 0, 0, "mover", 0); e.mover(1, 40, 20);
    e.iniciar(2, 0, 0, "mirar", 0); e.mover(2, 30, 20); e.cancelar();
    expect([e.estado.moverX, e.estado.moverZ, e.estado.mirarX, e.estado.mirarY, e.estado.zoom]).toEqual([0,0,0,0,0]);
    e.mover(1, 100, 100); e.terminar(2, 50);
    expect(e.estado.moverX).toBe(0);
    expect(onRecentrar).not.toHaveBeenCalled();
    expect(e.iniciar(1, 0, 0, "mover", 100)).toBe(true);
  });
});
