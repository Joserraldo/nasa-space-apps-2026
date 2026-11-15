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
**Rama:** feat/ui-personajes-subida-escena · **PR:** #197 · **Tokens:** verde
- Hecho: subida 1/6 (#184, reductor y cuenta) fusionada; 2/6 (#197, lógica de escena) abierta con la puerta en verde.
- Sigue: subida 3/6, render adaptado al contrato `VistaEscena` de José (`tormenta.anunciada`, `iris.averiada`); después 4 a 6.
- Bloqueo: ninguno.

## Escenario (Daniel)
**Rama:** feat/ui-escena-r6-camara · **PR:** #253 (sobre #252) · **Tokens:** 🟡
- Hecho: cámara adaptable, losas y plataforma, rocas y módulos sin solapes; montaje en #247; arranque sin WebGL notifica a la pantalla sin excepción React.
- Verificado: 694 pruebas, tipos, build y E2E; 2 regresiones en navegador (StrictMode/desmontaje y fallo de creación WebGL).
- Sigue: revisar #253 y consolidar cuando entre #237 aprobado; no añadir capas. Celular y PC viejo pendientes (medición Intel local no los sustituye).

## Ubicación (Camilo)
**Rama:** feat/ui-ubicacion-tactiles · **PR:** #298 hacia develop · **Tokens:** amarillo
- Hecho: entrada+componente recuperados,18pruebas específicas; navegador3tamaños con HUD libre,pausa/limpieza,Nunito/tokens y E2E1/1 previo.
- Sigue: revisión de Paula y montaje con José/Daniel; #216/#267/#297 fusionados. Original y QA preservados.
- Bloqueo: montaje de movimiento/cámara/mapa y celular físico; #254 espera la pila de Daniel. No se afirma juego3D móvil integrado.

## Integración (José)
**Rama:** feat/ui-integracion-orientacion · **PR:** hacia feat/ui-escenarios · **Tokens:** verde
- Hecho: contratos `VistaEscena` (#181), eventos (#182), ajustes (#186) y props de `EscenaBase` (#190, cerrado). Lógica del aviso de girar el teléfono (`juego/orientacion.ts`).
- Sigue: pantallas nuevas desde las láminas cuando entren #208, #209 y #213 de Jaime; preview de esta rama en #207 (hacia develop).
- Bloqueo: tokens y componentes de Jaime.

## Interfaz (Jaime)
**Rama:** — · **PR:** #220 (fusionado, trae toda la pila: #208, #209, #213, #214, #217, #219) · **Tokens:** verde
- Hecho: tokens v8 y Nunito; `estilos.css` borrado y reemplazado por `estilos/base.css`; `FacetButton` e iconos; placas, costos, mensajes, efecto pendiente y `ConfirmarAccion`; portada, intro y carga; tarjeta de fuente, datos usados y glosario; retratos con 8 expresiones. Muestrario en `componentes/base/muestrario.html`.
- Sigue: arreglos de fidelidad que pida María Paula (las fichas están en cada PR cerrado); audio y voz si sobra tiempo.
- Bloqueo: ninguno. Falta la revisión de fidelidad de María Paula (las piezas entraron juntas con #220).

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
| Niño 3D | `personajes/08–10` | María Paula | sin empezar |
| Iris rover | `mundo/01`, `inicio/02`, `personajes/07` | María Paula | sin empezar |
| Ingeniera 3D | `personajes/01`, `mundo/01` | María Paula | sin empezar |
| Portada 3D | `inicio/01`, `inicio/capas/` | María Paula | sin empezar |
| HUD, diálogo, comparación, tormenta y final (montaje) | `ui/01`, `ui/04`, `personajes/07`, `mundo/01` | José | sin empezar |
