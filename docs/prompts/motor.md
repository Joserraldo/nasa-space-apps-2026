# Prompt: Jaime, motor e interfaz

**Abrir con:** `claude --model opus --effort high`. Tabla de modelos y esfuerzo: [README.md](README.md#modelos-y-esfuerzo).
**Rol en esta implementación:** dueño del motor y suplente del orquestador; en el frontend construye la **interfaz** (sistema facetado v8) y, al final, el audio si queda tiempo. Brief: [front-interfaz.md](front-interfaz.md).

```
Sos el agente de Jaime (@JaimeMrF) en Solar Shield: rol motor (engine/, y contracts/ solo con
issue `contrato` aprobado) y, en el frontend, la interfaz v8 por encargo de María Paula.

LEÉ SOLO: docs/prompts/README.md, docs/prompts/front-interfaz.md (tu brief del frontend, con
tus archivos), engine/CLAUDE.md, engine/ESTADO.md, docs/LOOP.md, engine/src/index.ts y
docs/referenciapau/MECANICAS.md §6 y §7.

RAMA DEL FRONTEND: tu parte del frontend se trabaja desde feat/ui-escenarios y el PR va
hacia feat/ui-escenarios (FLUJO §2): git fetch origin && git switch -c feat/ui-<parte>-<tema>
origin/feat/ui-escenarios. No empieces hasta que María Paula suba su trabajo local a esa rama.
Tus otras tareas de rol siguen yendo a develop como siempre.

TAREAS EN ORDEN (una por iteración; cada una dice cuándo está hecha):
Rol motor (hacia develop):
1. Revisar cómo usa el motor #151 (queEsSi, puedeAplicar) y responder cualquier bloquea:motor
   de ui. Si una firma no le sirve a la pantalla, se cambia en engine/.
   HECHO: comentario en #151 y ningún bloquea:motor abierto.
2. #90: comentario con la evidencia (#143) para que Santiago lo cierre.
3. P3 (dom 11:00): prueba de variabilidad: dos semillas dan escenarios distintos y las dos se
   pueden ganar y perder. HECHO: prueba en verde en develop.
Frontend (hacia feat/ui-escenarios):
4. Tareas 1 a 6 de front-interfaz.md: tokens, FacetButton, placas y ConfirmarAccion, retratos,
   portada DOM, intro y carga, datos en pantalla. HECHO: lo que diga cada tarea del brief.
Después:
5. #152 (motor multi-misión) con Camilo, sin romper dorada.test.ts ni ganable.test.ts.
6. Audio (front-audio.md) solo si la integración está aprobada y queda tiempo antes de P4.

NO HACER: números de balance (son de design/), reglas en ui/.

TOKENS: componentes con subagentes Sonnet (uno por componente, archivos disjuntos); variantes
de estilo con OpenCode y DeepSeek V4.1 Flash; motor y revisión del diff en la sesión principal.

META PARA PARAR EL LOOP: variabilidad fusionada (P3), piezas de la interfaz listas y montadas
por José antes de P4, y ningún bloquea:motor abierto.

PRIMERA RESPUESTA (sin código, máx. 6 líneas): qué viste en #151, cómo probás la variabilidad
y el primer componente que vas a hacer. Esperá el OK.

Después: /loop 10m Haz UNA iteración según docs/LOOP.md y docs/prompts/motor.md.
```
