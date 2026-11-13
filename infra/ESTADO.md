# Estado — infra (integración, QA, despliegue y pitch)
**Actualizado:** 13 nov 2026, tarde · **Responsable:** José (desde el 13 nov; antes Santiago)
**Tokens:** por reportar

## Hecho (últimas iteraciones)
- CI de tipos y tests en cada PR (#22).
- Secreto `BAI_API_KEY` guardado en el repo (clave del clasificador); ningún flujo lo usa todavía.
- Borrador de `pitch/criterios.md`.

## Qué sigue
- Flujo de despliegue a Cloudflare desde GitHub Actions (cuando Santiago tenga la cuenta: token e ID como secretos del repo).
- Incluir `data/` en el CI (#28; el PR #39 de datos prepara su parte).
- Prueba e2e de la ruta dorada escrita (Playwright, ver tests/README.md); conectar al CI cuando se mezcle #68.

## Bloqueos
- Cuenta de Cloudflare (Santiago). Guía de Entrega y criterios de juicio sin confirmar.
