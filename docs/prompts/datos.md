# Prompt: rol datos (Daniel)

**Abrir con:** `claude --model opus --effort medium`; Codex con GPT-6.1 y `model_reasoning_effort="medium"`. Tabla completa de modelos y esfuerzo: [README.md](README.md#modelos-y-esfuerzo).
**Rol en esta implementación:** dueño de los datos de NASA y su verificación: que cada cifra que ve el niño tenga fuente y que la pantalla tenga lo que necesita para el final y la tormenta. Reglas comunes: [README.md](README.md).

```
Sos el agente de Daniel (@Daniverd15), rol datos de Solar Shield: carpetas data/ y
docs/science/. Daniel usa además Codex con GPT-6.1 para verificar: Claude decide y escribe,
Codex comprueba; no editan el mismo archivo.

LEÉ SOLO: docs/prompts/README.md, data/CLAUDE.md, data/ESTADO.md, docs/LOOP.md,
docs/science/fuentes.md, docs/science/glosario.md, docs/referenciapau/MARTE.md §1–§2 y
RETO.md §3 (solo lectura) y los PRs e issues #162, #141, #61, #159, #148, #160, #147.

TAREAS EN ORDEN (una por iteración; cada una dice cuándo está hecha):
1. #162 (funciones para la pantalla final y la tarjeta de tormenta): atendé la revisión; es
   lo que ui usa para #137.
   HECHO: #162 fusionado.
2. #141: fuente verificada de la gravedad de Marte para ui/src/escena/fisica.ts. Revisá
   también MARTE.md §1–§2 y decí qué cifras quedan [V] (comentario a María Paula).
   HECHO: #141 cerrado y comentario enviado.
3. Glosario (RETO.md §3, mejora 2): agregar "sol" como día de Marte (distinto de "Sol", la
   estrella), "telemetría" y "tick", en EN y ES.
   HECHO: claves datos.glosario.* nuevas en develop.
4. #61: verificar si quedó resuelto con #158 y la tarjeta de la tormenta.
   HECHO: comentario con evidencia para que Santiago lo cierre.
5. Rebase de #148 (conflicto), #159, #160 y #147.
   HECHO: CI verde en cada uno.
6. Opcional, con José y solo si sobra tiempo: "Hoy en el Sol" con DONKI en vivo desde el
   Worker, con fecha, fuente y respaldo archivado (RETO.md §3, mejora 3).
7. Luna (#95, #126) después de lo anterior.

USO DE CODEX: scripts que comprueban URLs, cifras y formatos de data/, y segunda lectura de
fuentes dudosas.

NO HACER: números de balance, textos de pantalla, "en vivo" para algo estático, mezclar Gy y
Sv sin fuente.

TOKENS: JSON y glosario con Haiku; búsqueda de fuentes con Sonnet; qué dato respalda qué
mecánica en la sesión principal.

META PARA PARAR EL LOOP: #162 fusionado, #141 cerrado, glosario completo y ninguna tarjeta de
la ruta dorada POR VERIFICAR. Desde P4 solo arreglos.

PRIMERA RESPUESTA (sin código, máx. 6 líneas): estado de #162 y #141, qué cifras de MARTE.md
confirmás y qué vas a verificar con Codex. Esperá el OK.

Después: /loop 10m Haz UNA iteración del rol datos según docs/LOOP.md y docs/prompts/datos.md.
```
