# Plan de cierre: fidelidad a las láminas (dom 15 nov, tarde)

**Para:** José, Camilo, Daniel y Jaime. María Paula sigue con su propio plan de personajes y es quien aprueba la fidelidad.
**Manda sobre** los briefs `front-*.md` donde choquen. Las reglas comunes de [README.md](README.md) siguen vigentes.

## Qué cambió

- **`feat/ui-escenarios` ya no existe.** Entró a `develop` con #262. Desde ahora toda rama sale de `origin/develop`, se rebasa sobre `origin/develop` y el PR va hacia `develop`. Fusiona Santiago con squash, cuando pasa la CI.
- **El juego es 3D siempre** (#244). No se propone volver a 2D. El respaldo 2D sin WebGL sigue existiendo solo como red de seguridad técnica.
- **La meta de la tarde es una sola:** que cada pantalla se vea como su lámina de `docs/referenciapau/referencias/`. No se agregan mecánicas nuevas.

## Regla de fidelidad (vale para los cuatro)

1. **Antes de tocar nada**, abrí la lámina canónica con la herramienta de lectura de imágenes y escribí en 3 líneas qué tiene que ver el jugador: silueta, posición de cada pieza y colores.
2. **Después de cada cambio**, capturá en 1024×683 y en 844×390 y poné la captura al lado de la lámina (skill `solar-shield-pr-visual`). Si no coinciden en silueta y layout, no está terminado.
3. **Lo que no está en la lámina no va** (DISEÑO §8). Lo que está en la lámina y no funciona en el juego tampoco se dibuja: nada de botones de adorno.
4. **Las únicas desviaciones permitidas:**
   - el cielo caramelo de MARTE §4, nunca el azul de las láminas;
   - los números reales del motor en lugar de los de la lámina;
   - los textos en inglés base y en español por i18n.
5. **Colores solo de `ui/src/estilos/tokens.ts`.** Cero hex sueltos, cero emojis y nada del tema oscuro.

## Calendario de la tarde (propuesta, la confirma Santiago)

| Hora | Qué |
| --- | --- |
| hasta 13:00 (P4) | Rebasar y fusionar la cola aprobada. Después de P4 solo entran arreglos de fidelidad y errores. |
| 13:00 a 17:00 | Arreglos de fidelidad, uno por PR, de menos de ~300 líneas. |
| 17:00 | Último PR a `develop`. |
| 17:30 | `develop` → `main` (#260 regenerado) y prueba en el sitio desplegado. |
| 20:00 (P5) | Entrega. |

## Orden de fusión de la cola (todo hacia `develop`)

1. José: #233 (E3), #240 (E4) y #242 (encuadre), rebasados sobre `develop`.
2. Daniel: #248 → #249 → #250 → #251 → #252, y después, uno por uno, #257, #258, #264, #265 y #266. Cada uno se rebasa sobre el anterior ya fusionado.
3. José: #269 (E6 con la escena y el HUD de `mundo/01`), rebasado sobre `develop`, con `ui/src/escena/**` igual al de la pila de Daniel.
4. Camilo: #267. #268 entra solo con la aprobación de Jaime y el OK de Santiago a la regla de plazo.

---

## José: integración y pantallas

```text
Sos el agente de José en Solar Shield (integración y pantallas del frontend v8). Leé
CLAUDE.md, docs/prompts/cierre-fidelidad.md (todo), docs/prompts/front-integracion.md
(tus archivos), ui/ESTADO.md (tu sección), ESCENAS.md §1–§3 y DISEÑO.md §5 y §8.
Ramas desde origin/develop, PR hacia develop. Solo tus archivos (FLUJO §1).

TAREAS EN ORDEN (una por iteración, cortá en la primera que no esté hecha):
1. Rebasar sobre origin/develop #233, #240 y #242 (quitá los commits que ya entraron por
   squash; push con --force-with-lease). HECHO: diff de tamaño real y CI en verde.
2. #269 (E6): rebasar sobre develop cuando entre la pila de Daniel, con escena/** igual a la
   suya. HECHO: captura de E6 al lado de mundo/01 con las placas y el objetivo arriba a la
   derecha, Crew y Map abajo a la izquierda, [E] al centro y [V] abajo a la derecha.
3. E7 Tormenta nueva (hoy es la pantalla vieja: emoji ☀ y clases del tema oscuro). Se
   escribe desde cero según ui/04 y personajes/07, con la escena en pausa detrás y el chip
   "Paused" arriba. Un PR por panel, en este orden:
   a. "Choose your expert": tres ExpertPortrait con su rol (Power & repairs, Crew
      protection, Solar events), el campo "Ask your crew…" con Send y los accesos rápidos
      por recurso (Energy, Life support, Shielding) con su valor real.
   b. "Compare your plan": la experta elegida con su frase, la pieza con su nombre, el
      CostRow (Costs now / Later) del motor y los botones de acción y Back. Se suma "Ask
      another expert".
   c. "Verify the warning": las dos expertas que se contradicen, "Check the source", la
      tarjeta de fuente NASA con su id y su fecha, las dos preguntas y "View source".
   d. "Decision recorded": Action confirmed, el costo aplicado, Benefit pending y Return
      to exploration.
   Borrá Tormenta.tsx en el último PR. El interruptor "Voice" NO va mientras no haya voz
   real. HECHO por panel: captura al lado de ui/04 en 1024×683 y 844×390, e2e en verde.
4. E5 Módulos sobre la escena: EscenaBase detrás, con el anclaje elegido resaltado en cian
   como la consola de mundo/01, y el panel de decisión a la derecha como el panel 02 de
   ui/04. HECHO: captura al lado de mundo/01 + ui/04.
5. Después de toda acción confirmada en E6, la tarjeta "Decision recorded" (panel 04 de
   ui/04) en lugar del mensaje suelto. HECHO: captura y e2e en verde.
6. Al final: recorrer la ruta dorada completa en el preview desplegado, en EN y ES, y sin
   WebGL. Cada error va a un issue con su dueño.

Piezas que faltan y son de Jaime (chip Paused, accesos rápidos por recurso, tarjeta de
fuente compacta, tarjeta Decision recorded): si no están, abrí un issue `bloquea:ui` para
Jaime y montá lo que ya existe. No las dibujes vos.
CADA PR: menos de ~300 líneas, ficha de fidelidad (FLUJO §7.1), typecheck, test, build y
e2e. Si cambia un texto en inglés que usa ruta-dorada.spec.ts, actualizá el spec.
META: E5, E6, E7 y E8 iguales a sus láminas y fusionadas en develop antes de las 17:00.
Al llegar, cerrá el loop, actualizá tu sección de ui/ESTADO.md y avisá a Santiago.
```

**Loop:** `/loop 10m Haz UNA iteración de la sección de José en docs/prompts/cierre-fidelidad.md.`

---

## Daniel: escenario 3D

```text
Sos el agente de Daniel en Solar Shield (escenario 3D de Marte). Leé CLAUDE.md,
docs/prompts/cierre-fidelidad.md (todo), docs/prompts/front-escenario.md (tus archivos y el
cierre del escenario), ui/ESTADO.md (tu sección), MARTE.md §4–§5 y DISEÑO.md §3 y §8.
Láminas: mundo/01, mundo/02, exterior/01, exterior/02, exterior/03 y piezas/01–10.
Ramas desde origin/develop, PR hacia develop. Solo ui/src/escena/** sin mundo.ts, fisica.ts
ni navegacion.ts (de Camilo) y sin personajes (de María Paula).

TAREAS EN ORDEN (una por iteración):
1. Llevar tu pila a develop: rebasá #248 sobre develop apenas entre #242, después cada
   siguiente sobre el anterior ya fusionado (#249 → #252), y luego #257, #258, #264, #265 y
   #266 uno por uno. No abras capas nuevas encima de PRs sin fusionar. HECHO: todos
   fusionados y la CI completa en verde en cada uno.
2. Medición real (pendiente desde las 10:00): ?modulos=todos&medir=1 en un celular y en un
   PC viejo, no con SwiftShader. HECHO: fps promedio y mínimo, draw calls y triángulos en el
   PR y en ui/ESTADO.md. Si el celular baja de 30 fps, bajá la calidad automática antes de
   seguir con la fidelidad.
3. Vista de juego contra mundo/01, captura lado a lado en cada PR. Revisá y corregí, de a
   uno, lo que más se aleje:
   - rocas grandes facetadas en las esquinas inferiores del cuadro;
   - balizas a lo largo del camino ancho;
   - la torre de control con su anillo de vidrio y el hábitat alargado en plano medio;
   - las dos cúpulas con cultivos a la derecha;
   - la fila de 4 paneles a la izquierda.
   Siempre con el cielo caramelo de MARTE §4.
4. Kit contra piezas/01–10: una captura por pieza al lado de su lámina (puerta, consola,
   caja, panel solar, jardinera, depósito, banco, antena). Corregí las 3 que más se alejen,
   una por PR.
5. Planta contra exterior/03 (cenital): anillo de caminos con balizas, nave arriba a la
   izquierda, energía a la izquierda, cúpula de control al centro con corredores de vidrio,
   invernadero arriba a la derecha y refugio abajo a la izquierda. HECHO: captura cenital al
   lado de la lámina sin tramos sueltos.
6. Primera persona contra mundo/02, junto con #258: guantes en las esquinas inferiores y el
   contorno cian en la consola cercana.
Solo si Santiago lo pide después de las 17:00: interiores de estaciones (estaciones/00–08).

PRESUPUESTO: menos de 80 draw calls y 80 000 triángulos con los 5 módulos, DPR máx. 1,5.
Ningún número de juego ni regla en la escena: leés VistaEscena y LUGARES.
CADA PR: menos de ~300 líneas, ficha de fidelidad con captura al lado de la lámina, y
typecheck, test y build. Los avisos que toquen mundo.ts van a un issue para Camilo (#254).
META: escenario fusionado en develop, medido en hardware real y fiel a mundo/01 y exterior/03
antes de las 17:00. Al llegar, cerrá el loop y actualizá tu sección de ui/ESTADO.md.
```

**Loop:** `/loop 10m Haz UNA iteración de la sección de Daniel en docs/prompts/cierre-fidelidad.md.`

---

## Camilo: ubicación, recorrido y prueba

```text
Sos el agente de Camilo en Solar Shield (ubicación, recorrido, cámaras y mapa; también
probador). Leé CLAUDE.md, docs/prompts/cierre-fidelidad.md (todo),
docs/prompts/front-ubicacion.md (tus archivos), ui/ESTADO.md (tu sección), ESCENAS.md §3 y
mapa-base-jezero.svg. Láminas: exterior/03, mundo/01, mundo/02 y ui/02.
Ramas desde origin/develop, PR hacia develop. Tus archivos: ui/src/escena/mundo.ts,
fisica.ts, navegacion.ts y sus pruebas, ui/src/componentes/Mapa.tsx y los nuevos
entradaTactil.ts y ControlesTactiles.tsx. No toques engine/ (#268 espera a Jaime).

TAREAS EN ORDEN (una por iteración):
1. Issue #254 de Daniel, después de su pila: rocas de primer plano y consolas en
   TERRENO.circulos; hábitat 3–4 m hacia +x para que quede a la derecha de la consola como
   en mundo/01; holguras reciclador–invernadero y escudo–hábitat; los pies sobre las losas
   (plaza a 0,10 m, losa a 0,05 m). HECHO: sinSolapes.test y navegacion.test en verde y
   captura desde la cámara de juego al lado de mundo/01.
2. Cámaras contra mundo/01 (tercera) y mundo/02 (primera) con la tecla V: transición de
   300 ms sin atravesar paredes y corte directo con movimiento reducido. HECHO: las dos
   capturas al lado de sus láminas.
3. Controles táctiles (ESCENAS §3.5), en archivos nuevos: joystick flotante a la izquierda,
   zona de cámara a la derecha, mover y mirar a la vez, touch-action: none y pausa con
   visibilitychange. Usá FacetButton de Jaime. No tapes los botones de mundo/01 (Crew y Map
   abajo a la izquierda, [E] al centro, [V] abajo a la derecha): coordiná con José dónde va
   el joystick. HECHO: probado en un celular real y captura 844×390 al lado de mundo/01.
4. Panel Map contra ESCENAS §3.4 y la familia de ui/02 y ui/03: plano desde LUGARES, el niño,
   el objetivo en cian, los módulos construidos y los anclajes vacíos, y cada lugar como un
   botón. HECHO: captura y prueba con teclado.
5. Prueba (rol de probador): cada hora, la ruta dorada completa en el preview desplegado,
   en EN y ES, en un celular y sin WebGL. Cada error va a un issue con la etiqueta del dueño
   y los pasos para repetirlo.

CADA PR: menos de ~300 líneas, ficha de fidelidad con captura al lado de la lámina, y
typecheck, test, build y e2e.
META: base recorrible en las dos cámaras y en celular, sin atravesar nada, con mapa fiel y
la prueba de las 17:00 reportada. Al llegar, cerrá el loop y actualizá tu sección de
ui/ESTADO.md.
```

**Loop:** `/loop 10m Haz UNA iteración de la sección de Camilo en docs/prompts/cierre-fidelidad.md.`

---

## Jaime: interfaz facetada y motor

```text
Sos el agente de Jaime en Solar Shield (interfaz facetada de las láminas v8, y dueño del
motor). Leé CLAUDE.md, docs/prompts/cierre-fidelidad.md (todo),
docs/prompts/front-interfaz.md (tus archivos), ui/ESTADO.md (tu sección) y DISEÑO.md §2, §5 y
§8. Láminas: mundo/01, ui/01–04, personajes/07, inicio/01–03.
Ramas desde origin/develop, PR hacia develop. Tus archivos: ui/src/componentes/base/**,
ui/src/estilos/**, Portada, Intro, Carga, TarjetaFuente, DatosUsados, Glosario, Iconos,
LogoSolarShield, RetratoIris y engine/. NUNCA fusiones tus propios PRs: fusiona Santiago.

TAREAS EN ORDEN (una por iteración):
1. Motor: revisá #268 de Camilo, que toca engine/, y aprobalo o pedí cambios en el PR.
   Confirmá que la semilla dorada sigue igual (dorada.test y ganable.test).
2. Placas de recurso contra mundo/01. Hoy son cajas altas con la etiqueta arriba. En la
   lámina son píldoras facetadas de una línea: icono, nombre y valor ("Energy 70"). Lo que
   llega en camino va en una línea chica debajo, solo mientras haya algo pendiente. El icono
   de Life support es el de pulmones de mundo/01, no el brote. HECHO: captura del HUD al
   lado del borde superior de mundo/01.
3. Piezas que José necesita para la E7 (ui/04 y personajes/07), sin montarlas en pantallas:
   - chip "Paused" con el icono de pausa (dos barras, que hoy falta en Iconos);
   - acceso rápido por recurso (icono, nombre y valor);
   - tarjeta de fuente compacta ("NASA / Archived event" con su icono de documento) y las
     preguntas como chips;
   - tarjeta "Decision recorded" (Action confirmed, el costo aplicado, Benefit pending y la
     acción para volver).
   Cada una en el muestrario. HECHO: captura al lado del panel de ui/04 que le corresponde.
4. Repaso de fidelidad de lo fusionado en #220 contra inicio/01–03, ui/01–03 y
   personajes/02, 04, 06 y 09: una captura lado a lado por pieza y corregí las 3 que más se
   alejen, una por PR.
5. Responsive: cada pieza nueva en 1024×683, 844×390 y 390×844, con texto de 16 px mínimo
   en celular.

TEXTOS: claves nuevas solo bajo tu prefijo, en.json primero (skill solar-shield-i18n).
CADA PR: menos de ~300 líneas, ficha de fidelidad, test de tokens en verde, cero hex fuera de
tokens.ts, y typecheck, test, build y e2e.
META: HUD y piezas de la E7 fieles a mundo/01 y ui/04, entregadas a José antes de las 15:00,
y repaso de #220 hecho antes de las 17:00. Al llegar, cerrá el loop y actualizá tu sección de
ui/ESTADO.md.
```

**Loop:** `/loop 10m Haz UNA iteración de la sección de Jaime en docs/prompts/cierre-fidelidad.md.`

---

## Dependencias entre personas

| Quién espera | A quién | Qué |
| --- | --- | --- |
| José (E7, tarea 3) | Jaime (tarea 3) | Chip Paused, accesos rápidos, tarjeta de fuente compacta y Decision recorded |
| José (#269) | Daniel (tarea 1) | La pila del escenario en develop |
| Camilo (#254) | Daniel (tarea 1) | La pila en develop, porque toca las posiciones que usa la escena |
| Camilo (#268) | Jaime (tarea 1) | La revisión del motor |
| Camilo (táctiles) | José | Dónde va el joystick sin tapar el HUD |
| Todos | María Paula | La aprobación de fidelidad de cada pieza |
