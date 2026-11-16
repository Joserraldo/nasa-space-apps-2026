# Plan de jugabilidad: mundo abierto, interacción y misiones

**Para:** Santiago y María Paula, que trabajan en paralelo, y el equipo para lo delegable (§7).
**Base:** `ss-rescue`, rama local `main` en `89a50d6` (A + B + F integrados, 897 pruebas y e2e 5/5 en verde).
**Fecha:** domingo 15 nov 2026. `[V]` = comprobado en el código o en captura; `[NV]` = no comprobado.

Hoy el juego tiene interfaz pero no se juega en el mundo: el niño camina, pero casi todo pasa en paneles. Este
plan convierte la base en el lugar donde ocurre la misión. No cambia reglas del motor (MECANICAS §5).

---

## 1. Diagnóstico: qué hay y qué falta

| Capacidad | Estado | Evidencia |
| --- | --- | --- |
| Caminar (teclado y joystick), cámara 3.ª/1.ª con `V` | Existe y se usa `[V]` | `escena/escena3d.ts`, `movimientoBase.ts`, `entradaTactil.ts` |
| `[E]` por lugar (mesa, taller, hábitat, sensor, escudo) | Existe y se usa `[V]` | `pantallas/lugares.ts:23-45` |
| Objetivo de Iris (`guiaIrisLugar`) | Solo como texto en el chip del HUD `[V]` | `pantallas/lugares.ts:64` |
| Objetivo marcado en el mundo | **No existe.** `vista.lugarObjetivo` se calcula y la escena no lo lee `[V]` | `pantallas/MundoBase.tsx:125`; sin uso en `escena3d.ts` |
| Mapa | Plano con 10 pines **numerados** sobre un cuadro naranja; los nombres solo en la lista `[V]` | `componentes/Mapa.tsx`, captura `e6-base-mapa-1440x900.png` |
| Iris habla en el mundo | **No.** Habla en una franja inferior; `Burbuja` existe sin CSS `[V]` | `componentes/DialogoExperto.tsx`, `Dialogos.tsx:16` |
| Hablar con un tripulante acercándose | **No.** Solo `[E]` sobre el lugar; la Ingeniera gira y saluda, sin diálogo `[V]` | `escena/tripulacionBase.ts:60-72` |
| Tripulación en escena | Solo niño, Ingeniera e Iris. Doctora y Meteoróloga no están `[V]` | `escena/tripulacionBase.ts:29-31` |
| Animaciones | 14 gestos procedurales en `animaciones.ts`; en el juego se usan 4 (reposo, caminar, saludar, explicar) `[V]` | `escena/personajes/animaciones.ts:14-27` |
| Personajes alternativa B | Única implementación en 3D `[V]`. Los retratos 2D siguen siendo el SVG viejo `[V]` | `componentes/base/Retrato.tsx` (no importa nada de `escena/personajes`) |
| Interiores (salas) | **No existen.** Hay puertas como malla, sin entrada `[V]` | `escena/activos/edificios.ts`, `refugio.ts` |
| Paso 4 (módulos) | Lista superpuesta; no se construye caminando al anclaje `[V]` | `pantallas/PantallaModulos.tsx` |
| Otras 4 misiones | Datos en `missions/`, la UI solo importa `MISION_JEZERO` `[V]` | `App.tsx:19` y otros 5 archivos |
| Avería de Iris a destiempo | En la base, en el turno 0, el chip ya dice "Iris needs a repair at the workshop". Según MECANICAS §3.4 se revela en el paso 6. Causa `[NV]`: el umbral de daño en `media` es blindaje < 20 y la captura muestra 52 | captura `e6-base-1440x900.png`, `design/src/ia.ts:23` |

---

## 2. El bucle que se tiene que sentir

Cada paso de la misión se juega igual, en el mundo, sin pasar por un menú:

