---
name: solar-shield-i18n
description: Añadir o cambiar textos visibles de Solar Shield (inglés base, español segundo). Usar al crear una clave de texto nueva o al tocar cualquier archivo i18n.
---

1. Escribe primero el texto en `en.json` del paquete dueño de la clave (`design/i18n`, `missions/i18n`, `agents/i18n`, `data/i18n`); después la misma clave en `es.json`.
2. Convención: `clave` es el título corto y `clave.desc` la frase que explica (1–2 frases, niños de 7–12 años, sin jerga; un término científico se explica en la misma frase).
3. No cambies una clave existente: el motor las escribe en el estado. Añade o corrige el texto.
4. Ninguna cifra ni afirmación científica sin su fuente marcada [V] en `docs/science/fuentes.md`.
5. Comprueba: `npx vitest run missions/src/i18n.test.ts` (paridad en/es y cobertura de las claves que usa el código).
