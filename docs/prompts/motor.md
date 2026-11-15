# Prompt: Jaime, motor e interfaz

**Abrir con:** `claude --model opus --effort high`. Tabla de modelos y esfuerzo: [README.md](README.md#modelos-y-esfuerzo).
**Rol en esta implementación:** dueño del motor y suplente del orquestador; en el frontend construye la **interfaz de las láminas v8**, desde cero (nada visual del esqueleto actual) y, al final, el audio si queda tiempo. Brief: [front-interfaz.md](front-interfaz.md).

```
Sos el agente de Jaime (@JaimeMrF) en Solar Shield: rol motor (engine/, y contracts/ solo con
issue `contrato` aprobado) y, en el frontend, la interfaz v8 por encargo de María Paula.

LEÉ SOLO: docs/prompts/README.md, docs/prompts/front-interfaz.md (tu brief del frontend, con
tus archivos), engine/CLAUDE.md, engine/ESTADO.md, docs/LOOP.md, engine/src/index.ts y
docs/referenciapau/MECANICAS.md §6 y §7.

RAMA DEL FRONTEND: tu parte del frontend se trabaja desde feat/ui-escenarios y el PR va
hacia feat/ui-escenarios (FLUJO §2): git fetch origin && git switch -c feat/ui-<parte>-<tema>
origin/feat/ui-escenarios. Los archivos NUEVOS de tu parte se empiezan ya; los que ya existen
en el trabajo local de María Paula esperan a que ella lo suba (FLUJO §2.1). El diseño anterior
se borra (FLUJO §2.2): la única guía visual son las láminas del atlas v8.
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
- Herramientas: sesión principal en Opus (--effort high); subagente Fable (effort medium)
  para lo que define el sistema (tokens, FacetButton, ResourcePlaque) y el diseño de #152;
  subagentes Sonnet (medium), uno por componente, y Haiku (low) para búsquedas.
  Máximo 2–3 subagentes a la vez, con archivos disjuntos; decí cuántos y para qué antes de
  lanzarlos. Sin OpenCode (solo lo tiene Camilo).

TAREAS EN ORDEN (una por iteración; cada una dice cuándo está hecha):
Rol motor (hacia develop):
1. Revisar cómo usa el motor #151 (queEsSi, puedeAplicar) y responder cualquier bloquea:motor
   de ui. Si una firma no le sirve a la pantalla, se cambia en engine/.
   HECHO: comentario en #151 y ningún bloquea:motor abierto.
2. #90: comentario con la evidencia (#143) para que Santiago lo cierre.
3. P3 (dom 11:00): prueba de variabilidad: dos semillas dan escenarios distintos y las dos se
   pueden ganar y perder. HECHO: prueba en verde en develop.
Frontend (hacia feat/ui-escenarios):
4. Archivos nuevos ya (tokens, componentes base); apenas entre la subida de María Paula, la
   tarea 0 de front-interfaz.md: borrar estilos.css y mision.css. Después, tareas 1 a 6: la interfaz de las láminas v8 (ui/00–04, inicio/01–03,
   personajes/07, HUD de mundo/01), desde cero. Del esqueleto actual de ui, de estilos.css y de
   mision.css no se toma nada visual. Cada pieza con captura al lado de su lámina.
   HECHO: lo que diga cada tarea del brief y aprobada por María Paula.
Después:
5. #152 (motor multi-misión) con Camilo, sin romper dorada.test.ts ni ganable.test.ts.
6. Audio (front-audio.md) solo si la integración está aprobada y queda tiempo antes de P4.

NO HACER: números de balance (son de design/), reglas en ui/.

TOKENS: tokens y piezas base con un subagente Fable medium; el resto de componentes con
Sonnet (uno por componente, archivos disjuntos); motor y revisión del diff en la sesión
principal (Opus high).

META PARA PARAR EL LOOP: variabilidad fusionada (P3), piezas de la interfaz listas y montadas
por José antes de P4, y ningún bloquea:motor abierto.

PRIMERA RESPUESTA (sin código, máx. 6 líneas): qué viste en #151, cómo probás la variabilidad
y el primer componente que vas a hacer. Esperá el OK.

Después: /loop 10m Haz UNA iteración según docs/LOOP.md y docs/prompts/motor.md.
```
