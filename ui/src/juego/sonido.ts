/**
 * Sonidos cortos del juego, hechos con el sintetizador del navegador (Web Audio): sin archivos,
 * sin descargas y sin dependencias. El interruptor "Sound on / Sound off" decide si suenan.
 *
 * Cada señal es una secuencia de notas suaves (onda triangular, volumen bajo) pensada para niños:
 * nada estridente. Si el navegador no tiene audio o lo bloquea, el juego sigue en silencio.
 */
export type Senal = "toque" | "confirmar" | "alerta" | "exito" | "fallo";

/** Una nota: frecuencia en Hz, cuándo empieza y cuánto dura (segundos). */
export type Nota = readonly [frecuencia: number, inicio: number, duracion: number];

export const SENALES: Record<Senal, readonly Nota[]> = {
  toque: [[660, 0, 0.09]],
  confirmar: [[523, 0, 0.09], [784, 0.09, 0.14]],
  alerta: [[440, 0, 0.16], [330, 0.2, 0.16], [440, 0.4, 0.16], [330, 0.6, 0.22]],
  exito: [[523, 0, 0.12], [659, 0.12, 0.12], [784, 0.24, 0.12], [1047, 0.36, 0.3]],
  fallo: [[392, 0, 0.18], [330, 0.18, 0.18], [262, 0.36, 0.34]],
};

const VOLUMEN = 0.12;

/** Lo mínimo de `AudioContext` que usa el juego; así se puede probar con uno falso. */
export interface ContextoAudio {
  currentTime: number;
  state: string;
  destination: unknown;
  resume(): Promise<void>;
  createOscillator(): {
    type: string;
    frequency: { value: number };
    connect(destino: unknown): unknown;
    start(cuando?: number): void;
    stop(cuando?: number): void;
  };
  createGain(): {
    gain: {
      setValueAtTime(valor: number, cuando: number): unknown;
      linearRampToValueAtTime(valor: number, cuando: number): unknown;
    };
    connect(destino: unknown): unknown;
  };
}

type Fabrica = () => ContextoAudio | null;

let contexto: ContextoAudio | null = null;

/** El contexto se crea con el primer sonido (los navegadores exigen un gesto del jugador antes). */
const fabricaDelNavegador: Fabrica = () => {
  const Clase = (globalThis as { AudioContext?: new () => ContextoAudio }).AudioContext;
  return Clase ? new Clase() : null;
};

/**
 * Toca una señal si el sonido está encendido. Devuelve cuántas notas programó (0 si no sonó),
 * para poder comprobarlo en las pruebas.
 */
export function tocar(senal: Senal, encendido: boolean, fabrica: Fabrica = fabricaDelNavegador): number {
  if (!encendido) return 0;
  try {
    contexto ??= fabrica();
    const ctx = contexto;
    if (!ctx) return 0;
    if (ctx.state === "suspended") void ctx.resume().catch(() => undefined);
    const ahora = ctx.currentTime;
    for (const [frecuencia, inicio, duracion] of SENALES[senal]) {
      const oscilador = ctx.createOscillator();
      const ganancia = ctx.createGain();
      oscilador.type = "triangle";
      oscilador.frequency.value = frecuencia;
      // Subida y bajada cortas: sin chasquidos al empezar ni al cortar.
      ganancia.gain.setValueAtTime(0, ahora + inicio);
      ganancia.gain.linearRampToValueAtTime(VOLUMEN, ahora + inicio + 0.02);
      ganancia.gain.linearRampToValueAtTime(0, ahora + inicio + duracion);
      oscilador.connect(ganancia);
      ganancia.connect(ctx.destination);
      oscilador.start(ahora + inicio);
      oscilador.stop(ahora + inicio + duracion + 0.02);
    }
    return SENALES[senal].length;
  } catch {
    return 0;
  }
}

/** Solo para pruebas: olvida el contexto creado. */
export function reiniciarSonido(): void {
  contexto = null;
}