1. **Iris dice adónde ir.** Globo sobre el rover con una línea corta, y el rover gira o avanza hacia allá.
2. **El destino se ve.** Marcador cian en el lugar, ruta en el piso y flecha en el borde de la pantalla si
   queda fuera de cuadro. El mapa resalta el mismo destino.
3. **El niño camina** (o toca el lugar en el mapa y camina solo, que es la alternativa accesible).
4. **Al llegar, alguien reacciona.** La experta gira, saluda y explica. Aparece `[E] Talk` o `[E] Build`.
5. **Decide.** Recién aquí se abre la tarjeta: costo ahora, después, fuente, confirmar (MECANICAS §4).
6. **Ve la consecuencia en el mundo.** El módulo se instala, la antena gira, Iris falla con cara de error.
   El motor ya aplicó el cambio; la animación solo lo muestra (MECANICAS §5).
7. **Iris propone el siguiente destino.**

**La UI aparece cuando se necesita:**

| Elemento | Cuándo aparece |
| --- | --- |
| Recursos, chip de objetivo, globo de Iris | Al entrar a la base |
| `[E]` con verbo (`Talk`, `Build`, `Enter`, `Use`) | Solo cuando hay algo al alcance |
| `Map` | Con el primer objetivo |
| `Crew` | Después de la primera conversación en el mundo (en el respaldo 2D, siempre) |
| Velocidad del reloj | Cuando el reloj importa (después de colocar los módulos) |
| Tarjeta de decisión, fuente, dilema | Solo dentro del paso 5 del bucle |

`Pause` y la cámara quedan siempre visibles (accesibilidad).

---

## 3. Bloque 0, juntos (antes de separarse): el contrato de frontera

**Hecho:** `ui/src/escena/frontera.ts`, con pruebas en `frontera.test.ts`. Lo escribe solo María Paula;
Santiago lo importa. Las props nuevas de `EscenaBase` (`extends PedidoEscena, AvisosEscena`) son
**aditivas y opcionales**, igual que en la frontera A/B anterior. El archivo es la fuente: si este resumen
y el código no coinciden, manda el código.

| Pieza | Para qué | Estado en la escena |
| --- | --- | --- |
| `Interactivo` (`lugar` / `actor` / `puerta`) y `onInteractivo` | Una sola vía para el `[E]` | Emite lugares; actores en P3 y puertas en P7 |
| `objetivo: { lugar, ruta }` | Marcar el destino de Iris en el mundo | Se acepta; se dibuja en P2. Reemplaza a `vista.lugarObjetivo` |
| `iris: { gesto, cara }` | Gesto y cara del rover (tipos de `guiaIrisLugar`) | Se acepta; se anima en P6. `caraIrisModelo` traduce a las caras del modelo |
| `globo: { actor, texto }` | Línea sobre quien habla (texto ya traducido) | Se acepta; se ancla en P6 |
| `hablando` | Quién habla: gira y gesticula | Se acepta; se anima en P4 |
| `sala` | Dónde está el niño (la pantalla es dueña) | Se acepta; salas en P7 y P8 |
| `CARAS_RETRATO_*` y `rutaRetrato(actor, cara)` | Retratos B en `ui/public/retratos/<actor>-<cara>.png` | Los PNG se generan en P5 |

En el bloque 0 también se decide:
- El dibujo del mapa nuevo (María Paula aprueba un boceto de Santiago).
- El flujo del paso 4 en el mundo (§5, tarea S3).
- Si las caras de retrato de `frontera.ts` alcanzan (persona: neutral, feliz, pensando y preocupado; Iris:
  atenta, feliz, pensando, error y apagada).

---

## 4. Plan de María Paula: mundo, actores y animación

**Archivos de los que es dueña:** `ui/src/escena/**` (incluye `escena3d.ts`, `EscenaBase.tsx`,
`tripulacionBase.ts`, `movimientoBase.ts`, `mundo.ts`, `personajes/**`, `activos/**`), los archivos nuevos
de abajo, `tests/capturas/retratos.mjs` y `ui/public/retratos/`. No toca `pantallas/`, `componentes/` ni los
JSON de i18n: si necesita un texto, se lo pide a Santiago.

