/** Efectos por evento (docs/referenciapau/AUDIO.md §4 y los de la intro). Todos generados por código. */
import { nota, ruido } from "./sintesis";

export type Efecto =
  | "boton" | "aceptada" | "rechazada" | "gasto" | "beneficio" | "dano" | "recursoBajo" | "alerta"
  | "irisDanada" | "moduloInstalado" | "moduloOperativo" | "telemetriaEnviada" | "telemetriaRecibida" | "paso"
  | "motor" | "pulso" | "iris" | "clic" | "mapa" | "confirmar";

type Receta = (ctx: BaseAudioContext, destino: AudioNode, en: number) => void;

const notas = (lista: readonly [number, number, number][], volumen = 0.18, onda: OscillatorType = "triangle"): Receta =>
  (ctx, destino, en) => lista.forEach(([f, d, dura]) => nota(ctx, destino, { hz: f, en: en + d, dura, volumen, onda }));

/** Cada receta con su duración en segundos. Ninguna es estridente ni se repite en bucle. */
export const EFECTOS: Record<Efecto, { dura: number; receta: Receta }> = {
  boton: { dura: 0.08, receta: notas([[620, 0, 0.08]], 0.1) },
  clic: { dura: 0.12, receta: (c, d, en) => { ruido(c, d, { en, dura: 0.05, volumen: 0.12, corte: 2400 }); nota(c, d, { hz: 420, en: en + 0.03, dura: 0.09, volumen: 0.1 }); } },
  aceptada: { dura: 0.24, receta: notas([[523, 0, 0.1], [784, 0.09, 0.15]]) },
  rechazada: { dura: 0.24, receta: notas([[220, 0, 0.12], [196, 0.1, 0.14]], 0.16, "sine") },
  gasto: { dura: 0.28, receta: (c, d, en) => nota(c, d, { hz: 520, hasta: 260, en, dura: 0.28, volumen: 0.16 }) },
  beneficio: { dura: 0.28, receta: (c, d, en) => nota(c, d, { hz: 330, hasta: 760, en, dura: 0.28, volumen: 0.15 }) },
  dano: { dura: 0.28, receta: (c, d, en) => { ruido(c, d, { en, dura: 0.25, volumen: 0.3, corte: 320, hasta: 80 }); nota(c, d, { hz: 90, hasta: 55, en, dura: 0.28, volumen: 0.2, onda: "sine" }); } },
  recursoBajo: { dura: 0.4, receta: notas([[392, 0, 0.16], [294, 0.18, 0.22]], 0.17) },
  alerta: { dura: 0.9, receta: notas([[587, 0, 0.35], [440, 0.42, 0.45]], 0.2) },
  irisDanada: { dura: 0.3, receta: (c, d, en) => [740, 210, 990, 160, 520].forEach((f, i) => nota(c, d, { hz: f, en: en + i * 0.055, dura: 0.05, volumen: 0.09, onda: "square" })) },
  moduloInstalado: { dura: 0.2, receta: (c, d, en) => { ruido(c, d, { en, dura: 0.07, volumen: 0.16, corte: 1500 }); nota(c, d, { hz: 262, en: en + 0.06, dura: 0.14, volumen: 0.14 }); } },
  moduloOperativo: { dura: 0.3, receta: notas([[392, 0, 0.1], [523, 0.08, 0.1], [659, 0.16, 0.14]], 0.14) },
  telemetriaEnviada: { dura: 0.3, receta: (c, d, en) => nota(c, d, { hz: 880, hasta: 1320, en, dura: 0.3, volumen: 0.12, onda: "sine" }) },
  telemetriaRecibida: { dura: 0.45, receta: notas([[1047, 0, 0.14], [784, 0.12, 0.12], [1319, 0.24, 0.2]], 0.13, "sine") },
  paso: { dura: 0.08, receta: (c, d, en) => ruido(c, d, { en, dura: 0.08, volumen: 0.04, corte: 500 }) },
  motor: { dura: 5.5, receta: (c, d, en) => { ruido(c, d, { en, dura: 5.5, volumen: 0.28, corte: 90, hasta: 420, ataque: 1.4 }); nota(c, d, { hz: 44, hasta: 58, en, dura: 5.5, volumen: 0.18, onda: "sine", ataque: 1.6 }); } },
  pulso: { dura: 0.8, receta: (c, d, en) => [0, 0.4].forEach((t) => nota(c, d, { hz: 523, en: en + t, dura: 0.35, volumen: 0.09, onda: "sine" })) },
  iris: { dura: 0.6, receta: notas([[659, 0, 0.14], [880, 0.12, 0.14], [1319, 0.26, 0.3]], 0.12, "sine") },
  mapa: { dura: 0.7, receta: (c, d, en) => [523, 659, 784, 1047, 1319].forEach((f, i) => nota(c, d, { hz: f, en: en + i * 0.1, dura: 0.25, volumen: 0.08, onda: "sine" })) },
  confirmar: { dura: 0.35, receta: notas([[440, 0, 0.12], [659, 0.1, 0.22]], 0.18) },
};

export const MAXIMO_SIMULTANEOS = 3;

/** Lleva la cuenta de lo que suena: como máximo tres efectos a la vez y ninguno repetido encima de sí. */
export function crearEfectos(ctx: BaseAudioContext, destino: AudioNode) {
  let sonando: { efecto: Efecto; fin: number }[] = [];
  return {
    tocar(efecto: Efecto): boolean {
      const ahora = ctx.currentTime;
      sonando = sonando.filter((s) => s.fin > ahora);
      if (sonando.length >= MAXIMO_SIMULTANEOS || sonando.some((s) => s.efecto === efecto)) return false;
      const { dura, receta } = EFECTOS[efecto];
      receta(ctx, destino, ahora + 0.01);
      sonando.push({ efecto, fin: ahora + dura });
      return true;
    },
  };
}
