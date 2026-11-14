import { createContext, useContext } from "react";
import agentesEn from "../../agents/i18n/en.json";
import agentesEs from "../../agents/i18n/es.json";
import datosEn from "../../data/i18n/en.json";
import datosEs from "../../data/i18n/es.json";
import uiEn from "../i18n/en.json";
import uiEs from "../i18n/es.json";

export type Idioma = "en" | "es";

const DICCIONARIOS: Record<Idioma, Record<string, string>> = {
  en: { ...agentesEn, ...datosEn, ...uiEn },
  es: { ...agentesEs, ...datosEs, ...uiEs },
};

export type Vars = Record<string, string | number> | undefined;

/**
 * Traduce una clave. Inglés es la base y el respaldo. Las claves del motor (`causa.*`, `ia.*`,
 * `mala_suerte.*`, `rango.*`, `insignia.*`) se buscan con el prefijo `ui.`.
 * Una variable cuyo nombre termina en `Key` es otra clave que también se traduce (convención de agentes).
 */
export function traducir(idioma: Idioma, clave: string, vars?: Vars): string {
  const d = DICCIONARIOS[idioma];
  const base = DICCIONARIOS.en;
  let texto = d[clave] ?? base[clave] ?? d[`ui.${clave}`] ?? base[`ui.${clave}`];
  if (texto === undefined) return clave;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      const valor = k.endsWith("Key") && typeof v === "string" ? traducir(idioma, v) : String(v);
      texto = texto.split(`{${k}}`).join(valor);
    }
  }
  return texto;
}

export const IdiomaContext = createContext<Idioma>("en");

export function useT() {
  const idioma = useContext(IdiomaContext);
  return {
    idioma,
    t: (clave: string, vars?: Vars) => traducir(idioma, clave, vars),
  };
}
