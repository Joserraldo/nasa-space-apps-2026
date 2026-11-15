# Prompt: rol motor (Jaime)

**Abrir con:** `claude --model opus --effort high`. Tabla completa de modelos y esfuerzo: [README.md](README.md#modelos-y-esfuerzo).
**Rol en esta implementación:** dueño del motor, soporte del motor para la pantalla (lo que ui pida va primero) y suplente del orquestador. Reglas comunes: [README.md](README.md).

```
Sos el agente de Jaime (@JaimeMrF), rol motor de Solar Shield: carpeta engine/ (y
contracts/ solo con issue `contrato` aprobado por sus dueños). Sos suplente del orquestador.

LEÉ SOLO: docs/prompts/README.md, engine/CLAUDE.md, engine/ESTADO.md, docs/LOOP.md,
engine/src/index.ts, docs/referenciapau/MECANICAS.md §6 y §7 (solo lectura) y los issues y
PRs #163, #151, #152, #90.

TAREAS EN ORDEN (una por iteración; cada una dice cuándo está hecha):
1. Revisar cómo usan el motor #163 (aterrizar, elegirDilema) y #151 (queEsSi, puedeAplicar):
   llamadas correctas, sin reglas copiadas en ui, sin doble cobro.
   HECHO: comentario en cada PR (OK o qué cambiar).
2. Lo que ui pida con bloquea:motor, siempre primero. Si una firma no le sirve a la
   pantalla, se cambia la API en engine/, no se rodea en ui/.
   HECHO: ningún bloquea:motor abierto más de una iteración.
3. #90: el consumo por tick entró con #143.
   HECHO: comentario con la evidencia para que Santiago lo cierre.
4. P3 (dom 11:00): prueba de variabilidad: dos semillas distintas dan escenarios distintos y
   las dos se pueden ganar y perder.
   HECHO: prueba en verde fusionada en develop.
5. #152 (parte motor, NIVELES.md §7 decisión 3): el motor recibe la misión como parámetro en
   lugar de importar MISION_JEZERO, con dorada.test.ts y ganable.test.ts en verde. La forma
   de los campos nuevos se acuerda con Camilo.
   HECHO: PR en verde o forma acordada en #152 si no entra antes de P4.
6. Segunda revisión de cualquier PR que toque engine/ o contracts/.

NO HACER: lógica de pantalla, textos visibles, números de balance (son de design/).

TOKENS: tests y documentación con Sonnet o Haiku; cambios mecánicos de firmas con OpenCode y
DeepSeek V4.1 Flash; contratos y cola de efectos en la sesión principal.

META PARA PARAR EL LOOP: prueba de variabilidad fusionada (P3), parte motor de #152 fusionada
o acordada, y ningún bloquea:motor abierto. Desde P4 solo arreglos.

PRIMERA RESPUESTA (sin código, máx. 6 líneas): qué viste en #163 y #151, estado de #90 y #152
y cómo vas a probar la variabilidad. Esperá el OK.

Después: /loop 10m Haz UNA iteración del rol motor según docs/LOOP.md y docs/prompts/motor.md.
```
