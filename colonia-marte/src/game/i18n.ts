/**
 * Textos del juego en dos idiomas. Inglés es la base y el respaldo; el español se elige en Ajustes.
 * Portado de `ui/src/i18n.ts`, sin React.
 */
import agentesEn from "../../../agents/i18n/en.json";
import agentesEs from "../../../agents/i18n/es.json";
import datosEn from "../../../data/i18n/en.json";
import datosEs from "../../../data/i18n/es.json";
import disenoEn from "../../../design/i18n/en.json";
import disenoEs from "../../../design/i18n/es.json";
import juegoEn from "../../data/story/i18n/en.json";
import juegoEs from "../../data/story/i18n/es.json";
import { TEXTOS_JEZERO, TEXTOS_VIAJE_MARTE } from "../../../missions/src/textos";
import { getUiStrings } from "../ui/i18n";

export type Idioma = "en" | "es";
export type Vars = Record<string, string | number>;

const DICCIONARIOS: Record<Idioma, Record<string, string>> = {
  en: { ...agentesEn, ...datosEn, ...disenoEn, ...TEXTOS_JEZERO.en, ...TEXTOS_VIAJE_MARTE.en, ...juegoEn },
  es: { ...agentesEs, ...datosEs, ...disenoEs, ...TEXTOS_JEZERO.es, ...TEXTOS_VIAJE_MARTE.es, ...juegoEs },
};

export function existe(clave: string, idioma: Idioma = "en"): boolean {
  return Object.hasOwn(DICCIONARIOS[idioma], clave);
}

/**
 * Traduce una clave; si falta en el idioma pedido usa el inglés, y si tampoco está devuelve la clave.
 * Una variable cuyo nombre termina en `Key` es otra clave que también se traduce (convención de agents/).
 */
export function traducir(idioma: Idioma, clave: string, vars?: Vars): string {
  const texto = DICCIONARIOS[idioma][clave] ?? DICCIONARIOS.en[clave];
  if (texto === undefined) return clave;
  if (!vars) return texto;
  return Object.entries(vars).reduce((salida, [nombre, valor]) => {
    const puesto = nombre.endsWith("Key") && typeof valor === "string" ? traducir(idioma, valor) : String(valor);
    return salida.split(`{${nombre}}`).join(puesto);
  }, texto);
}

/**
 * Los textos fijos de los componentes (contrato de B1, docs/ui-i18n-contrato.md): el catálogo de la
 * vista y, encima, los `componente.*` del juego.
 */
export function textosDeComponentes(idioma: Idioma): Record<string, string> {
  const propios = Object.keys(juegoEn).filter((k) => k.startsWith("componente.")).map((k) => [k, traducir(idioma, k)]);
  return { ...getUiStrings(idioma), ...Object.fromEntries(propios) };
}

/** Idioma elegido en Ajustes; cualquier otro valor es inglés. */
export function idiomaDe(ajustes: object): Idioma {
  return (ajustes as { language?: unknown }).language === "es" ? "es" : "en";
}
