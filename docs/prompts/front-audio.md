# Brief del frontend: audio y voz (Jaime, o quien termine primero; al final)

**Cuándo:** solo cuando la integración esté aprobada por María Paula y quede tiempo antes de P4. Si no, se entrega sin sonido.
**Tus archivos:** `ui/src/audio/**`, `assets/audio/**`, `assets/LICENCIAS.md`.
**Leé:** [AUDIO.md](../referenciapau/AUDIO.md) completo y [FLUJO.md](../referenciapau/FLUJO.md) §3 (eventos de feedback y ajustes del jugador).
**Rama:** desde `feat/ui-escenarios`, PR hacia `feat/ui-escenarios` ([FLUJO.md](../referenciapau/FLUJO.md) §2). **Cuándo empezar:** al final, como dice arriba.
**Fuente visual única:** las láminas de `docs/referenciapau/referencias/` y [DISEÑO.md](../referenciapau/DISEÑO.md). El diseño anterior (prototipo, `estilos.css`, `mision.css`, tema oscuro, formas de hoy) **se borra** (FLUJO §2.2): no se toma nada de él.
**Cada PR:** solo tus archivos; menos de ~300 líneas; **ficha de fidelidad** ([FLUJO.md](../referenciapau/FLUJO.md) §7.1) con la captura al lado de la lámina canónica (skill `solar-shield-pr-visual`); salida de `npm run typecheck`, `npm test`, `npm run build` y `npm run e2e` (hasta que la CI cubra la rama); puerta de [APLICACION.md](../referenciapau/APLICACION.md) §10. Lo aprueba y fusiona María Paula.

## Tareas (en orden)

1. `motor.ts`: un `AudioContext` creado con el primer gesto; canales música, efectos y voz.
2. `efectos.ts` y `useSonidos.ts`: la tabla de AUDIO §4 ligada a los eventos de feedback de José.
3. Lectura en voz alta (AUDIO §5) detrás de su interruptor.
4. Entrada de voz con gesto explícito y aviso (AUDIO §6), que manda el texto por el mismo camino que lo escrito.
5. Música con licencia verificable o colchón con Web Audio, registrada en `assets/LICENCIAS.md`.

José monta los interruptores en `Settings` con tus componentes base.
**Meta:** validación de AUDIO §8 completa, o P4: lo que no entró se entrega sin sonido.
