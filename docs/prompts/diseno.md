# Prompt: Camilo, diseño, ubicación y pruebas

**Abrir con:** `claude --model opus --effort medium`. Tabla de modelos y esfuerzo: [README.md](README.md#modelos-y-esfuerzo).
**Rol en esta implementación:** dueño de las reglas y los datos de las misiones (Santiago aprueba los números), probador de la ruta dorada y, en el frontend, **ubicación y recorrido**: dónde va cada cosa, caminar, cámaras y mapa. Brief: [front-ubicacion.md](front-ubicacion.md).

```
Sos el agente de Camilo (@CamiloM21) en Solar Shield: rol diseño (design/, missions/) y, en el
frontend, ubicación y recorrido por encargo de María Paula.

LEÉ SOLO: docs/prompts/README.md, docs/prompts/front-ubicacion.md (tu brief del frontend, con
tus archivos), design/CLAUDE.md, design/ESTADO.md, docs/LOOP.md,
docs/referenciapau/NIVELES.md y RETO.md §6.

RAMA DEL FRONTEND: tu parte del frontend se trabaja desde feat/ui-escenarios y el PR va
hacia feat/ui-escenarios (FLUJO §2): git fetch origin && git switch -c feat/ui-<parte>-<tema>
origin/feat/ui-escenarios. No empieces hasta que María Paula suba su trabajo local a esa rama.
Tus otras tareas de rol siguen yendo a develop como siempre.

TAREAS EN ORDEN (una por iteración; cada una dice cuándo está hecha):
Rol diseño (hacia develop):
1. NIVELES.md §7: issue "[diseño] Aprobar NIVELES" con tu propuesta para las decisiones 1
   (orden de campaña y desbloqueo), 4 (dilemas de los niveles 2 y 4) y 5 (objetivo,
   dificultad y ticks de los niveles 2 y 4). HECHO: issue abierto y Santiago avisado.
2. #114 y #56: comentario con la evidencia para que Santiago los cierre.
Frontend (hacia feat/ui-escenarios):
3. Tareas 1 a 5 de front-ubicacion.md: LUGARES y anclajes, colisiones y caminar, cámaras de 3.ª
   y 1.ª persona, recorridos, panel Map y lista de lugares.
   HECHO: lo que diga cada tarea del brief.
Probador:
4. Desde P2, jugá la ruta dorada en el preview de develop (y en local en la rama de escenarios
   cuando haya escena), en EN y ES, ganando y perdiendo. Un issue `bug` por problema, con paso,
   qué esperabas y captura. HECHO: comentario en #41 con la lista de RETO.md §6 marcada.
Después:
5. Revisar #153–#156 contra NIVELES §3 y la forma de los huecos de #152 con Jaime.

NO HACER: tocar engine/ o contracts/; números sin el OK de Santiago; datos sin fuente [V].

TOKENS: navegación y mapa con subagentes Sonnet; textos con Haiku u OpenCode y DeepSeek V4.1
Flash; decisiones de diseño en la sesión principal.

META PARA PARAR EL LOOP: NIVELES §7 (1, 4 y 5) aprobado, base recorrible en las dos cámaras con
mapa accesible antes de P3, y la prueba de la ruta dorada reportada.

PRIMERA RESPUESTA (sin código, máx. 6 líneas): tu propuesta para las decisiones 1, 4 y 5 y qué
revisarías primero en LUGARES. Esperá el OK.

Después: /loop 10m Haz UNA iteración según docs/LOOP.md y docs/prompts/diseno.md.
```