| # | Prioridad | Tarea | Hecho cuando |
| --- | --- | --- | --- |
| P1 | P0 | ~~`frontera.ts` y las props nuevas en `EscenaBase`~~ **Hecho** (bloque 0) | typecheck, 901 pruebas, e2e 5/5 y build en verde |
| P2 | P0 | **Destino visible**, archivo nuevo `escena/marcadores.ts`: haz de luz cian en el lugar objetivo, ruta en el piso con `planearRuta` (ya existe) y flecha DOM en el borde cuando el destino queda fuera de cuadro. Sin estado de React por fotograma | Captura con el objetivo dentro y fuera de cuadro, en 1440x900 y 390x844; dentro del presupuesto (prueba de `escena3d.test.ts`: ≤ 80 draw calls) |
| P3 | P0 | **Doctora y Meteoróloga en escena**, en su estación (hábitat y sensor) | Las tres expertas se ven en la captura de la base |
| P4 | P0 | **Coreografía**, archivo nuevo `escena/coreografia.ts`: función pura `(vista, hablando, eventos, cercanía) → gesto por actor`, que usa los 14 gestos de `animaciones.ts`. Mínimo: el niño inspecciona al usar un lugar y habla en diálogo; la experta explica al hablar, repara en el taller y confirma cuando se acepta una acción; la Meteoróloga alerta en la tormenta y verifica al ver la fuente; la Doctora escucha y tranquiliza | Prueba unitaria de la tabla y un video corto o tira de capturas del gesto en el juego |
| P5 | P0 | **Retratos con los personajes B**: `tests/capturas/retratos.mjs` renderiza cada actor y cada cara a `ui/public/retratos/<actor>-<cara>.png`. Se pre-renderiza para no meter three en la carga inicial (≤ 200 KB, APLICACION §8.2) | PNG de los 4 personajes y la pantalla de Iris, con fondo transparente |
| P6 | P0 | **Iris compañera**: en modo `tutorial` avanza delante del niño hacia el destino; `senalar`, `mirar` y `pedir_reparacion` como gestos del rover; cara `error` con interferencia. Ancla el `globo` sobre el actor que habla | Captura de Iris señalando el destino con el globo encima |
| P7 | P1 | **Primera sala: el taller.** Puerta con `Interactivo` de tipo `puerta`; fundido; escena interior propia con sus colisiones y cámara en corte (ESCENAS E9); dock de Iris, banco de trabajo y panel en eje (estación 05). Salir por la misma puerta | Se entra, se camina, se usa el dock y se sale sin perder el `GameState`; e2e de entrar y salir |
| P8 | P1 | Segunda sala: hábitat (refugio, enfermería y comedor, estaciones 06 a 08) con la Doctora adentro | Igual que P7 |
| P9 | P2 | Tormenta en el mundo (cielo, polvo y luz según MARTE.md); animación de instalación de módulo y de antena girando | Capturas antes y durante la tormenta |

---

## 5. Plan de Santiago: flujo de la misión, UI y conexión

**Archivos de los que es dueño:** `ui/src/App.tsx`, `pantallas/**`, `componentes/**`, `juego/**`,
`ui/i18n/*.json` y `tests/e2e/**`. No toca `ui/src/escena/**`: si necesita algo de la escena, lo pide como
cambio en `frontera.ts`.

