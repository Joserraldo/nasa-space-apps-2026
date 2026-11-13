# Estado — infra (integración, QA, despliegue y pitch)
**Actualizado:** 13 nov 2026, noche · **Responsable:** José · **Rama:** feat/infra-worker-clasificador
**Tokens:** 🟢

## Hecho (últimas iteraciones)
- CI de tipos y tests en cada PR (#22), con `data/` (#46).
- Worker `/api/clasificar` (`infra/worker`): regex primero, modelo solo si no entiende; clave solo del entorno; límite por IP con hash; 5 tests con modelo falso (sin costo).
- Borrador de `pitch/criterios.md`.

## Qué sigue
- Despliegue a Cloudflare Pages desde Actions (preview `develop`, producción `main`) y `wrangler deploy` del Worker.
- Prueba e2e de la ruta dorada cuando ui tenga la pantalla (#68).

## Bloqueos
- Cuenta de Cloudflare (Santiago): secretos `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID`. Namespace KV.
