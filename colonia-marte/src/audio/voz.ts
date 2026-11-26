/** Lectura en voz alta con speechSynthesis. Lee `data-voice-line` en el idioma elegido. */
import type { HablanteId } from "../game/hablantes";
import type { Idioma } from "../game/i18n";

/** Variación leve para distinguir personajes; no imita a nadie. */
const TIMBRES: Partial<Record<HablanteId, { tono: number; ritmo: number }>> = {
  iris: { tono: 1.35, ritmo: 1 },
  tess: { tono: 0.95, ritmo: 1 },
  nia: { tono: 1.1, ritmo: 0.93 },
  vera: { tono: 1.2, ritmo: 1.05 },
  teo: { tono: 0.85, ritmo: 0.95 },
  control: { tono: 0.9, ritmo: 0.9 },
};

export interface Sintesis {
  getVoices(): { lang: string; localService?: boolean; default?: boolean }[];
  speak(frase: SpeechSynthesisUtterance): void;
  cancel(): void;
}

/** La voz del navegador para el idioma: primero la local de en-US o es, luego cualquiera del idioma. */
export function elegirVoz<V extends { lang: string; localService?: boolean }>(voces: readonly V[], idioma: Idioma): V | null {
  const delIdioma = voces.filter((v) => v.lang.toLowerCase().replace("_", "-").startsWith(idioma));
  const preferidas = idioma === "en" ? ["en-us"] : ["es-us", "es-419", "es-co", "es-mx", "es-es"];
  const puntos = (v: V) => {
    const i = preferidas.indexOf(v.lang.toLowerCase().replace("_", "-"));
    return (i < 0 ? 0 : preferidas.length - i) * 2 + (v.localService ? 1 : 0);
  };
  return [...delIdioma].sort((a, b) => puntos(b) - puntos(a))[0] ?? null;
}

export function crearVoz(opciones: {
  sintesis: Sintesis | null;
  crearFrase: (texto: string) => SpeechSynthesisUtterance;
  volumen: () => number;
  idioma: () => Idioma;
  /** Para bajar la música mientras habla. */
  alHablar: (hablando: boolean) => void;
  /** Reproduce la grabación del texto; devuelve cómo callarla, o null si no hay. */
  grabada?: (texto: string, idioma: Idioma, alTerminar: () => void) => (() => void) | null;
}) {
  const { sintesis, crearFrase, volumen, idioma, alHablar, grabada } = opciones;
  let activa: SpeechSynthesisUtterance | null = null;
  let parar: (() => void) | null = null;
  let turno = 0;
  let abierta = false;
  const callar = () => {
    turno++;
    activa = null;
    parar?.();
    parar = null;
    sintesis?.cancel();
    alHablar(false);
  };
  return {
    /** El primer toque del niño habilita la voz. */
    desbloquear() { abierta = true; },
    callar,
    /** Lee un texto y corta el anterior. Devuelve false si no se puede o la voz está apagada. */
    decir(texto: string, quien?: HablanteId | null): boolean {
      if (!abierta || !texto.trim() || volumen() <= 0) return false;
      callar();
      const lengua = idioma();
      const mio = turno;
      parar = grabada?.(texto, lengua, () => { if (mio === turno) { parar = null; alHablar(false); } }) ?? null;
      if (parar) { alHablar(true); return true; }
      if (!sintesis) return false;
      const frase = crearFrase(texto);
      const voz = elegirVoz(sintesis.getVoices(), lengua);
      // Con la lista cargada y sin voz del idioma se deja solo el texto, en vez de leerlo mal.
      if (!voz && sintesis.getVoices().length) return false;
      if (voz) frase.voice = voz as SpeechSynthesisVoice;
      frase.lang = voz?.lang ?? (lengua === "es" ? "es-US" : "en-US");
      const timbre = (quien && TIMBRES[quien]) || { tono: 1, ritmo: 0.95 };
      frase.pitch = timbre.tono;
      frase.rate = timbre.ritmo;
      frase.volume = volumen();
      const terminar = () => { if (activa === frase) { activa = null; alHablar(false); } };
      frase.onend = terminar;
      frase.onerror = terminar;
      activa = frase;
      alHablar(true);
      sintesis.speak(frase);
      return true;
    },
  };
}

export type Voz = ReturnType<typeof crearVoz>;

/** Texto de voz del elemento tocado: el `data-voice-line` más cercano. */
export function lineaDeVoz(destino: { closest(selector: string): { getAttribute(nombre: string): string | null } | null } | null): string | null {
  return destino?.closest("[data-voice-line]")?.getAttribute("data-voice-line") ?? null;
}

/**
 * Lee lo que toca el niño y, solas, las líneas nuevas de los diálogos y subtítulos.
 * Devuelve la función que quita los escuchas.
 */
export function conectarVoz(raiz: HTMLElement, voz: Voz): () => void {
  const SOLAS = ".ui-crew-dialogue__line, [data-leer]";
  const dichas = new WeakMap<Element, string>();
  const tocar = (evento: Event) => {
    const texto = lineaDeVoz(evento.target as Element | null);
    if (texto) voz.decir(texto);
  };
  const revisar = () => {
    for (const nodo of raiz.querySelectorAll(SOLAS)) {
      const texto = nodo.getAttribute("data-voice-line");
      if (!texto || dichas.get(nodo) === texto) continue;
      dichas.set(nodo, texto);
      voz.decir(texto, nodo.closest("[data-hablante]")?.getAttribute("data-hablante") as HablanteId | undefined);
    }
  };
  const observador = new MutationObserver(revisar);
  observador.observe(raiz, { subtree: true, childList: true, attributes: true, attributeFilter: ["data-voice-line"] });
  // En captura: se lee lo tocado antes de que el botón cambie la pantalla, y la línea nueva lo reemplaza.
  // Al revés, el nombre del botón cortaba lo que dice el personaje.
  raiz.addEventListener("click", tocar, true);
  revisar();
  return () => { observador.disconnect(); raiz.removeEventListener("click", tocar, true); voz.callar(); };
}
