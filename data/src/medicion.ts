/**
 * Regla única para medir una tormenta con un dosímetro de RadLab (RAD en Marte, CRaTER en la Luna).
 * Es la misma de scripts/curar.ts (medicionMarte), escrita como función pura para poder reutilizarla:
 *  fondo = media de las muestras en los 5 días antes de t0; pico = la mayor media diaria (UTC)
 *  en los 3 días después; factor = pico / fondo. Solo si hay ≥ 20 muestras en cada lado.
 */
const DIA_MS = 86_400_000;
const r1 = (x: number) => Math.round(x * 10) / 10;

export interface Medida {
  fondo: number;
  pico: number;
  picoMuestra: number;
  diaPico: string;
  factor: number;
}

/** `muestras`: pares [timestamp UTC de RadLab sin "Z", µGy/h]. */
export function medirAlrededor(muestras: readonly (readonly [string, number])[], t0: string): Medida | undefined {
  const ini = Date.parse(t0);
  const m = muestras.map(([ts, v]) => ({ t: Date.parse(`${ts}Z`), dia: ts.slice(0, 10), v }));
  const antes = m.filter((x) => x.t >= ini - 5 * DIA_MS && x.t < ini);
  const despues = m.filter((x) => x.t >= ini && x.t < ini + 3 * DIA_MS);
  if (antes.length < 20 || despues.length < 20) return undefined;
  const media = (v: number[]) => v.reduce((s, x) => s + x, 0) / v.length;
  const fondo = media(antes.map((x) => x.v));
  const porDia = new Map<string, number[]>();
  for (const x of despues) porDia.set(x.dia, [...(porDia.get(x.dia) ?? []), x.v]);
  const mejor = [...porDia].sort((a, b) => media(b[1]) - media(a[1]))[0];
  if (!mejor) return undefined;
  const [diaPico, valores] = mejor;
  const pico = media(valores);
  return { fondo: r1(fondo), pico: r1(pico), picoMuestra: r1(Math.max(...valores)), diaPico, factor: r1(pico / fondo) };
}
