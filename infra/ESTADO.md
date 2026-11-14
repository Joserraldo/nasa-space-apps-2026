# Estado — infra
**Actualizado:** 14 nov 2026, 00:45 · **Rama:** feat/infra-worker-app · **Responsable:** José (este paso lo hizo Santiago sobre #76 y #78, por decisión suya)
**Tokens:** 🟢

## Hecho
- Un solo Worker para pantalla y API (`infra/worker/`), producción y preview, con `/api/health` y `/api/clasificar` (#76).
- Despliegue automático por GitHub Actions a Workers (develop → preview, main → producción), solo si pasan tipos y pruebas (#78).
- Validado con `wrangler deploy --dry-run` en ambos entornos.

## Qué sigue
- Login + invitado con progreso en D1.

## Bloqueos
- Secretos de Cloudflare en el repo (José) y desconectar el Worker de la copia kcitas (Santiago).
