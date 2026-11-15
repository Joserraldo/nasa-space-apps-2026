/** Gestos de ESCENAS §3.5. Sin DOM, React, mallas ni GameState. */
export const RADIO_JOYSTICK_PX = 48;
export const ZONA_MUERTA_TACTIL = 0.12;
const DISTANCIA_TOQUE_PX = 8;
const DURACION_TOQUE_MS = 250;
const INTERVALO_DOBLE_TOQUE_MS = 300;
const DISTANCIA_DOBLE_TOQUE_PX = 24;

export type ZonaTactil = "mover" | "mirar";
interface Dedo {
  id: number; x: number; y: number; ox: number; oy: number; inicio: number; toque: boolean;
}
export interface DeltaCamaraTactil { x: number; y: number; zoom: number }

/**
 * El adaptador DOM asigna la zona solo en pointerdown y conserva pointerId hasta up/cancel.
 * El bucle lee movimiento X/Z relativo a cámara y consume deltas de mirada en píxeles.
 * Zoom positivo (logaritmo de la razón de separación) pide acercar, solo en tercera persona.
 * Captura de punteros, botones, visibilitychange/pausa y límites de cámara pertenecen al montaje.
 */
export class EntradaTactil {
  readonly estado = {
    moverX: 0, moverZ: 0, mirarX: 0, mirarY: 0, zoom: 0,
    joystickActivo: false, origenX: 0, origenY: 0, perillaX: 0, perillaY: 0,
  };
  private movimiento: Dedo | null = null;
  private miradaA: Dedo | null = null;
  private miradaB: Dedo | null = null;
  private distanciaPinza = 0;
  private ultimoToque: { x: number; y: number; tiempo: number } | null = null;

  constructor(private readonly opciones: { onRecentrar(): void; permiteZoom(): boolean }) {}

  iniciar(id: number, x: number, y: number, zona: ZonaTactil, ahoraMs: number): boolean {
    if (this.buscar(id) || (zona === "mover" ? this.movimiento : this.miradaA && this.miradaB)) return false;
    const dedo: Dedo = { id, x, y, ox: x, oy: y, inicio: ahoraMs, toque: true };
    if (zona === "mover") {
      this.movimiento = dedo;
      this.estado.joystickActivo = true;
      this.estado.origenX = x; this.estado.origenY = y;
    } else if (!this.miradaA) {
      this.miradaA = dedo;
    } else {
      this.miradaB = dedo;
      this.miradaA.toque = dedo.toque = false;
      this.ultimoToque = null;
      this.distanciaPinza = Math.hypot(x - this.miradaA.x, y - this.miradaA.y);
    }
    return true;
  }

  mover(id: number, x: number, y: number): void {
    const p = this.buscar(id);
    if (!p) return;
    const dx = x - p.x, dy = y - p.y;
    p.x = x; p.y = y;
    if (Math.hypot(x - p.ox, y - p.oy) > DISTANCIA_TOQUE_PX) p.toque = false;
    if (p === this.movimiento) {
      const mx = x - p.ox, my = y - p.oy, d = Math.hypot(mx, my);
      const normalizada = Math.min(d / RADIO_JOYSTICK_PX, 1);
      const velocidad = Math.max(0, (normalizada - ZONA_MUERTA_TACTIL) / (1 - ZONA_MUERTA_TACTIL));
      const ux = d ? mx / d : 0, uy = d ? my / d : 0;
      this.estado.moverX = ux * velocidad; this.estado.moverZ = uy * velocidad;
      this.estado.perillaX = ux * Math.min(d, RADIO_JOYSTICK_PX);
      this.estado.perillaY = uy * Math.min(d, RADIO_JOYSTICK_PX);
    } else if (this.miradaA && this.miradaB) {
      const d = Math.hypot(this.miradaA.x - this.miradaB.x, this.miradaA.y - this.miradaB.y);
      if (d > 0 && this.distanciaPinza > 0 && this.opciones.permiteZoom()) this.estado.zoom += Math.log(d / this.distanciaPinza);
      this.distanciaPinza = d;
    } else if (!p.toque) {
      this.estado.mirarX += dx; this.estado.mirarY += dy;
    }
  }

  terminar(id: number, ahoraMs: number, cancelado = false): void {
    const p = this.buscar(id);
    if (!p) return;
    if (p === this.movimiento) {
      this.movimiento = null;
      this.estado.moverX = this.estado.moverZ = this.estado.perillaX = this.estado.perillaY = 0;
      this.estado.joystickActivo = false;
    } else {
      if (!cancelado && p.toque && ahoraMs >= p.inicio && ahoraMs - p.inicio <= DURACION_TOQUE_MS) {
        const anterior = this.ultimoToque;
        if (anterior && ahoraMs >= anterior.tiempo && ahoraMs - anterior.tiempo <= INTERVALO_DOBLE_TOQUE_MS && Math.hypot(p.x - anterior.x, p.y - anterior.y) <= DISTANCIA_DOBLE_TOQUE_PX) {
          this.ultimoToque = null;
          this.estado.mirarX = this.estado.mirarY = this.estado.zoom = 0;
          this.opciones.onRecentrar();
        } else this.ultimoToque = { x: p.x, y: p.y, tiempo: ahoraMs };
      } else this.ultimoToque = null;
      if (p === this.miradaA) this.miradaA = this.miradaB;
      this.miradaB = null;
      this.distanciaPinza = 0;
    }
  }

  /** El llamador reutiliza `salida`; no se crean vectores en el bucle de dibujo. */
  consumirCamara(salida: DeltaCamaraTactil): void {
    salida.x = this.estado.mirarX; salida.y = this.estado.mirarY; salida.zoom = this.estado.zoom;
    this.estado.mirarX = this.estado.mirarY = this.estado.zoom = 0;
  }

  /** Usar al ocultarse la página, abrir un panel, usar teclado o desmontar; no reanuda la partida. */
  cancelar(): void {
    this.movimiento = this.miradaA = this.miradaB = null;
    this.ultimoToque = null;
    this.distanciaPinza = 0;
    this.estado.joystickActivo = false;
    this.estado.moverX = this.estado.moverZ = this.estado.perillaX = this.estado.perillaY = 0;
    this.estado.mirarX = this.estado.mirarY = this.estado.zoom = 0;
  }

  private buscar(id: number): Dedo | null {
    if (this.movimiento?.id === id) return this.movimiento;
    if (this.miradaA?.id === id) return this.miradaA;
    return this.miradaB?.id === id ? this.miradaB : null;
  }
}
