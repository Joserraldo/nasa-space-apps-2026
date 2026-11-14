# Estado — infra
**Actualizado:** 14 nov 2026, 12:50 · **Rama:** feat/infra-e2e-ci · **PR:** e2e en CI (este)
**Tokens:** 🟢

## Hecho (últimas iteraciones)
- Un solo Worker para pantalla y API, preview (develop) y producción (main) por Actions (#76, #78, #105); límite IA 20/min por IP.
- En develop: e2e de la ruta dorada (#80), guion del video (#79) y formulario (#81).
- e2e pasa contra el preview (`nasa-space-apps-2026-preview…workers.dev`) y contra Vite.
- Job `E2E ruta dorada` en `ci.yml`: cada PR y push a develop/main corre Playwright (solo Chromium, cacheado) contra Vite.

## Qué sigue
- Hacer obligatorio el check `E2E ruta dorada` en la protección de develop/main (Santiago).
- Antes de main: releer librerías del lockfile final (POR VERIFICAR en `pitch/formulario/atribuciones.md`).

## Bloqueos
- LICENSE del proyecto: decide José. #66 se puede cerrar (resuelto por #107 y #65): decide José.
