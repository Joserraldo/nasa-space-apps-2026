/**
 * Genera `tokens.css` desde `tokens.ts` (la fuente única). Uso: `npx tsx ui/src/estilos/generar-tokens-css.ts`.
 * `tokens.test.ts` falla si alguien edita uno sin el otro.
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { variablesCss } from "./tokens.js";

export function tokensCss(): string {
  const cuerpo = Object.entries(variablesCss()).map(([k, x]) => `  ${k}: ${x};`).join("\n");
  return `/*
 * Tokens v8 (DISEÑO §2, APLICACION §5 y §7). NO se edita a mano: la fuente es tokens.ts.
 * Para cambiar un valor: edita tokens.ts y corre \`npx tsx ui/src/estilos/generar-tokens-css.ts\`.
 * tokens.test.ts falla si este archivo y tokens.ts no coinciden.
 */

/* Nunito y Nunito Italic (SIL OFL 1.1), variables 200 a 1000, subconjunto latin (cubre el español).
   Se sirven desde el juego: funciona sin conexión y no manda datos de niños a terceros (DISEÑO §2.4). */
@font-face {
  font-family: "Nunito";
  font-style: normal;
  font-weight: 200 1000;
  font-display: swap;
  src: url("/fuentes/nunito-latin.woff2") format("woff2");
}
@font-face {
  font-family: "Nunito";
  font-style: italic;
  font-weight: 200 1000;
  font-display: swap;
  src: url("/fuentes/nunito-italic-latin.woff2") format("woff2");
}

:root {
${cuerpo}
}
`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  writeFileSync(new URL("./tokens.css", import.meta.url), tokensCss());
}