| # | Prioridad | Tarea | Hecho cuando |
| --- | --- | --- | --- |
| S1 | P0 | **Investigar la avería de Iris a destiempo** (§1, última fila) y corregirla en la UI o abrir un issue al motor si la causa está allá | Al entrar a la base, el objetivo es el del paso 4 y no "Iris needs a repair"; prueba que lo fija |
| S2 | P0 | **Cadena de objetivos**: de `guiaIrisLugar` salen `objetivo`, `iris` y `globo` hacia la escena, y el chip del HUD. `briefingIris()` al entrar a la base, línea por línea en el globo | Se sigue el objetivo del paso 4 al 8 sin abrir `Crew` (nueva e2e: "seguir a Iris") |
| S3 | P0 | **El paso 4 en el mundo**: hablar con la Ingeniera en el taller y caminar a un anclaje vacío; `[E] Build <módulo>` abre la tarjeta de ese módulo (costo ahora y después) y confirma. La lista actual queda como alternativa accesible y para el respaldo 2D | Se colocan los 2 módulos caminando; la ruta dorada sigue en verde |
| S4 | P0 | **Una sola vía para el `[E]`**: leer `onInteractivo` y mostrar el verbo correcto. Con un actor, `Talk` abre el diálogo con `hablando` puesto y el retrato B; con una puerta, cambia `sala` | Prueba de que cada `Interactivo` produce su acción y ninguno cobra al acercarse (invariante 1) |
| S5 | P0 | **Retratos B en toda la UI**: `Retrato.tsx` usa `ui/public/retratos/*.png` con el SVG actual como respaldo si falta el archivo. Se ven en la portada, la intro, la carga, el diálogo, la tormenta y el final | Capturas de las 6 pantallas con las caras nuevas |
| S6 | P0 | **UI progresiva** según la tabla de §2 | e2e: al entrar a la base no se ve `Crew`; aparece después de la primera conversación |
| S7 | P1 | **Mapa nuevo**: plano dibujado con la familia v8 (ESCENAS §3.4): placas con icono y nombre corto en vez de números, caminos, módulos construidos frente a anclajes vacíos, el niño con su rumbo y el objetivo en cian con pulso. Tocar un lugar fija el destino, cierra el mapa y la escena muestra la ruta. Si el niño está dentro de una sala, el mapa lo dice | Captura en los 4 tamaños aprobada por María Paula |
| S8 | P1 | **Tormenta y telemetría escenificadas**: alerta, la Meteoróloga en el sensor y luego el dilema; telemetría desde la mesa con los ticks pendientes reales en el chip | La ruta dorada pasa por el mundo, no solo por paneles |
| S9 | P1 | E4: pines del sitio con icono y nombre en vez de solo números | Captura en 1440x900 y 844x390 |
| S10 | P2 | Quitar los emojis de `componentes/Dialogos.tsx:7` (reemplazar por `Icono`) | grep sin emojis en `ui/src` |

---

## 6. Orden en paralelo y puntos de encuentro

| Bloque | María Paula | Santiago | Encuentro al final |
| --- | --- | --- | --- |
| 0 | P1 (contrato) | Boceto del mapa y del paso 4 | Contrato cerrado; nadie arranca sin él |
| 1 | P2, P3, P4, P5 | S1, S2, S4, S5 | Integrar en `main`. Probar juntos: Iris marca el destino, el niño llega, la experta reacciona y habla con cara B |
| 2 | P6, P7 | S3, S6, S7 | Integrar. Probar juntos: paso 4 completo caminando y entrar y salir del taller |
| 3 | P8, P9 | S8, S9, S10 | Integrar. Ruta dorada completa en inglés y español en los 4 tamaños, y PR hacia `develop` |

**Cómo se integra cada bloque:** cada uno trabaja en su worktree (`ss-rescue-a` para Santiago y `ss-rescue-b`
para María Paula), hace rebase sobre `main` y se fusiona con `git merge --no-ff`. Antes de fusionar:
`npm run typecheck && npx vitest run && npm run build -w ui`, `E2E_BASE_URL=http://localhost:5210 npx
playwright test` y `node tests/capturas/capturar.mjs ui/capturas/rescate/<bloque> http://localhost:5210`.

**La prueba que importa en cada encuentro:** jugar 5 minutos desde la portada sin leer ningún menú. Si en
algún momento no se sabe adónde ir o qué hacer, el bloque no está terminado aunque las pruebas pasen.

---

## 7. Delegable al equipo

