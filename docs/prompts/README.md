# Prompts de arranque por rol (14 nov 2026, noche)

**Orquestador del equipo:** Santiago (`kcitas`). **Orquestadora del desarrollo 3D y de la pantalla:** María Paula (`Paulasaah`) (decisión de Santiago, 14 nov). **Revisión de PRs y tablero de pendientes:** sesión revisora de Claude ([revisor.md](revisor.md)). **Fusiona:** Santiago (`kcitas`), solo con squash, cuando pasa la CI.

Cada persona abre su sesión, pega **su** prompt y después lanza el loop que el prompt indica. Si un prompt choca con un `CLAUDE.md` de carpeta o con un prompt viejo del historial, manda este.

| Persona | Rol | Prompt | Herramientas |
| --- | --- | --- | --- |
| María Paula | orquestadora del 3D y la pantalla | [orquestadora.md](orquestadora.md) | Claude Code + subagentes Sonnet/Haiku + OpenCode (DeepSeek V4.1 Flash) |
| María Paula | ui, en 4 pistas: integración (M), escenario (E), interfaz (I), audio (A) | [ui.md](ui.md) | Claude Code + subagentes Sonnet/Haiku + OpenCode (DeepSeek V4.1 Flash) |
| Jaime (`JaimeMrF`) | motor | [motor.md](motor.md) | Claude Code + subagentes Sonnet/Haiku + OpenCode (DeepSeek V4.1 Flash) |
| Camilo (`CamiloM21`) | diseño y misiones | [diseno.md](diseno.md) | Claude Code + subagentes Sonnet/Haiku + OpenCode (DeepSeek V4.1 Flash) |
| José (`Joserraldo`) | agentes, infra y pitch | [agentes-infra.md](agentes-infra.md) | Claude Code + subagentes Sonnet/Haiku + OpenCode (DeepSeek V4.1 Flash) |
| Daniel (`Daniverd15`) | datos | [datos.md](datos.md) | Claude Code + **Codex** + subagentes Sonnet/Haiku |
| Santiago (`kcitas`) | supervisión y fusión | [supervisor.md](supervisor.md) | Claude Code |
| Claude | revisor | [revisor.md](revisor.md) | Claude Code |

## Prioridades del equipo

0. **Cumplir el reto de NASA:** [RETO.md](../referenciapau/RETO.md) dice qué falta y de quién es.
1. **Definir y aprobar todos los niveles:** [NIVELES.md](../referenciapau/NIVELES.md) §7 (diseño, motor, datos; aprueba Santiago).
2. **Nivel 1 (Jezero) jugable completo** en pantalla.
3. Motor multi-misión y huecos del tipo `Mision` (#152).
4. Niveles 2 a 5, uno por vez, cuando su código, su motor y su lámina estén listos.

Cómo se reparte el trabajo de ui y cómo se integra: [FLUJO.md](../referenciapau/FLUJO.md).

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

### Modelos y esfuerzo

Verificado el 14 nov en este equipo: `claude` acepta `--model` (`fable`, `opus`, `sonnet`, `haiku`) y `--effort` (`low`, `medium`, `high`, `xhigh`, `max`); los subagentes de Claude Code reciben `model` y `effort` al lanzarlos; OpenCode lista `opencode/deepseek-v4.1-flash-free` y `openai/gpt-6.1-sol`; Codex fija el esfuerzo con `model_reasoning_effort`.

| Sesión o tarea | Modelo | Esfuerzo | Cómo se abre |
| --- | --- | --- | --- |
| Santiago: supervisión, decisiones y fusión | Fable 5.2 | `medium` (`high` solo para decidir un recorte) | `claude --model fable --effort medium` |
| Orquestadora: semáforo cada 30 min | Sonnet 5.5 | `medium` | `claude --model sonnet --effort medium` |
| Orquestadora: decisión de prioridad o recorte | Fable 5.2 | `high` | Sesión corta solo para esa decisión |
| Revisor de PRs | Opus 5.5 | `medium`; `high` si el PR toca `contracts/`, `engine/` o la integración de ui | `claude --model opus --effort medium` |
| ui, pista M (sesión principal de María Paula) | Opus 5.5 | `high` | `claude --model opus --effort high` |
| ui, pista E: pieza maestra o primera versión de una escena | Opus 5.5 (subagente) | `medium` | `model: opus, effort: medium` |
| ui, pista E: replicar una familia ya aprobada | Sonnet 5.5 (subagente) | `medium` | `model: sonnet, effort: medium` |
| ui, pistas I y A | Sonnet 5.5 (subagente) | `medium` | `model: sonnet, effort: medium` |
| Motor (Jaime) | Opus 5.5 | `high` | `claude --model opus --effort high` |
| Diseño (Camilo) | Opus 5.5 | `medium` | `claude --model opus --effort medium` |
| Agentes e infra (José) | Opus 5.5 | `medium` | `claude --model opus --effort medium` |
| Datos (Daniel) | Opus 5.5 | `medium` | `claude --model opus --effort medium` |
| Datos (Daniel): verificación y scripts | Codex con GPT-6.1 Sol si su cuenta lo tiene | `medium` | `codex -m <modelo> -c model_reasoning_effort="medium"` (Daniel confirma el nombre del modelo en su Codex) |
| Componentes, tests unitarios, bugs claros | Sonnet 5.5 (subagente) | `medium` | `model: sonnet, effort: medium` |
| Buscar en el repo, i18n EN/ES, JSON, documentación | Haiku 5.5 (subagente) | `low` | `model: haiku, effort: low` |
| Lote mecánico sobre archivos que nadie más toca | DeepSeek V4.1 Flash en OpenCode | (sin ajuste) | `opencode -m opencode/deepseek-v4.1-flash-free` |
| Segunda opinión puntual (quien tenga cuenta de OpenAI) | GPT-6.1 Sol en OpenCode | (por defecto) | `opencode -m openai/gpt-6.1-sol` |

Reglas de uso:
- **Primero se sube el esfuerzo, después el modelo:** `medium` → `high` → `xhigh`; recién entonces Sonnet → Opus → Fable. Si un modelo falla dos veces en lo mismo, se sube un escalón; al terminar la tarea difícil, se baja.
- **`max` nunca** sin el OK del orquestador (Santiago) o, en lo de ui y 3D, de la orquestadora del 3D.
- Máximo 2–3 subagentes a la vez, con **archivos disjuntos**. Decí cuántos y para qué antes de lanzarlos. Un subagente no lanza otros subagentes ni corre `/loop`.
- En `ESTADO.md`, una línea `Tokens: verde | amarillo | rojo` (equivale a los círculos de `docs/COMO-TRABAJAMOS.md`, sin emojis). En amarillo: solo tareas chicas y modelos livianos. En rojo: parar, dejar el traspaso escrito y avisar en `#bloqueos`.
- `docs/modelos.md` (de Santiago) tiene la escalera general; esta tabla la concreta para estos prompts. Si chocan, se avisa a Santiago.

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
