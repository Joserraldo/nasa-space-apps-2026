# Orden de merge del 14 de noviembre

**Rol que propone:** infra (José) · **Quien fusiona:** Santiago (`kcitas`) · **Estado:** propuesta · **Fecha:** 2026-11-13, 23:30

## Por qué
Hay 20 PRs abiertos, casi todos en verde, y `develop` no recibe nada desde el 13 a las 22:50. En `develop` todavía no hay pantalla (`ui/` solo tiene su README) ni despliegue. El jurado ve una URL y un video, no PRs. **Objetivo del bloque:** la ruta dorada jugable en la URL de preview antes del mediodía del 14.

## Reglas del tren
- Uno a la vez: fusionar, esperar el CI verde en `develop` y seguir con el siguiente.
- Squash merge. Borrar la rama al fusionar: así GitHub mueve a `develop` los PRs que estaban apilados encima.
- Si un PR entra en conflicto, se salta y se avisa a su dueño (`gh pr comment`). El dueño rebasa; el tren no espera.
- Los conflictos de `ESTADO.md` e `i18n/*.json` se resuelven conservando las dos versiones. Nunca se borran claves de i18n.

## Orden

| # | PR | Qué trae | Dueño | Ojo |
|---|---|---|---|---|
| 1 | #87 | Docs: volver a como estaba y Camilo releva a Santiago en diseño | kcitas | Toca muchos CLAUDE.md. Va primero para que los agentes lean reglas al día |
| 2 | #73 | Solo Santiago fusiona | kcitas | En conflicto con #87: rebasar después de #87, o cerrarlo si #87 ya lo cubre |
| 3 | #55 → #65 → #69 | Datos: tarjeta de la tormenta, retraso Marte–Tierra, fuente del terreno | Daniverd15 | Están apilados (#65 sale de #55 y #69 de #65). En ese orden y borrando la rama |
| 4 | #84 | `ENERGIA_POR_CANTIDAD` en design (#77) | kcitas | 12 líneas |
| 5 | #86 → #89 | Misión de Jezero completa, más polvo y dilema del paso 6 | CamiloM21, kcitas | #89 está apilado sobre #86: después de #86, su diff baja |
| 6 | #85 | Textos en/es de diseño, traspaso y decisiones | kcitas | Toca `design/src` y `missions/src`: probable conflicto con #86/#89 |
| 7 | #72 → #75 → #74 → #92 | Agentes: `conversar()`, frases cortas, Matemático, voces de la misión 1 | Joserraldo | Comparten `agents/ESTADO.md` e i18n. José rebasa cada uno cuando entra el anterior |
| 8 | #88 | Doc de la misión 1 (ARES) | Joserraldo | Solo `docs/ideas` |
| 9 | #68 | ui: React + Vite, HUD, tripulación y 8 pantallas | JaimeMrF (para Paulasaah) | 1894 líneas, borrador, y toca también `engine/`. Se pasa a "ready" con revisión de María Paula y de Jaime. **Es el PR que da pantalla** |
| 10 | #78 | Despliegue a Cloudflare Pages desde Actions | Joserraldo | Antes: guardar `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID` (cuenta de Santiago) en Settings → Secrets → Actions. Sin ellos queda verde pero no publica |
| 11 | #76 | Worker `/api/clasificar` | Joserraldo | Usa `BAI_API_KEY`, que ya está. Comparte `package.json` con #80 |
| 12 | #80 | e2e Playwright de la ruta dorada | Joserraldo | Necesita #68 en `develop` |
| 13 | #79, #81 | Guion del video y borradores del formulario | Joserraldo | Solo `pitch/`. Pueden ir en cualquier momento |
| — | #62 | `develop` → `main` | kcitas | **No ahora.** Cerrarlo y abrir uno nuevo cuando la ruta dorada se juegue en preview |

## Después del tren (integración)
1. Conectar las pantallas de #68 con las APIs de agentes: `escenaTormenta(vista, MISION_JEZERO.dilemaPaso6.opciones)`, `escenaPolvo`, `compararOpciones`, `preguntaIris` y `conversar` (ver `agents/README.md`).
2. Probar la semilla dorada de punta a punta en la URL de preview y correr el e2e de #80.
3. Grabar el video con esa URL. Recién entonces, `develop` → `main`.

## Prompt para Santiago (sesión Fable de integración)

```
Eres el integrador del equipo. Lee CLAUDE.md, PLAN.md y docs/ideas/orden-de-merge-dia-14.md. Sigue la tabla "Orden" fila por fila: para cada PR revisa su CI y su diff (gh pr view, gh pr diff), y si está en verde y sin conflicto pídeme confirmación y fusiónalo con squash, borrando la rama. Espera el CI verde de develop antes de seguir. Si un PR tiene conflicto, no lo resuelvas tú: coméntale al dueño qué rebasar y pasa al siguiente. Lanza subagentes haiku para leer diffs largos (sobre todo #68) y devuélveme solo riesgos con archivo:línea. Al final dame una tabla: fusionados, saltados y por qué, y qué falta para tener la ruta dorada en la URL de preview.
```
