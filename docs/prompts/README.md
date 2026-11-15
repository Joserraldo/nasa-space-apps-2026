# Prompts de arranque por rol (14 nov 2026, noche)

**Orquestadora:** María Paula (`Paulasaah`). **Revisión de PRs y tablero de pendientes:** sesión revisora de Claude ([revisor.md](revisor.md)). **Fusiona:** Santiago (`kcitas`), solo con squash, cuando pasa la CI.

Cada persona abre su sesión, pega **su** prompt y después lanza el loop que el prompt indica. Si un prompt choca con un `CLAUDE.md` de carpeta o con un prompt viejo del historial, manda este.

| Persona | Rol | Prompt | Herramientas |
| --- | --- | --- | --- |
| María Paula | orquestadora | [orquestadora.md](orquestadora.md) | Claude Code + subagentes Sonnet/Haiku + OpenCode (DeepSeek 4.1 Flash) |
| María Paula | ui | [ui.md](ui.md) | Claude Code + subagentes Sonnet/Haiku + OpenCode (DeepSeek 4.1 Flash) |
| Jaime (`JaimeMrF`) | motor | [motor.md](motor.md) | Claude Code + subagentes Sonnet/Haiku + OpenCode (DeepSeek 4.1 Flash) |
| Camilo (`CamiloM21`) | diseño y misiones | [diseno.md](diseno.md) | Claude Code + subagentes Sonnet/Haiku + OpenCode (DeepSeek 4.1 Flash) |
| José (`Joserraldo`) | agentes, infra y pitch | [agentes-infra.md](agentes-infra.md) | Claude Code + subagentes Sonnet/Haiku + OpenCode (DeepSeek 4.1 Flash) |
| Daniel (`Daniverd15`) | datos | [datos.md](datos.md) | Claude Code + **Codex** + subagentes Sonnet/Haiku |
| Santiago (`kcitas`) | supervisión y fusión | [supervisor.md](supervisor.md) | Claude Code |
| Claude | revisor | [revisor.md](revisor.md) | Claude Code |

## Calendario (de `docs/ORQUESTACION.md`)

| Puerta | Cuándo | Cumple cuando |
| --- | --- | --- |
| P2 Rebanada vertical | sáb 14, 22:00 | Misión completa en Marte en pantalla, e2e de la semilla dorada en CI y desplegado |
| P3 Variabilidad | dom 15, 11:00 | Dos semillas distintas; 3D con respaldo 2D probado, o recortado a 2D |
| P4 Congelamiento | dom 15, 13:00 | Solo arreglos |
| P5 Entrega | dom 15, 20:00 | Formulario enviado (cierra 23:59) |

---

## Reglas comunes (todas las sesiones las cumplen)

### Lectura mínima
- Antes de la primera iteración: `CLAUDE.md` (raíz), el `CLAUDE.md` y el `ESTADO.md` de tu carpeta, `docs/LOOP.md` y **solo** los archivos o issues que nombra tu prompt.
- No se audita el repo entero. No se relee en cada iteración lo que ya está resumido en tu `ESTADO.md`.
- Dirección visual, escenas, mecánicas y mapa: **una sola fuente**, `docs/referenciapau/README.md`. Estilo y render: `docs/decisiones/D6-estilo-visual.md` (manda sobre cualquier mención a PixiJS en `PLAN.md`, `ORQUESTACION.md` o `D3`).
- Descartado, no se usa aunque aparezca en el historial o en otra rama: `docs/referencias/3d/`, atlas v2–v5 y v7, capibara, GLB, Blender, Drei, Rapier, Higgsfield, `polyfork.ts`.

### Loop
- Una iteración = **una** tarea pequeña y verificable, según `docs/LOOP.md`.
- Cada prompt trae su **META** (condición para parar). Cuando se cumple: detené el loop, escribí el cierre en `ESTADO.md` y avisá a María Paula.
- También se para el loop si: dos iteraciones seguidas sin avance (avisá con un issue o en `#bloqueos`), tokens en rojo, o la tarea necesita una decisión humana.
- Si no hay tarea disponible en una iteración, terminala sin hacer nada (no inventes trabajo).

### Consumo de tokens
| Trabajo | Dónde va |
| --- | --- |
| Decidir, integrar, contratos, depurar algo difícil, revisar el propio diff | Sesión principal |
| Componentes, tests unitarios, bugs claros | Subagente **Sonnet** |
| Buscar en el repo, i18n EN/ES, JSON de datos, documentación, renombrar | Subagente **Haiku** |
| Trabajo mecánico en lote sobre archivos que nadie más toca (traducciones, fixtures, ediciones repetitivas, primera pasada de revisión) | **OpenCode con DeepSeek 4.1 Flash**, en otra terminal |
| Segunda opinión y scripts de verificación (solo Daniel) | **Codex** |

- Máximo 2–3 subagentes a la vez, con **archivos disjuntos**. Decí cuántos y para qué antes de lanzarlos.
- Si un modelo falla dos veces en lo mismo, subí un nivel; al terminar, bajá.
- En `ESTADO.md`, una línea `Tokens: verde | amarillo | rojo`. En amarillo: solo tareas chicas y subagentes livianos. En rojo: parar y dejar el traspaso escrito.

### Git y PRs
- Rama `feat/<slug>-<tema>` o `fix/<slug>-<tema>` desde `develop`. `git fetch origin && git rebase origin/develop` antes de cada tarea.
- **Commits atómicos:** un cambio lógico por commit, mensaje en español y convencional (`feat(ui): ...`, `fix(motor): ...`), **sin atribución a IA ni `Co-Authored-By`**.
- PRs de menos de ~300 líneas hacia `develop`, con la plantilla. Nunca merge, nunca push a `develop` ni `main`, nunca `--force`.
- Antes de cada PR, pegar la salida real de `npm run typecheck` y `npm test` (y `npm run build` si tocaste `ui/`).
- Solo se editan las carpetas del rol. Lo de otro rol se pide con issue `bloquea:<rol>`.
- Antes de editar, `git status`: puede haber cambios sin commitear de otra sesión en la misma carpeta. No los pises.

### Producto
- Niños de 7 a 12 años: frases cortas, nada inapropiado, personajes originales.
- Inglés primero, español segundo, ningún texto quemado.
- Todo dato NASA con fuente; nada "en vivo" si es estático. Nada de claves en el código.
- El modelo de IA clasifica en JSON estricto y el código responde. Nunca inventa números.

### Sin emojis
En código, commits, PRs, `ESTADO.md` y documentación.
