# Prompt: ui, pista M · Integración de misiones con la UI (María Paula)

**Abrir con:** `claude --model opus --effort high`. Tabla completa de modelos y esfuerzo: [README.md](README.md#modelos-y-esfuerzo).
**Rol en esta implementación:** dueña de la pantalla. Única sesión que escribe en `App.tsx`, `pantallas/`, `juego/` e i18n de ui; integra lo que llega de otros roles (#163 y #151 de José, #162 de Daniel) y lanza las pistas E, I y A como subagentes. Reglas comunes: [README.md](README.md). Quién escribe qué: [FLUJO.md](../referenciapau/FLUJO.md).

```
Sos la pista M (integración de misiones con la UI) del rol ui de Solar Shield, para María
Paula (@Paulasaah), orquestadora del desarrollo 3D y de la pantalla. Escribís SOLO en
ui/src/App.tsx, ui/src/main.tsx, ui/src/juego/**, ui/src/pantallas/**,
ui/src/escena/vista.ts, ui/src/i18n.ts, ui/i18n/** y ui/package.json.
Rama feat/ui-integracion-<tema>.

LEÉ SOLO: docs/prompts/README.md, docs/referenciapau/FLUJO.md, RETO.md, MECANICAS.md,
NIVELES.md §3 (nivel 1), HISTORIA.md §3–§5, ui/ESTADO.md (tu sección "Pista M"),
agents/README.md ("Qué llama cada pantalla de ui") y los PRs #163, #151 y #162.

TAREAS EN ORDEN (una por iteración; cada una dice cuándo está hecha):
P2 (sáb 22:00):
1. Revisar #163 (aterrizar y elegirDilema) y #151 (conversar, ¿Y si...?, pregunta de Iris,
   polvo), ambos de José con CI verde. Probalos en local y dejá OK o cambios en cada PR.
   Recomendación: aprobarlos para P2 y rebasar tu trabajo local encima.
   HECHO: OK o cambios pedidos en los dos PRs.
2. #142: commit del trabajo local de feat/ui-escena-3d y rebase sobre develop (con #163 y
   #151), resolviendo App.tsx, Tormenta.tsx, Tripulacion.tsx y los i18n. Subir en PRs
   atómicos de menos de 300 líneas: primero los archivos nuevos de la escena, después los
   cambios de pantallas. Agrega three y @types/three (D6).
   HECHO: git status limpio y nada sin subir.
3. Pasos 7 y 8 en pantalla: telemetría con retraso visible y "3 a 22 minutos" con fuente;
   final con estado.resultado, resumenPartida, tarjetas con fuente, pregunta final, "qué
   datos de NASA usamos" (#162 de Daniel) y crédito de la CSA. Mejoras P0 de RETO.md §3:
   comida visible en toda partida y retraso explicado. Primera decisión con costo antes de
   los 60 s. Las dos partidas de engine/src/ganable.test.ts se juegan igual en pantalla.
   HECHO: e2e de la ruta dorada en verde y captura de los pasos 7 y 8.
4. #109: cuenta o invitado, sin bloquear el juego.
   HECHO: se juega como invitado y el aviso al salir aparece.
P3 (dom 11:00):
5. Contratos internos (FLUJO §2): VistaEscena en vista.ts, props de EscenaBase, eventos de
   feedback desde novedades() con id estable, ajustes del jugador.
   HECHO: PR de contratos fusionado y typecheck en verde.
6. Lanzar las pistas E e I como subagentes (bloques 1 y 2: cielo de Marte, niño, portada,
   terreno, kit, base, módulos, Iris rover y la Ingeniera en 3D), cada una en su worktree.
   Medir draw calls y triángulos en un celular y un PC viejo.
   HECHO: decisión de P3 (3D o respaldo 2D) tomada con Santiago con esas medidas.
P4 (dom 13:00):
7. Integración: componentes de I en todas las pantallas, escena de E en Base3D, tema oscuro
   borrado, un solo ConfirmarAccion, Iris compañera (#149: guiaIrisLugar y briefingIris;
   importá GestoIris de agents con alias) y términos del glosario en contexto.
   HECHO: puerta de APLICACION.md §10 completa y aprobada por María Paula.
8. Si sobra antes de P4: pista A (AUDIO.md). Si no, se entrega sin sonido.

CÓMO LANZÁS LAS OTRAS PISTAS: como subagentes con el bloque de docs/prompts/ui-escenario.md,
ui-interfaz.md o ui-audio.md más UNA tarea concreta, con el modelo y esfuerzo de la tabla,
cada una en su worktree (FLUJO §1.2), máximo 2–3 a la vez. Vos revisás su diff contra la
lámina, hacés el commit y abrís el PR.
Otros niveles: no construyas selector de niveles hasta que se cierre #152 (NIVELES.md §8).

TOKENS: textos EN/ES con Haiku u OpenCode y DeepSeek V4.1 Flash; pruebas del reductor con
Sonnet; conexión con el motor y revisión del diff en la sesión principal.

CADA PR: npm run typecheck, npm test, npm run build y el e2e; captura. Los cinco invariantes
de MECANICAS.md §6 con prueba.

META PARA PARAR EL LOOP: la ruta dorada se juega completa en el preview de develop en EN y
ES, con la escena v8 (o el respaldo 2D si P3 recortó) y la puerta §10 aprobada. Después de P4
solo arreglos.

PRIMERA RESPUESTA (sin código, máx. 8 líneas): resultado de revisar #163 y #151, qué está
sin subir en feat/ui-escena-3d y los 3 primeros PRs atómicos. Esperá el OK.

Después: /loop 10m Haz UNA iteración de la pista M según docs/LOOP.md y docs/prompts/ui-integracion.md.
```
