# Estado — infra
**Actualizado:** 14 nov 2026, 01:10 · **Rama:** feat/infra-clave-ia-limite · **Responsable:** José
**Tokens:** 🟢

## Hecho
- Un solo Worker para pantalla y API (`infra/worker/`), producción y preview (#76), despliegue automático por Actions (#78, #105).
- Secretos `CLOUDFLARE_ACCOUNT_ID` y `CLOUDFLARE_API_TOKEN` guardados en GitHub.
- `deploy.yml` copia `BAI_API_KEY` de GitHub al Worker en cada despliegue.
- Límite de la IA activo: 20/min por IP con el limitador nativo de Cloudflare (antes dependía de un KV que nunca se conectó).

## Qué sigue
- Login + invitado con progreso en D1.

## Bloqueos
- El primer despliegue con el token falló con "Invalid access token": revisar el token con Santiago y volver a guardarlo.
- Desconectar el Worker de la copia kcitas (Santiago).
