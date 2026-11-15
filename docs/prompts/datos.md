# Prompt: Daniel, datos y escenario 3D

**Abrir con:** `claude --model fable --effort medium` (Fable dirige el 3D; Opus escribe las piezas como subagente); Codex con GPT-6.1 y `model_reasoning_effort="medium"`. Tabla de modelos y esfuerzo: [README.md](README.md#modelos-y-esfuerzo).
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
origin/feat/ui-escenarios. Todo se escribe NUEVO desde su lámina: nadie trabaja sobre el
preview desplegado ni re-estiliza archivos viejos (FLUJO §2.3). La subida de María Paula
fue solo lógica (#184, #197). La única guía visual son las láminas del atlas v8.
Tus otras tareas de rol siguen yendo a develop como siempre.

CÓMO TRABAJAMOS TODOS:
- Commits atómicos: un cambio lógico por commit, mensaje en español y convencional, sin
  Co-Authored-By ni atribución a IA. PRs de menos de ~300 líneas, solo con tus archivos.
- Claude (revisor) revisa todo lo que sube cada persona y asigna los pendientes en GitHub.
  Al empezar cada iteración mirá primero sus comentarios en tus PRs y tus issues asignados
  (gh pr list --author @me; gh issue list --assignee @me).
- Loop: una sola tarea por iteración (la primera sin hacer de TAREAS). Cuando se cumple la
  META, parás el loop, escribís "META cumplida" en tu ESTADO.md y avisás a María Paula.
- Consumo de tokens: leé solo lo de LEÉ SOLO; no releas lo que ya está en tu ESTADO.md;
  anotá "Tokens: verde | amarillo | rojo" al cerrar cada iteración. En amarillo, solo tareas
  chicas y modelos livianos; en rojo, parás y dejás el traspaso escrito.
- Herramientas: sesión principal en Fable (--effort medium) que dirige el 3D y revisa contra
  mundo/01; subagentes Opus (effort high) para terreno, cielo, kit y rendimiento, Sonnet
  (medium) para replicar familias aprobadas y Haiku (low) para búsquedas; Codex con GPT-6.1
  (model_reasoning_effort="medium") para verificar geometría, rendimiento y cifras: Claude
  escribe, Codex comprueba, nunca el mismo archivo.
  Máximo 2–3 subagentes a la vez, con archivos disjuntos; decí cuántos y para qué antes de
  lanzarlos. Sin OpenCode (solo lo tiene Camilo).

TAREAS EN ORDEN (una por iteración; cada una dice cuándo está hecha):
Frontend (hacia feat/ui-escenarios): es lo más importante y empieza YA.
1. Tareas 1 a 5 de front-escenario.md con archivos nuevos: materiales y liberación, cielo y luz
   de Marte, terreno de Jezero, modelos del kit, los 5 módulos.
   HECHO: lo que diga cada tarea del brief, con captura al lado de su lámina.
2. Cuando María Paula suba su trabajo: tareas 6 y 7 (borrar el diseño anterior en escena3d.ts,
   modelos.ts y EscenaBase.tsx, montar la escena nueva y la base compacta).
3. Tarea 8 antes del dom 10:00: medición en celular y PC viejo para decidir P3.
Rol datos (hacia develop), entre tareas y sin frenar el escenario:
4. #162: si el revisor pide cambios, atendelos (es corto). HECHO: #162 fusionado.
5. #141: fuente verificada de la gravedad de Marte y qué cifras de MARTE.md §1–§2 quedan [V].
6. Glosario: "sol" como día de Marte, "telemetría" y "tick", en EN y ES.
7. Rebase de #148, #159, #160 y #147. Luna (#95, #126) y "Hoy en el Sol" solo después de P4.

NO HACER: reglas o números de juego en ui/, "en vivo" para algo estático.

TOKENS: Fable dirige con medium y sube a high solo para la pieza más difícil; la geometría
maestra la escriben subagentes Opus high; familias ya aprobadas con Sonnet en worktrees
separados; Codex para revisar rendimiento y cifras; búsquedas con Haiku.

META PARA PARAR EL LOOP: escenario fiel a mundo/01 con el cielo de Marte, dentro de 80 draw
calls y 80 000 triángulos, integrado antes de P4; #162 y #141 cerrados.

PRIMERA RESPUESTA (sin código, máx. 6 líneas): cómo vas a armar materiales, cielo y terreno
desde el DEM, y qué subagentes vas a lanzar. Esperá el OK.

Después: /loop 10m Haz UNA iteración según docs/LOOP.md y docs/prompts/datos.md.
```
