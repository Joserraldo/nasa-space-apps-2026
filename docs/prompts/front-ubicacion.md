# Brief del frontend: ubicación y recorrido (Camilo)

**Qué construís:** dónde está cada cosa en la base, cómo se camina, las cámaras y el mapa.
**Tus archivos:** `ui/src/escena/mundo.ts`, `fisica.ts`, `navegacion.ts`, `navegacion.test.ts`, `ui/src/componentes/Mapa.tsx`.
**Leé:** [ESCENAS.md](../referenciapau/ESCENAS.md) §3, [`mapa-base-jezero.svg`](../referenciapau/mapa-base-jezero.svg), [MECANICAS.md](../referenciapau/MECANICAS.md) §3.4 (destinos de Iris por paso), [APLICACION.md](../referenciapau/APLICACION.md) §7 (cámara), láminas `exterior/03`, `mundo/01`, `mundo/02`.
**Rama:** desde `feat/ui-escenarios`, PR hacia `feat/ui-escenarios` ([FLUJO.md](../referenciapau/FLUJO.md) §2). **Todo se escribe nuevo, desde ya:** nadie trabaja sobre el preview desplegado ni re-estiliza archivos viejos ([FLUJO.md](../referenciapau/FLUJO.md) §2.3). La subida de María Paula fue solo lógica (#184, #197).
**Fuente visual única:** las láminas de `docs/referenciapau/referencias/` y [DISEÑO.md](../referenciapau/DISEÑO.md). El diseño anterior (prototipo, `estilos.css`, `mision.css`, tema oscuro, formas de hoy) **se borra** (FLUJO §2.2): no se toma nada de él.
**Cada PR:** solo tus archivos; menos de ~300 líneas; **ficha de fidelidad** ([FLUJO.md](../referenciapau/FLUJO.md) §7.1) con la captura al lado de la lámina canónica (skill `solar-shield-pr-visual`); salida de `npm run typecheck`, `npm test`, `npm run build` y `npm run e2e` (hasta que la CI cubra la rama); puerta de [APLICACION.md](../referenciapau/APLICACION.md) §10. Lo aprueba y fusiona María Paula.

## Tareas (en orden)

1. **`LUGARES` y anclajes** (contrato de FLUJO §3): revisar las posiciones contra `exterior/03` y `mundo/01`, anclajes de los 5 módulos y de cada experta (Ingeniera en `taller`, Doctora en `habitat`, Meteoróloga en `sensor`) y dock de Iris en `taller`. HECHO: contrato fusionado y avisado a Daniel y María Paula.
2. **Colisiones y caminar** (`fisica.ts`, gravedad de Marte con su fuente, #141): colisiones simples separadas de las mallas, sin atravesar edificios. HECHO: tests de navegación en verde.
3. **Cámaras** de 3.ª y 1.ª persona con `KeyV`, transición de 300 ms sin atravesar paredes y corte directo con movimiento reducido (como `mundo/01` y `mundo/02`). HECHO: captura de las dos cámaras.
4. **Recorridos:** los dos circuitos y el atajo de ESCENAS §3.2; ningún lugar bloqueado por la fase. HECHO: se llega a los 10 lugares caminando y con teclado.
5. **Panel `Map` y lista de lugares** (ESCENAS §3.4): plano en SVG desde `LUGARES` con la familia v8 (usá los componentes base de Jaime), posición del niño, objetivo en cian, módulos construidos y anclajes vacíos; cada lugar es un botón que lleva al niño. HECHO: el mapa funciona con teclado y es la alternativa accesible.
6. **Controles táctiles** (ESCENAS §3.5, archivos nuevos `entradaTactil.ts` y `ControlesTactiles.tsx`): joystick flotante a la izquierda, zona de cámara a la derecha, botón de acción y de cámara, mover y mirar a la vez, `touch-action: none`, pausa con `visibilitychange`. HECHO: probado en un celular real (mover y girar a la vez, acción con un lugar cercano, doble toque recentra) y captura en 844 x 390 al lado de `mundo/01`.

**Contratos:** José monta el panel y le pasa la posición del niño y el objetivo; Daniel y María Paula leen tus `LUGARES`.
**Además, tu rol de diseño y probador:** NIVELES §7, revisión de #153–#156 y prueba de la ruta dorada (prompt [diseno.md](diseno.md)).
**Meta:** base recorrible en las dos cámaras, sin atravesar paredes, con mapa accesible, antes de P3.
