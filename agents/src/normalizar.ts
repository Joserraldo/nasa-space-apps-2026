/**
 * Normaliza una frase de niño antes de los regex: minúsculas, sin tildes ni signos,
 * letras repetidas recortadas ("ayudaaa" -> "ayuda") y jerga corta expandida.
 */
const JERGA: Record<string, string> = {
  q: "que",
  k: "que",
  xq: "porque",
  pq: "porque",
  porfa: "por favor",
  pls: "please",
  plz: "please",
  u: "you",
};

export function normalizar(texto: string): string {
  const base = texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9ñ\s']/g, " ")
    .replace(/(.)\1{2,}/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  return base
    .split(" ")
    .map((p) => JERGA[p] ?? p)
    .join(" ");
}

/** Signos de urgencia ("!!!", "ya", "now") que suben la cantidad a "mucho". */
export function esUrgente(texto: string): boolean {
  return /!{2,}/.test(texto) || /\b(ya|rapido|now|asap)\b/.test(normalizar(texto));
}
