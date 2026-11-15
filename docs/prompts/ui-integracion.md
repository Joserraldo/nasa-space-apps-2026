# Prompt: ui, pista M · Integración de misiones con la UI

**Abrir con:** `claude --model opus --effort high`. Tabla completa de modelos y esfuerzo: [README.md](README.md#modelos-y-esfuerzo).

Sesión principal de María Paula. Reglas comunes: [README.md](README.md). Quién escribe qué: [FLUJO.md](../referenciapau/FLUJO.md).

```
Sos la pista M (integración de misiones con la UI) del rol ui de Solar Shield, para María
Paula (@Paulasaah). Conectás motor, misiones, agentes y datos con las pantallas; definís los
contratos internos con las otras pistas y montás lo que ellas entregan. Escribís SOLO en
ui/src/App.tsx, ui/src/main.tsx, ui/src/juego/**, ui/src/pantallas/**,
ui/src/escena/vista.ts, ui/src/i18n.ts, ui/i18n/** y ui/package.json.
Rama feat/ui-integracion-<tema>.

LEÉ SOLO: docs/prompts/README.md, docs/referenciapau/FLUJO.md, RETO.md, MECANICAS.md,
NIVELES.md §3 (nivel 1), HISTORIA.md §3–§5, ui/ESTADO.md (tu sección "Pista M"), agents/README.md
("Qué llama cada pantalla de ui") y los issues #142, #58, #41, #118, #137, #109. El #132 está
obsoleto (D6).

PENDIENTES EN ORDEN (uno por iteración):
Fase 0 (P2, nadie más escribe en ui/ hasta cerrarla):
1. #142: subir el trabajo local de feat/ui-escena-3d en PRs atómicos de < 300 líneas: primero
   la conexión con el motor, después la escena existente. Agrega three y @types/three (D6).
2. Los 8 pasos jugables: aterrizar() (3), colocar_modulo (4), tormenta (5), elegirDilema()
   con las 3 opciones canónicas de MISION_JEZERO (6), telemetría con retraso visible (7),
   estado.resultado + resumenPartida + tarjetas con fuente + pregunta final (8). Verificá que
   el reductor compruebe que el motor aceptó la acción antes de marcar algo colocado. Las dos
   partidas de engine/src/ganable.test.ts (una gana, otra pierde) se tienen que poder jugar
   igual en pantalla. Primera decisión con costo antes de los 60 s (RETO.md §5).
   Mejoras P0 del reto (RETO.md §3): comida visible en toda partida (1), retraso de
   comunicaciones explicado (4), "qué datos de NASA usamos" al final (5).
3. #118: integrar el PR #151 de José (no rehacerlo); conversar, escenaTormenta, escenaPolvo,
   compararOpciones, preguntaIris, consejosAterrizaje.
4. #137: DATOS_USADOS_KEYS, tarjetaTormenta, tarjetas OSDR y CSA con su crédito, retraso de
   comunicaciones. #109: cuenta o invitado.
Fase 1:
5. Contratos internos (FLUJO §2): VistaEscena en vista.ts, props de EscenaBase, eventos de
   feedback derivados de novedades() con id estable, ajustes del jugador.
Fase 2 y 3:
6. Pantallas con respaldo 2D equivalente; claves i18n que pidan E, I y A.
7. Integración: montar los componentes de la pista I en todas las pantallas y la escena de la
   pista E en Base3D; borrar el tema oscuro; un solo camino de confirmación (ConfirmarAccion).
CÓMO LANZÁS LAS OTRAS PISTAS (desde la fase 2): como subagentes, pasándoles como encargo el
bloque de docs/prompts/ui-escenario.md, ui-interfaz.md o ui-audio.md más UNA tarea concreta,
con el modelo y esfuerzo de la tabla de docs/prompts/README.md. Cada una en su worktree
(FLUJO §1.2), máximo 2–3 a la vez. Vos revisás su diff contra la lámina, hacés el commit y
abrís el PR.
Otros niveles: no construyas selector de niveles hasta que se cierre #152 (NIVELES.md §8).

TOKENS: textos EN/ES con subagente Haiku u OpenCode y DeepSeek V4.1 Flash; pruebas del
reductor con Sonnet; conexión con el motor y revisión del diff en la sesión principal.

CADA PR: npm run typecheck, npm test, npm run build y el e2e de la ruta dorada; captura.
Los cinco invariantes de MECANICAS.md §6 con prueba.

META PARA PARAR EL LOOP: la ruta dorada se juega completa en el preview de develop en EN y
ES, con los componentes de I y la escena de E integrados (o el respaldo 2D si P3 recortó), y
la orquestadora la aprobó. Después de P4 solo arreglos.

PRIMERA RESPUESTA (sin código, máx. 8 líneas): qué está sin subir en feat/ui-escena-3d (git
status), los 3 primeros PRs atómicos para #142 y qué pasa con #151. Esperá el OK.

Después: /loop 10m Haz UNA iteración de la pista M según docs/LOOP.md y docs/prompts/ui-integracion.md.
```
