# Estado — ui (frontend v8)
**Actualizado:** 15 nov 2026 · **Rama base:** `feat/ui-escenarios` · **Orquesta:** María Paula

Una sección por persona, máximo 5 líneas, y nadie edita la de otro (FLUJO §8). Cada uno la actualiza dentro de su PR hacia `feat/ui-escenarios`, con el formato de abajo. El estado de tu rol (motor, datos, diseño, agentes) va en el `ESTADO.md` de tu carpeta, en `develop`.

```text
**Rama:** feat/ui-<parte>-<tema> · **PR:** #n o ninguno · **Tokens:** verde | amarillo | rojo
- Hecho: ...
- Sigue: ...
- Bloqueo: ninguno | issue #n espera a <persona>
```

## Personajes (María Paula)
**Rama:** fix/ui-integracion-develop-3d · **PR:** hacia develop · **Tokens:** amarillo
- Hecho: monta niño, Ingeniera e Iris vigentes en la escena compartida; materiales por referencia y liberación de esqueletos. Plan de dos personas: Haiku lee, Opus implementa, Fable audita. No incluye la versión descartada de 5199.
- Verificado: tipos, build y ruta dorada; prueba combinada con #247 en cuatro tamaños, capturas E6/E7 sin errores. Cinco módulos: cota de 80 llamadas/69951 triángulos; rendimiento físico pendiente.
- Sigue: Santiago revisa/fusiona #247 y este PR; aplicar frentes A/B del plan. Movimiento, táctiles y fidelidad final no están implementados por este montaje.
- Bloqueo: ninguno externo; todo el trabajo restante queda repartido entre Santiago y María Paula en `PLAN-INTEGRACION-SANTIAGO-PAULA.md`.

