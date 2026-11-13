# Worker `/api/clasificar` (capa 2 del clasificador)

`POST { "texto": "..." }` → `ClassifierOutput` validado con Zod. El juego funciona sin él: si falla o no hay clave, ui usa los atajos y botones.

- **Orden:** regex de `agents` (gratis) → solo si no entiende, el modelo (b.ai, `qwen3.8-flash`).
- **Clave:** solo `env.BAI_API_KEY` (`npx wrangler secret put BAI_API_KEY`). Nunca en el repo ni en el navegador.
- **Privacidad:** al modelo solo le llega la frase. El límite por IP (20/min) guarda un hash, no la IP.
- **Entrada:** máx. 200 caracteres; otro método → 405.
- **Sin Hono:** un `fetch` plano basta para una ruta y evita una dependencia.

## Probar
`npm test` corre `src/clasificar.test.ts` con un modelo falso: **cero llamadas con costo**.

## Pendiente
- Crear el namespace KV y descomentar el bloque en `wrangler.toml`.
- Llamar al modelo de verdad solo tras P2 y dentro del tope de gasto (D4/D10).
