/** Música generada: acordes largos y un arpegio por encima. Cambia de tema con fundido. */
import { hz, nota, ruido } from "./sintesis";

export type Tema = "calma" | "curiosa" | "tension" | "final";

interface Receta {
  /** Segundos que dura cada acorde. */
  compas: number;
  acordes: readonly (readonly number[])[];
  /** Segundos entre notas del arpegio. */
  paso: number;
  volumenArpegio: number;
}

export const TEMAS: Record<Tema, Receta> = {
  calma: { compas: 6, paso: 0.75, volumenArpegio: 0.035, acordes: [[50, 57, 62, 66], [47, 54, 59, 62], [43, 50, 55, 59], [45, 52, 57, 61]] },
  curiosa: { compas: 4, paso: 0.4, volumenArpegio: 0.04, acordes: [[50, 57, 62, 66], [52, 59, 64, 68], [47, 54, 59, 62], [43, 50, 57, 59]] },
  tension: { compas: 3, paso: 0.3, volumenArpegio: 0.035, acordes: [[47, 54, 59, 62], [43, 50, 55, 58], [45, 52, 57, 60], [42, 49, 54, 57]] },
  final: { compas: 4, paso: 0.5, volumenArpegio: 0.05, acordes: [[43, 50, 55, 59], [45, 52, 57, 61], [50, 57, 62, 66]] },
};

export const FUNDIDO = 1.5;

/** Programa el compás `n` de un tema a partir del segundo `en`. */
export function programarCompas(ctx: BaseAudioContext, destino: AudioNode, tema: Tema, n: number, en: number): void {
  const { compas, acordes, paso, volumenArpegio } = TEMAS[tema];
  const acorde = acordes[n % acordes.length]!;
  acorde.forEach((midi, i) => {
    // Dos voces apenas desafinadas dan un colchón ancho.
    for (const desvio of [-0.08, 0.08])
      nota(ctx, destino, { hz: hz(midi + desvio), en, dura: compas * 1.25, volumen: i === 0 ? 0.07 : 0.035, onda: i === 0 ? "sine" : "triangle", ataque: compas * 0.35 });
  });
  for (let i = 0; i * paso < compas - 0.01; i++) {
    const midi = acorde[(i * 3 + n) % acorde.length]! + 12 + (i % 4 === 3 ? 12 : 0);
    nota(ctx, destino, { hz: hz(midi), en: en + i * paso, dura: paso * 2.2, volumen: volumenArpegio, onda: "sine" });
  }
}

/** Apertura de la intro: un grave que crece, un barrido y un destello de notas que sube. */
export function apertura(ctx: BaseAudioContext, destino: AudioNode, en: number): void {
  for (const midi of [26, 38, 45]) nota(ctx, destino, { hz: hz(midi), en, dura: 6, volumen: 0.12, onda: "sine", ataque: 1.8 });
  ruido(ctx, destino, { en, dura: 3.2, volumen: 0.07, corte: 200, hasta: 5000, ataque: 2.4 });
  [62, 66, 69, 74, 78, 81, 86].forEach((midi, i) =>
    nota(ctx, destino, { hz: hz(midi), en: en + 1.2 + i * 0.17, dura: 2.6, volumen: 0.07, onda: "sine" }));
  for (const midi of [62, 69, 74]) nota(ctx, destino, { hz: hz(midi), en: en + 2.4, dura: 4, volumen: 0.06, ataque: 0.5 });
}

export interface Reproductor {
  /** Cambia de tema con fundido; `null` deja silencio. */
  poner(tema: Tema | null): void;
  /** Programa lo que toca en los próximos segundos. Se llama a menudo. */
  avanzar(): void;
  readonly tema: Tema | null;
}

const ADELANTO = 1;

export function crearReproductor(ctx: BaseAudioContext, destino: AudioNode): Reproductor {
  let actual: { tema: Tema; canal: GainNode; siguiente: number; n: number } | null = null;
  const reproductor: Reproductor = {
    get tema() { return actual?.tema ?? null; },
    poner(tema) {
      if (tema === (actual?.tema ?? null)) return;
      const ahora = ctx.currentTime;
      if (actual) {
        const viejo = actual.canal;
        viejo.gain.setValueAtTime(viejo.gain.value, ahora);
        viejo.gain.linearRampToValueAtTime(0.0001, ahora + FUNDIDO);
      }
      actual = null;
      if (!tema) return;
      const canal = ctx.createGain();
      canal.gain.setValueAtTime(0.0001, ahora);
      canal.gain.linearRampToValueAtTime(1, ahora + FUNDIDO);
      canal.connect(destino);
      actual = { tema, canal, siguiente: ahora + 0.05, n: 0 };
      reproductor.avanzar();
    },
    avanzar() {
      if (!actual) return;
      // El tema final suena una vez; los demás se repiten.
      const tope = actual.tema === "final" ? TEMAS.final.acordes.length : Infinity;
      while (actual.n < tope && actual.siguiente < ctx.currentTime + ADELANTO) {
        programarCompas(ctx, actual.canal, actual.tema, actual.n, actual.siguiente);
        actual.siguiente += TEMAS[actual.tema].compas;
        actual.n++;
      }
    },
  };
  return reproductor;
}
