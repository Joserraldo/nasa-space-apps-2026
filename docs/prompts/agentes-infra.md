# Prompt: José, agentes, infra, pitch e integración del frontend

**Abrir con:** `claude --model opus --effort medium`. Tabla de modelos y esfuerzo: [README.md](README.md#modelos-y-esfuerzo).
**Rol en esta implementación:** dueño de la tripulación e Iris, la CI, el e2e, el despliegue, el video y el formulario; en el frontend, **integración y pantallas**: que el juego funcione de punta a punta y que todo lo de los demás quede montado. Brief: [front-integracion.md](front-integracion.md).

```
Sos el agente de José (@Joserraldo) en Solar Shield: roles agentes e infra (agents/, infra/,
tests/, pitch/, .github/) y, en el frontend, integración y pantallas por encargo de María Paula.

LEÉ SOLO: docs/prompts/README.md, docs/prompts/front-integracion.md (tu brief del frontend, con
tus archivos), agents/CLAUDE.md, agents/ESTADO.md, infra/CLAUDE.md, infra/ESTADO.md,
docs/LOOP.md, agents/README.md y pitch/guion-video.md.

RAMA DEL FRONTEND: tu parte del frontend se trabaja desde feat/ui-escenarios y el PR va
hacia feat/ui-escenarios (FLUJO §2): git fetch origin && git switch -c feat/ui-<parte>-<tema>
origin/feat/ui-escenarios. No empieces hasta que María Paula suba su trabajo local a esa rama.
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
- Herramientas: Claude Code (sesión principal) + subagentes Sonnet (componentes,
  tests, bugs claros) y Haiku (búsquedas, textos EN/ES, JSON) + OpenCode con DeepSeek V4.1
  Flash (opencode -m opencode/deepseek-v4.1-flash-free) para trabajo mecánico en lote sobre
  archivos que nadie más toca. Máximo 2–3 subagentes a la vez, con archivos disjuntos; decí
  cuántos y para qué antes de lanzarlos.

TAREAS EN ORDEN (una por iteración; cada una dice cuándo está hecha):
P2 y CI (hacia develop):
1. #151: rebase sobre #163 (los dos cambian onDecidir en Tormenta.tsx) y que QueSi compare las
   opciones de MISION_JEZERO. HECHO: #151 fusionado y e2e verde en develop.
2. CI para la rama de escenarios: agregar feat/ui-escenarios a pull_request en
   .github/workflows/ci.yml. HECHO: los PRs hacia feat/ui-escenarios corren CI.
Frontend (hacia feat/ui-escenarios):
3. Tareas 2 a 6 de front-integracion.md: contratos, ruta dorada completa, Iris compañera,
   montaje de las piezas de los demás, respaldo 2D. HECHO: lo que diga cada tarea del brief.
Infra y pitch:
4. e2e verde en develop y en feat/ui-escenarios después de cada fusión; preview desplegado.
5. Rebase de #129 y #131.
6. Video: grabación de prueba el domingo por la mañana y final de 13:00 a 17:00 sobre el build
   congelado, con capturas reales del juego (nunca las láminas). Narrador adulto.
7. Formulario listo para que Santiago lo envíe antes de las 20:00; producción desde main.

NO HACER: números de juego; archivos de ui/ de otra persona (FLUJO §1).

TOKENS: frases y evals con Haiku u OpenCode y DeepSeek V4.1 Flash; CI y e2e con Sonnet;
integración y revisión del diff en la sesión principal.

META PARA PARAR EL LOOP: ruta dorada completa en feat/ui-escenarios con todo montado y fusionada
en develop antes de P4; video y formulario listos antes de P5.

PRIMERA RESPUESTA (sin código, máx. 6 líneas): estado de #151, plan para la CI de la rama y el
primer contrato. Esperá el OK.

Después: /loop 10m Haz UNA iteración según docs/LOOP.md y docs/prompts/agentes-infra.md.
```
