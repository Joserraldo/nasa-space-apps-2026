# Estado — infra
**Actualizado:** 15 nov 2026, 00:25 · **Rama:** feat/infra-preview-escenarios · **PR:** ver abajo
**Tokens:** verde

## Hecho (últimas iteraciones)
- #151 fusionado en develop; la CI (`ci.yml`) ya corre en PRs y push a `feat/ui-escenarios`.
- Preview del rediseño: entorno `escenarios` en `wrangler.jsonc` (Worker `nasa-space-apps-2026-escenarios`, base de preview, límite propio) y pasos en `deploy.yml` para push a `feat/ui-escenarios`. `--dry-run` en verde.

## Qué sigue
- Tras fusionar: llevar develop a `feat/ui-escenarios` (el push usa el `deploy.yml` de esa rama) y comprobar la URL en celular.
- Pantallas nuevas (front-integracion tarea 0) cuando entren `tokens.ts` y Nunito de Jaime.

## Bloqueos
- Pantallas esperan tokens de Jaime. LICENSE y cierre de #66: decide José.
