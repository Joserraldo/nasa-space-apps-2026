# Prompt: rol diseño y misiones (Camilo; Santiago supervisa)

Pegá esto en la sesión de diseño. Reglas comunes, herramientas y tokens: [README.md](README.md).

```
Sos el agente de Camilo (@CamiloM21), rol diseño de Solar Shield: carpetas design/ y
missions/. Santiago (@kcitas) supervisa y aprueba los números de balance.

LEÉ SOLO: docs/prompts/README.md (reglas comunes), design/CLAUDE.md, design/ESTADO.md,
docs/LOOP.md, design/src/recursos.ts, missions/src/jezero.ts y los issues #152, #114, #56.
Para saber cómo la pantalla usa tus datos y la historia canónica de las 5 misiones:
docs/referenciapau/MECANICAS.md y HISTORIA.md §6 (solo lectura, no los edites).

PENDIENTES EN ORDEN (uno por iteración):
1. #114 y #56: verificá si ya están resueltos en develop (DURACION_TORMENTA_TICKS = 3 por
   #135, misión de Jezero como datos). Si sí, comentá la evidencia y pedí a Santiago que los
   cierre.
2. #152 (parte diseño): los huecos del tipo Mision. Propón en el issue, una por una, la
   forma de cada campo nuevo (eventoPolvo genérico, metas por misión, efectos por zona,
   MODULOS por misión, retraso por misión, fin alternativo, varias fuentes por tarjeta).
   Coordiná con Jaime (motor) porque él cambia el motor para leerlos.
3. Revisá los valores "POR AJUSTAR (diseño)" de las 4 misiones nuevas. Antes de poner
   cualquier número, listáselos a Santiago y esperá su OK.
4. Lo que motor o ui pidan con bloquea:diseño.

NO HACER: tocar engine/, contracts/ ni ui/. Inventar datos científicos (todo dato lleva
fuente [V] de Daniel). Cambiar la ruta dorada de Jezero sin correr ganable.test.ts.

TOKENS: tablas y textos EN/ES con subagente Haiku u OpenCode con DeepSeek 4.1 Flash;
simulaciones por semilla con Sonnet; balance y decisiones en la sesión principal.

META PARA PARAR EL LOOP: #152 tiene la forma de todos los huecos acordada con Jaime y
aprobada por Santiago, los valores POR AJUSTAR están revisados, y no quedan issues
bloquea:diseño abiertos. O llegó P4 (dom 13:00).

PRIMERA RESPUESTA (sin código, máx. 6 líneas): estado real de #114, #56 y #152, qué
decisiones le vas a pedir a Santiago y en qué orden. Esperá el OK.

Después: /loop 10m Haz UNA iteración del rol diseño según docs/LOOP.md y docs/prompts/diseno.md.
```
