/** Piezas de síntesis. Sirven en un AudioContext normal y en uno sin conexión (para medirlas). */

/** Una nota con ataque y caída suaves. `hasta` desliza el tono. */
export function nota(ctx: BaseAudioContext, destino: AudioNode, opciones: {
  hz: number; en: number; dura: number; volumen: number; onda?: OscillatorType; ataque?: number; hasta?: number;
}): void {
  const { hz, en, dura, volumen, onda = "triangle", ataque = Math.min(0.02, dura / 4), hasta } = opciones;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = onda;
  osc.frequency.setValueAtTime(hz, en);
  if (hasta) osc.frequency.exponentialRampToValueAtTime(hasta, en + dura);
  gain.gain.setValueAtTime(0.0001, en);
  gain.gain.linearRampToValueAtTime(volumen, en + ataque);
  gain.gain.exponentialRampToValueAtTime(0.0001, en + dura);
  osc.connect(gain);
  gain.connect(destino);
  osc.start(en);
  osc.stop(en + dura + 0.05);
}

/** Ruido filtrado (motor, golpe, interferencia). El ruido es determinista. */
export function ruido(ctx: BaseAudioContext, destino: AudioNode, opciones: {
  en: number; dura: number; volumen: number; corte: number; hasta?: number; ataque?: number;
}): void {
  const { en, dura, volumen, corte, hasta, ataque = 0.02 } = opciones;
  const largo = Math.ceil(ctx.sampleRate * dura);
  const buffer = ctx.createBuffer(1, largo, ctx.sampleRate);
  const datos = buffer.getChannelData(0);
  let semilla = 22695477;
  for (let i = 0; i < largo; i++) {
    semilla = (semilla * 48271) % 2147483647;
    datos[i] = (semilla / 2147483647) * 2 - 1;
  }
  const fuente = ctx.createBufferSource();
  const filtro = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  fuente.buffer = buffer;
  filtro.type = "lowpass";
  filtro.frequency.setValueAtTime(corte, en);
  if (hasta) filtro.frequency.exponentialRampToValueAtTime(hasta, en + dura);
  gain.gain.setValueAtTime(0.0001, en);
  gain.gain.linearRampToValueAtTime(volumen, en + Math.min(ataque, dura / 2));
  gain.gain.exponentialRampToValueAtTime(0.0001, en + dura);
  fuente.connect(filtro);
  filtro.connect(gain);
  gain.connect(destino);
  fuente.start(en);
  fuente.stop(en + dura + 0.05);
}

/** Frecuencia de una nota MIDI (69 = La de 440 Hz). */
export const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
