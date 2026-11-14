---
name: solar-shield-qa
description: Verificar un cambio de Solar Shield antes de abrir o actualizar un PR.
---

1. `npm run typecheck`.
2. `npm test` (o `npx vitest run <carpeta>` si solo tocaste una).
3. La semilla dorada: `npx vitest run engine/src/dorada`. Es la partida del video; no se rompe.
4. Si tocaste textos: `npx vitest run missions/src/i18n.test.ts`.
5. `git status`: nada fuera de las carpetas de tu rol, ningún `.env*`, ninguna clave.
6. En el PR pega el resultado real (número de pruebas que pasan). Si algo falla, dilo con la salida del error.

Ojo: `vitest.config.ts` solo corre pruebas de `contracts`, `engine`, `missions`, `agents` y `data/test`.
