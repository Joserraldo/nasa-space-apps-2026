# Estado — infra
**Actualizado:** 15 nov 2026, 00:40 · **Rama:** feat/infra-preview-escenarios · **PR:** #207 (aprobado por el revisor, falta fusión humana)
**Tokens:** verde

## Hecho (últimas iteraciones)
- #151 fusionado en develop; la CI (`ci.yml`) ya corre en PRs y push a `feat/ui-escenarios`.
- Contrato de props de `EscenaBase` cerrado (#190), con `eventos` de Daniel.
- Preview del rediseño: entorno `escenarios` en `wrangler.jsonc` (Worker `nasa-space-apps-2026-escenarios`, base de preview, límite propio) y pasos en `deploy.yml` para push a `feat/ui-escenarios`. `--dry-run` en verde.

## Qué sigue
- Tras fusionar: llevar develop a `feat/ui-escenarios` (el push usa el `deploy.yml` de esa rama) y comprobar la URL en celular.
- Pantallas nuevas (front-integracion tarea 0) cuando entren `tokens.ts` y Nunito de Jaime.

## Bloqueos
- Pantallas esperan #208 y #209 de Jaime (tokens y base sin estilos.css). LICENSE y cierre de #66: decide José.