## Escenario (Daniel)
**Rama:** feat/ui-escena-v* · **PR:** #311–#315 abiertos hacia develop (la pila #282–#310 ya entró) · **Tokens:** 🟡
- Hecho: pila del escenario en develop (composición, suelo, caminos, cámara, medición, contorno y guantes, planta, anillo, vista, rocas, balizas, torre, kit: panel, consola, antena) y medición sobre el render real (#306).
- Abiertos: torre con anillo de vidrio (#311), corredores de vidrio (#312), caja y depósito (#313), primera persona (#314), puerta (#315, después de #313).
- Medido en PC real (Intel integrada, Chrome): 1920×1080 alta ~258 fps, baja ~777 fps; tirones sueltos de 0,2–0,5 s. Celular solo emulado.
- Sigue: medir en celular y PC viejo reales. Torre al centro y refugio dentro del anillo dependen de `mundo.ts` (issue #254, Camilo). Fila de 4 paneles: el primero sale cortado (decisión de Daniel).

## Ubicación (Camilo)
**Rama:** feat/ui-ubicacion-tactiles · **PR:** #298 hacia develop · **Tokens:** amarillo
- Hecho: entrada+componente recuperados,18pruebas específicas; navegador3tamaños con HUD libre,pausa/limpieza,Nunito/tokens y E2E1/1 previo.
- Sigue: revisión de Paula y montaje con José/Daniel; #216/#267/#297 fusionados. Original y QA preservados.
- Bloqueo: montaje de movimiento/cámara/mapa y celular físico; #254 espera la pila de Daniel. No se afirma juego3D móvil integrado.

## Integración (José)
**Rama:** feat/ui-* hacia develop · **PR:** #269, #303, #304, #305 y el montaje de piezas en E7 · **Tokens:** verde
- Hecho: en develop E3 (#276), E4 (#274), E5 sobre la escena (#280), E7 completa (#278, #283, #296 y #299: Tormenta.tsx borrado, e2e nuevo y respaldo 2D arreglado) y E8; encuadre de escena (#275). Con permiso de Santiago, piezas de Jaime: #303 (paneles de ui/04) y #304 (HUD en píldoras de mundo/01); #268 revisado.
- Sigue: montar #303 y #304 en la tormenta cuando entren (PR listo encima); #305 (Decision recorded en E6); al final, ruta dorada en el preview en EN, ES y sin WebGL.
- Bloqueo: #269 (E6 con escena y HUD de mundo/01) espera la pila de Daniel (#247 en conflicto); resaltado del anclaje en E5 espera a Daniel (#279); Map no mueve al niño (Camilo).

## Interfaz (Jaime)
**Rama:** docs/fichas-fidelidad-220 y fix/ui-* · **PR:** #317 (fichas de #220), #318, #319 y #320 hacia develop · **Tokens:** verde
- Hecho: repaso de fidelidad de lo fusionado en #220 (cierre-fidelidad, tarea 4): captura al lado de la lámina de cada pieza en `pr-fichas-220/`, con su ficha en el PR.
- Hecho: arreglos de las 3 piezas que más se alejaban: intro (#318), carga (#319) y portada en 844x390 (#320).
- Sigue: tarjeta de fuente de una línea como `ui/03` (cuarta en la lista); ConfirmarAccion con la imagen de la pieza.
- Bloqueo: esperan a María Paula (#220) color de costos, interruptor Voice, tokens PERSONAJES y estilo de los retratos.

## Fidelidad
Una línea por pieza (FLUJO §4 y §8). Estados: `sin empezar`, `en PR #n`, `aprobada`. Solo María Paula marca `aprobada`, después de comparar la captura con la lámina.

| Pieza | Lámina | Dueño | Estado |
| --- | --- | --- | --- |
| Tokens, Nunito, botones y placas | `ui/02`, `ui/03` | Jaime | fusionada en #220, revisión de fidelidad pendiente |
| Retratos de diálogo | `personajes/02, 04, 06, 09`, `ui/01` | Jaime | fusionada en #220, revisión de fidelidad pendiente |
| Portada DOM, intro y carga | `inicio/01–03`, `ui/00` | Jaime | fusionada en #220, revisión de fidelidad pendiente |
| Tarjeta de fuente, datos usados, glosario | `ui/04` | Jaime | fusionada en #220, revisión de fidelidad pendiente |
| Cielo, luz y niebla de Marte | MARTE.md §4–§5 (no el azul de `mundo/01`) | Daniel | sin empezar |
| Terreno de Jezero y rocas | `mundo/01`, `exterior/02` | Daniel | sin empezar |
| Kit de piezas | `piezas/01–10` | Daniel | sin empezar |
| Los 5 módulos | `mundo/01`, `piezas/` | Daniel | sin empezar |
| Base compacta y plano exterior | `exterior/03`, `exterior/01`, `mundo/01` | Daniel | sin empezar |
| Lugares, anclajes y caminos | `exterior/03`, `mapa-base-jezero.svg` | Camilo | sin empezar |
| Cámaras de 3.ª y 1.ª persona | `mundo/01`, `mundo/02` | Camilo | sin empezar |
| Panel `Map` y respaldo 2D | ESCENAS §3.4, FLUJO §9 | Camilo | sin empezar |
| Controles táctiles (joystick, cámara, acción) | Familia de `ui/03`, ESCENAS §3.5 | Camilo | sin empezar |
| Niño 3D | `personajes/08–10` | María Paula | fusionado (#316); variante B única |
| Iris rover | `mundo/01`, `inicio/02`, `personajes/07` | María Paula | fusionado (#316); variante B única |
| Ingeniera 3D | `personajes/01`, `mundo/01` | María Paula | fusionado (#316); variante B única |
| Portada 3D | `inicio/01`, `inicio/capas/` | María Paula | sin empezar |
| HUD, diálogo, comparación, tormenta y final (montaje) | `ui/01`, `ui/04`, `personajes/07`, `mundo/01` | José | E3–E5, E7 y E8 fusionadas; E6 en PR #269; piezas de ui/04 en PR #303; HUD en PR #304 |
