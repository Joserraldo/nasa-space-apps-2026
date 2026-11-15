# D3 — Motor y stack web
**Dueño:** rol motor (Jaime, `JaimeMrF`) · **Fecha:** 2026-11-13 · **Estado:** propuesta (se confirma el 14 nov a primera hora)

## Opciones
| Opción | A favor | En contra |
|---|---|---|
| Phaser | Motor de juego completo, escenas, física | Todo es canvas: sin accesibilidad del DOM, i18n y botones a mano; sobra para un juego por turnos |
| PixiJS solo | Render 2D rápido y liviano | Igual sin DOM; habría que reconstruir HUD y diálogos |
| React + Vite, PixiJS opcional en la escena | HUD, diálogos y botones son DOM real (teclado, lector de pantalla, zoom, traducción); el equipo y los agentes lo conocen; carga rápido en PCs viejos | La escena animada requiere un componente aparte |

## Elegida
**React + Vite** para la interfaz, **PixiJS** solo dentro del componente de la escena (cúpula, tormenta, partículas). **Motor en TypeScript puro**, sin dependencias de UI, en `engine/`, validado con **Zod** desde `contracts/`. Pruebas con **Vitest**. Monorepo con **npm workspaces** (PLAN §13.3).

## Por qué
Es un juego de decisiones por turnos: lo que se ve son medidores, tarjetas y conversaciones. Eso es interfaz, y React la hace accesible y bilingüe sin esfuerzo extra. El motor separado se prueba sin navegador y garantiza "misma semilla, misma partida".

## Consecuencias para cada rol
- **motor:** `engine/` exporta funciones puras `(estado, accion) -> estado`; RNG por semilla con estado dentro de `GameState` (`rngEstado`); cero `Math.random`/`Date.now`.
- **diseño:** las tablas de balance son datos (JSON/TS) que el motor lee; ningún número vive en código del motor.
- **agentes:** consumen `ClassifierOutput` y `GameState` recortado desde `@solar-shield/contracts`.
- **datos:** publican `SpaceWeatherEvent` con tarjeta de fuente; el motor solo lee `intensidad` normalizada.
- **ui:** React + Vite; la escena PixiJS es un componente; nada de texto quemado (i18n).
- **infra:** CI corre `npm run typecheck` y `npm test` en cada PR; build de Vite a Cloudflare Pages.
