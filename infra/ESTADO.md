# Estado — infra (integración, QA, despliegue y pitch)
**Actualizado:** 13 nov 2026, noche · **Responsable:** José · **Rama:** feat/infra-deploy-pages
**Tokens:** por reportar

## Hecho (últimas iteraciones)
- CI de tipos y tests en cada PR (#22).
- Secreto `BAI_API_KEY` guardado en el repo (clave del clasificador); ningún flujo lo usa todavía.
- Borrador de `pitch/criterios.md`.

## Qué sigue
- Despliegue a Pages escrito (`.github/workflows/deploy.yml`, página de espera): se activa solo al guardar los secretos de Cloudflare.
- Incluir `data/` en el CI (#28; el PR #39 de datos prepara su parte).
- Prueba e2e de la ruta dorada cuando exista la pantalla.

## Bloqueos
- Cuenta de Cloudflare (Santiago). Guía de Entrega y criterios de juicio sin confirmar.
