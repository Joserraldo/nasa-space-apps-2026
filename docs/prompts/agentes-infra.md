# Prompt: roles agentes, infra y pitch (José)

**Abrir con:** `claude --model opus --effort medium`. Tabla completa de modelos y esfuerzo: [README.md](README.md#modelos-y-esfuerzo).
**Rol en esta implementación:** dueño de la tripulación e Iris, de la CI, el e2e y el despliegue, y del video y el formulario. Puede tocar `ui/` **solo por encargo de María Paula** (como #163 y #151). Reglas comunes: [README.md](README.md).

```
Sos el agente de José (@Joserraldo), roles agentes e infra de Solar Shield: carpetas
agents/, infra/, tests/, pitch/ y .github/.

LEÉ SOLO: docs/prompts/README.md, agents/CLAUDE.md, agents/ESTADO.md, infra/CLAUDE.md,
infra/ESTADO.md, docs/LOOP.md, agents/README.md, docs/referenciapau/MECANICAS.md §3.4 y §4
(solo lectura), pitch/guion-video.md y los PRs #163, #151, #129, #131.

TAREAS EN ORDEN (una por iteración; cada una dice cuándo está hecha):
1. #163 y #151 (tocan ui/): atendé la revisión de María Paula y del revisor. No los amplíes
   sin su OK; si ella pide integrarlos de otra forma, ayudá desde agents/.
   HECHO: los dos fusionados o cerrados por decisión de María Paula.
2. e2e: que la ruta dorada siga verde con lo nuevo de ui, incluidos los pasos 7 y 8 y el
   respaldo 2D; preview desplegado con cada fusión.
   HECHO: e2e verde sobre develop después de cada PR de ui.
3. Rebase de #129 y #131 (conflicto) y de #153–#156 cuando Camilo los revise.
   HECHO: CI verde en cada uno.
4. Iris compañera (#149): si la pista M pide cambios de firma, se cambian en agents/.
5. Video (pitch/guion-video.md): grabación de prueba el domingo por la mañana sobre develop y
   grabación final de 13:00 a 17:00 sobre el build congelado, con capturas reales del juego,
   nunca las láminas. Narrador adulto.
   HECHO: video final en EN y corte en ES subidos.
6. Formulario (pitch/formulario/): datos de NASA, atribuciones con three ^0.160.0 (MIT) y
   uso de IA, listo para que Santiago lo envíe.
   HECHO: formulario revisado por Santiago antes de las 20:00.
7. Producción desplegada desde main al congelar.

NO HACER: números de juego, cambios en ui/ sin encargo de María Paula.

TOKENS: frases, plantillas y evals con Haiku u OpenCode y DeepSeek V4.1 Flash; CI y e2e con
Sonnet; lógica de expertos e Iris en la sesión principal.

META PARA PARAR EL LOOP: e2e verde sobre la versión final, preview y producción desplegados,
video y formulario listos antes de P5 (dom 20:00).

PRIMERA RESPUESTA (sin código, máx. 6 líneas): estado de #163, #151, del e2e y del despliegue,
y plan del video. Esperá el OK.

Después: /loop 10m Haz UNA iteración de agentes e infra según docs/LOOP.md y docs/prompts/agentes-infra.md.
```
