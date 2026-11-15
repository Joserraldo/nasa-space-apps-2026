# Prompt: roles agentes, infra y pitch (José)

**Abrir con:** `claude --model opus --effort medium`. Tabla completa de modelos y esfuerzo: [README.md](README.md#modelos-y-esfuerzo).

Pegá esto en la sesión de José. Reglas comunes, herramientas y tokens: [README.md](README.md).

```
Sos el agente de José (@Joserraldo), roles agentes e infra de Solar Shield: carpetas
agents/, infra/, tests/, pitch/ y .github/.

LEÉ SOLO: docs/prompts/README.md (reglas comunes), agents/CLAUDE.md, agents/ESTADO.md,
infra/CLAUDE.md, infra/ESTADO.md (si existen), docs/LOOP.md, agents/README.md y los
issues #59, #60, #118, #124 y #41. Cómo representa la pantalla a la tripulación y a Iris:
docs/referenciapau/MECANICAS.md §3.4 y §4 (solo lectura).

PENDIENTES EN ORDEN (uno por iteración):
1. Tus PRs abiertos (#129, #131, #149, #150, #151, #153, #154, #155, #156): rebase sobre
   develop y CI en verde. El #151 toca ui/ (carpeta de María Paula): no lo sigas
   ampliando; ella decide cómo se integra con su trabajo local.
2. #118: responder lo que ui pida sobre firmas de agents/ (si no le sirve a la pantalla,
   cambia la API, no la pantalla).
3. #59 y #60: verificá qué falta; cerrá con evidencia lo que ya está (despliegue y e2e).
4. e2e: cuando entre la escena v8, que el e2e de la ruta dorada siga pasando (respaldo 2D
   incluido) y que el preview se despliegue con cada merge.
5. #124: ya tiene el PR #150; que Santiago lo revise (docs/reglas.md es suyo).
6. El tráiler (pitch/trailer/README.md y compositions/intro.html) cita docs/referencias/3d,
   que se borró por D6. Cambiá la procedencia a "prototipo de FASE 0, commit 745427c" y no
   lo uses como estilo para material nuevo.
7. Pitch: video y formulario con capturas reales del juego (no de las láminas), créditos y
   declaración de IA (docs/ia-uso.md) según la guía vigente.

NO HACER: editar ui/ (es de María Paula) ni números de juego.

TOKENS: frases, plantillas y evals con subagente Haiku u OpenCode con DeepSeek V4.1 Flash;
flujos de CI y e2e con Sonnet; lógica de expertos e Iris en la sesión principal.

META PARA PARAR EL LOOP: tus PRs fusionados o en verde, #59 y #60 cerrados, e2e de la ruta
dorada pasando sobre la versión final, preview y producción desplegados, y el formulario de
entrega listo para enviar antes de P5 (dom 20:00).

PRIMERA RESPUESTA (sin código, máx. 6 líneas): estado real de tus PRs, #59, #60 y el
despliegue, y qué falta para el pitch. Esperá el OK.

Después: /loop 10m Haz UNA iteración de agentes e infra según docs/LOOP.md y docs/prompts/agentes-infra.md.
```
