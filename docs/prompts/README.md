# Prompts de arranque por rol (14 nov 2026, noche)

**Orquestador del equipo:** Santiago (`kcitas`). **Orquestadora del desarrollo 3D y de la pantalla:** María Paula (`Paulasaah`) (decisión de Santiago, 14 nov). **Revisión de PRs y tablero de pendientes:** sesión revisora de Claude ([revisor.md](revisor.md)). **Fusiona:** Santiago (`kcitas`), solo con squash, cuando pasa la CI.

Cada persona abre su sesión, pega **su** prompt y después lanza el loop que el prompt indica. Si un prompt choca con un `CLAUDE.md` de carpeta o con un prompt viejo del historial, manda este.

## Roles y tareas en esta implementación (desde el sáb 14 nov, noche)

| Persona | Rol en esta implementación | Tareas principales (en orden) | Prompt | Loop | Meta para parar |
| --- | --- | --- | --- | --- | --- |
| **Santiago** | Orquestador del equipo; único que fusiona | Fusionar lo de P2 (#163, #151, #162, subida de #142); ordenar #164, #165 y #166; decidir P3 con María Paula; aprobar NIVELES §7; cerrar issues resueltos; enviar el formulario | [supervisor.md](supervisor.md) | 20 min | Formulario enviado (P5) |
| **María Paula** | Orquestadora del desarrollo 3D y de la pantalla | Seguir las 4 pistas de ui y lo que ui necesita de otros roles; preparar la decisión de P3 | [orquestadora.md](orquestadora.md) | 30 min | Formulario enviado (P5) |
| **María Paula** | Dueña de la pantalla (pista M) | OK a #163 y #151; subir el trabajo local (#142); pasos 7 y 8 y "qué datos usamos"; cuenta o invitado; contratos; pistas E e I como subagentes; integración | [ui-integracion.md](ui-integracion.md) | 10 min | Ruta dorada completa en el preview, puerta §10 aprobada |
| **Jaime** | Motor y soporte del motor para la pantalla; suplente del orquestador | Revisar el uso del motor en #163 y #151; responder bloquea:motor; prueba de variabilidad (P3); motor multi-misión (#152) | [motor.md](motor.md) | 10 min | Variabilidad fusionada y sin bloquea:motor |
| **Camilo** | Diseño y misiones; probador de la ruta dorada | Proponer NIVELES §7 (1, 4 y 5); revisar #153–#156; cerrar #114 y #56; jugar la ruta dorada y reportar bugs; huecos de #152 | [diseno.md](diseno.md) | 10 min | NIVELES aprobado y prueba reportada |
| **José** | Agentes, CI, despliegue, video y formulario; ui solo por encargo | Atender #163 y #151; e2e verde con lo nuevo; rebases; video y formulario | [agentes-infra.md](agentes-infra.md) | 10 min | Video y formulario listos antes de P5 |
| **Daniel** | Datos de NASA y verificación (Codex con GPT-6.1) | #162 para la pantalla final; fuente de la gravedad (#141); glosario (sol, telemetría, tick); rebases; "Hoy en el Sol" opcional | [datos.md](datos.md) | 10 min | Ninguna tarjeta de la ruta dorada sin fuente |
| **Claude (revisor)** | Revisa todo PR y mantiene el tablero | Cola en orden: P2 primero (#163, #151, #162), después ui, docs, datos, agentes, misiones | [revisor.md](revisor.md) | 15 min | P4 sin PRs pendientes |

Las pistas E (escenario 3D), I (interfaz) y A (audio) de ui no son personas: son subagentes que lanza la sesión de María Paula ([ui.md](ui.md)).

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

Verificado el 14 nov en este equipo: `claude` acepta `--model` (`fable`, `opus`, `sonnet`, `haiku`) y `--effort` (`low`, `medium`, `high`, `xhigh`, `max`); los subagentes de Claude Code reciben `model` y `effort` al lanzarlos; OpenCode lista `opencode/deepseek-v4.1-flash-free` y `openai/gpt-6.1-sol`; Codex fija el esfuerzo con `model_reasoning_effort`; Daniel usa Codex con GPT-6.1 (dicho por María Paula).

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
| Datos (Daniel): verificación y scripts | Codex con GPT-6.1 | `medium` | `codex -c model_reasoning_effort="medium"` (GPT-6.1 como modelo de su Codex) |
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
