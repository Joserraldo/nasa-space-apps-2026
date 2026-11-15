# Prompt: Daniel, datos y escenario 3D

**Abrir con:** `claude --model opus --effort high`; Codex con GPT-6.1 y `model_reasoning_effort="medium"`. Tabla de modelos y esfuerzo: [README.md](README.md#modelos-y-esfuerzo).
**Rol en esta implementación:** dueño de los datos de NASA y, en el frontend, del **escenario 3D**, la parte con más trabajo: cielo y luz de Marte, terreno de Jezero, kit, base, los 5 módulos y el rendimiento. Brief: [front-escenario.md](front-escenario.md).

```
Sos el agente de Daniel (@Daniverd15) en Solar Shield: rol datos (data/, docs/science/) y, en
el frontend, el escenario 3D por encargo de María Paula. Daniel usa además Codex con GPT-6.1:
Claude decide y escribe, Codex verifica (geometría, rendimiento, cifras); no editan el mismo
archivo.

LEÉ SOLO: docs/prompts/README.md, docs/prompts/front-escenario.md (tu brief del frontend, con
tus archivos), data/CLAUDE.md, data/ESTADO.md, docs/LOOP.md y docs/referenciapau/MARTE.md.

RAMA DEL FRONTEND: tu parte del frontend se trabaja desde feat/ui-escenarios y el PR va
hacia feat/ui-escenarios (FLUJO §2): git fetch origin && git switch -c feat/ui-<parte>-<tema>
origin/feat/ui-escenarios. No empieces hasta que María Paula suba su trabajo local a esa rama.
Tus otras tareas de rol siguen yendo a develop como siempre.

TAREAS EN ORDEN (una por iteración; cada una dice cuándo está hecha):
Rol datos (hacia develop), lo corto primero:
1. #162: atendé la revisión; es lo que la pantalla final necesita. HECHO: #162 fusionado.
2. #141: fuente verificada de la gravedad de Marte y qué cifras de MARTE.md §1–§2 quedan [V].
   HECHO: #141 cerrado y comentario a María Paula.
Frontend (hacia feat/ui-escenarios), tu foco principal:
3. Tareas 1 a 8 de front-escenario.md, en orden: materiales y liberación, cielo y luz de
   Marte, props de EscenaBase con José, medición y degradación para P3, terreno de Jezero,
   kit de piezas, base compacta, los 5 módulos.
   HECHO: lo que diga cada tarea del brief; la medición de la tarea 4 antes de las 10:00 del
   domingo para decidir P3.
Rol datos, cuando el escenario no te bloquee:
4. Glosario: "sol" como día de Marte, "telemetría" y "tick", en EN y ES.
5. Rebase de #148, #159, #160 y #147. Luna (#95, #126) y "Hoy en el Sol" solo después de P4.

NO HACER: reglas o números de juego en ui/, "en vivo" para algo estático.

TOKENS: la geometría maestra en la sesión principal (Opus, high); familias de piezas ya
aprobadas con subagentes Sonnet en worktrees separados; Codex para revisar rendimiento y
cifras; búsquedas con Haiku.

META PARA PARAR EL LOOP: escenario fiel a mundo/01 con el cielo de Marte, dentro de 80 draw
calls y 80 000 triángulos, integrado antes de P4; #162 y #141 cerrados.

PRIMERA RESPUESTA (sin código, máx. 6 líneas): estado de #162 y #141 y cómo vas a convertir el
DEM en terreno. Esperá el OK.

Después: /loop 10m Haz UNA iteración según docs/LOOP.md y docs/prompts/datos.md.
```
