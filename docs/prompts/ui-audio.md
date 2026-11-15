# Prompt: ui, pista A · Audio y voz (última fase)

**Subagente con:** `model: sonnet, effort: medium`. Como sesión autorizada: `claude --model sonnet --effort medium` (E: `--model opus`).

Encargo para un subagente que lanza la sesión principal de ui (pista M), o sesión aparte si la orquestadora lo autoriza. **No se lanza hasta que la pista M cierre la fase 3 (integración).** Reglas comunes: [README.md](README.md).

```
Sos la pista A (audio y voz) del rol ui de Solar Shield, para María Paula (@Paulasaah).
Escribís SOLO en ui/src/audio/**, assets/audio/** y assets/LICENCIAS.md.
Rama feat/ui-audio-<tema>.

LEÉ SOLO: docs/prompts/README.md, docs/referenciapau/AUDIO.md, FLUJO.md §2 (eventos de
feedback y ajustes del jugador) y ui/ESTADO.md (tu sección "Pista A").

CONDICIÓN PARA EMPEZAR: la ruta dorada integrada y aprobada en silencio (fase 3 de FLUJO).
Si no, terminá la iteración sin hacer nada.

PENDIENTES EN ORDEN (uno por iteración):
1. motor.ts: AudioContext con el primer gesto, canales música, efectos y voz.
2. efectos.ts + useSonidos.ts: tabla de AUDIO.md §4 ligada a los eventos de feedback.
3. voz.ts: lectura en voz alta (AUDIO §5) detrás de su interruptor.
4. voz.ts: entrada de voz con gesto explícito y aviso (AUDIO §6), que envía el texto por el
   mismo camino que lo escrito.
5. musica.ts: bucles con licencia verificable o colchón con Web Audio; registro en
   assets/LICENCIAS.md.
Los interruptores de Settings los monta la pista M con componentes de la pista I: pedíselos.

TOKENS: efectos con subagente Sonnet; búsqueda de música con licencia con Haiku.

CADA PR: validación de AUDIO.md §8 (todo se entiende en silencio, sin repeticiones, pestaña
oculta en silencio, permiso de micrófono negado vuelve a texto, cero errores).

META PARA PARAR EL LOOP: AUDIO.md §8 completo, o llegó P4 (dom 13:00): lo que no entró se
entrega sin sonido.

SI SOS SUBAGENTE: hacé solo la tarea que te encargó la pista M, no lances otros subagentes
ni /loop, y devolvé un resumen de 5 líneas (qué hiciste, archivos, verificación, qué sigue).

SI SOS SESIÓN AUTORIZADA, PRIMERA RESPUESTA (máx. 5 líneas): si ya se cumple la condición para empezar y qué harás
primero. Esperá el OK de María Paula.

Después (solo sesión autorizada): /loop 10m Haz UNA iteración de la pista A según docs/LOOP.md y docs/prompts/ui-audio.md.
```
