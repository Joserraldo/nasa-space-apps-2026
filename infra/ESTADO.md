# Estado — infra
**Actualizado:** 14 nov 2026, 12:30 · **Rama:** feat/infra-e2e-ruta-dorada · **Responsable:** José
**Tokens:** 🟢

## Hecho
- Un solo Worker para pantalla y API (`infra/worker/`), con despliegue automático por Actions: `develop` → preview, `main` → producción (#105). Los últimos despliegues de `develop` y `main` salieron en verde.
- Clave de la IA copiada de GitHub al Worker en cada despliegue y límite de 20/min por IP con el limitador nativo de Cloudflare (#106). Login opcional con progreso en D1 (#108, Santiago).
- Los 4 PRs que estaban en conflicto, puestos al día con `develop` usando merge (sin force push): #74, #79, #80 y #81. #81 ya describe el Worker único, el limitador y el login en D1.
- e2e de la ruta dorada (#80) pasa en local contra la `ui` de `develop`: `npm run e2e` (1 test, ~3 s).

## Qué sigue
- Correr el e2e contra la URL de preview (`E2E_BASE_URL=<url> npm run e2e`) y conectarlo al CI.
- Grabar el video con la URL de preview (`pitch/guion-video.md`, #79) y pasar `develop` → `main`.
- Cerrar #66 (lo resolvieron #107 y #65) y marcar lo hecho en #60.

## Bloqueos
- Ninguno.
