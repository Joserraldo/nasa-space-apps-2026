# Estado — infra
**Actualizado:** 14 nov 2026, 01:40 · **Rama:** feat/infra-login-progreso · **Responsable:** José (este paso lo hizo Santiago sobre #76 y #78, por decisión suya)
**Tokens:** 🟢

## Hecho
- Un solo Worker para pantalla y API (`infra/worker/`), producción y preview, con `/api/health` y `/api/clasificar` (#76).
- Despliegue automático por GitHub Actions a Workers (develop → preview, main → producción), solo si pasan tipos y pruebas (#78).
- Validado con `wrangler deploy --dry-run` en ambos entornos.

- Login opcional (sin correo) y progreso en D1: bases `solar-shield-preview` y `solar-shield-prod` creadas y con la migración 0001 aplicada.

## Qué sigue
- ui: pantalla de login / invitado y aviso al salir como invitado (María Paula).
- KV para el límite por IP del clasificador.

## Bloqueos
- El token de Cloudflare guardado en GitHub es válido pero no tiene acceso a la cuenta del Worker ("No access to the specified service"). Santiago debe crearlo desde la cuenta santiago031541.