Nada de esto bloquea los bloques 1 a 3. Cada tarea toca archivos que no son de Santiago ni de María Paula,
salvo donde se indica.

| Tarea | Rol | Referencia |
| --- | --- | --- |
| Motor que recibe la misión como parámetro (escalabilidad de niveles) | motor (Jaime) | NIVELES §7.2-3, #152 |
| Decisiones de campaña: orden, desbloqueo, dilemas sin consejo opuesto, balance de niveles 2 y 4 | diseño (Camilo) + Santiago | NIVELES §7.1, 7.4, 7.5 |
| Recurso en cero contra telemetría en el mismo tick | motor + diseño | RESCUE_STATUS problema 12, `engine/src/acciones.ts:330` |
| Líneas cortas de Iris y de las expertas para el globo (EN primero, ES después), 1 a 2 líneas por paso | agentes (José) | `agentes.iris.acompana.*` |
| Fuentes `null` de las tarjetas de los niveles 2 a 5 | datos (Daniel) | NIVELES §7.6 |
| Audio (fase 4): efectos ligados a eventos del motor y música por momento | quien tenga tiempo | AUDIO.md |
| `useMision()` en vez de importar `MISION_JEZERO` en 6 archivos de la UI. **Toca archivos de Santiago: solo después del encuentro 2 y coordinado con él** | ui | `App.tsx:19` y otros |
| Láminas de la Luna, el polo norte y la nave (para los niveles 2 a 5) | María Paula, después del bloque 3 | NIVELES §6 |
| Publicación: PR hacia `develop` y dominio `trakatra.lat` | Santiago (requiere la cuenta) | RESCUE_STATUS, Cloudflare |

---

## 8. Reglas que no se negocian

- **Un archivo, un escritor.** `frontera.ts` y `mundo.ts` son de María Paula; los JSON de i18n, de Santiago.
- **El motor manda:** caminar, entrar a una sala o terminar una animación nunca da ni quita recursos
  (MECANICAS §5). La animación va después del cambio del motor, no antes.
- **Sin GLB ni librerías nuevas** además de three (DISEÑO §8). Presupuesto por vista: ≤ 80 draw calls y
  ≤ 80 000 triángulos; cada sala es su propia vista.
- **Bilingüe:** cada texto nuevo, primero en inglés y después en español, y siempre por i18n.
- **Público de 7 a 12 años:** frases cortas, nada de miedo. La tormenta se vive como un desafío, no como un
  peligro mortal.
- **Nada se da por cerrado sin el juego real:** captura antes y después en 1440x900, 1024x683, 844x390 y
  390x844, más la prueba de 5 minutos de §6.

## 9. Decisiones tomadas en este plan y por qué

| Decisión | Por qué | Alternativa descartada |
| --- | --- | --- |
| Sala como escena propia con fundido | Respeta el presupuesto por vista y reutiliza el movimiento con otras colisiones | Edificios en corte dentro del exterior: duplica las mallas y supera los 80 draw calls |
| Retratos pre-renderizados a PNG desde los personajes B | Una sola identidad entre 2D y 3D (DISEÑO §4.4) sin cargar three en la portada | Dibujar SVG nuevos a mano: dos fuentes que se separan con el tiempo |
| Una sola vía para el `[E]` (`Interactivo`) | Un solo aviso y un solo manejador para lugares, actores y puertas: no hay dos caminos que cobren | Un callback por tipo: tres listeners de teclado que compiten |
| Taller primero | Es donde pasan el paso 4 y la reparación de Iris: la sala con más juego | Hábitat primero: solo se usa en el paso 6 |
| Paso 4 caminando, con la lista como alternativa | Es la interacción que pide el juego, y la lista mantiene la accesibilidad y la ruta dorada | Reemplazar la lista: rompe el respaldo 2D y las e2e |
| Sin selector de niveles todavía | NIVELES §8: no se muestra ninguna misión como jugable hasta que el motor reciba la misión como parámetro | Selector con niveles "próximamente": promete algo que no existe |
