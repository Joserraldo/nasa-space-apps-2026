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
**Rama:** — · **PR:** ninguno · **Tokens:** —
- Sin registrar todavía.

## Ubicación (Camilo)
**Rama:** — · **PR:** ninguno · **Tokens:** —
- Sin registrar todavía.

## Integración (José)
**Rama:** — · **PR:** ninguno · **Tokens:** —
- Hecho: contratos `VistaEscena` (#181), eventos de feedback (#182) y ajustes del jugador (#186) fusionados; CI corre en `feat/ui-escenarios`.

## Interfaz (Jaime)
**Rama:** feat/ui-interfaz-tokens · **PR:** #208, #209, #213, #214, #217 · **Tokens:** verde
- Hecho: `tokens.ts` (fuente única de DISEÑO §2, forma, sombra, tipo y movimiento), `tokens.css` generado con test y Nunito en `ui/public/fuentes/`.
- Hecho también: `estilos.css` borrado y reemplazado por `estilos/base.css` solo con tokens (PR #209, depende de #208).
- Hecho también: `FacetButton` con todos los estados de `ui/02` y `ui/03`, iconos facetados propios y muestrario en `componentes/base/muestrario.html`.
- Hecho también: `ResourcePlaque`, `CostRow`, `EfectoPendiente`, `Mensaje` y `ConfirmarAccion` (costos y permiso del motor).
- Hecho también: portada DOM (logo oficial sin fondo, menú, idioma y sonido), intro de 4 viñetas y carga con indicador indeterminado.
- Sigue: tarjeta de fuente, datos usados y glosario; después los retratos de diálogo.
- Bloqueo: ninguno.

## Fidelidad
Una línea por pieza (FLUJO §4 y §8). Estados: `sin empezar`, `en PR #n`, `aprobada`. Solo María Paula marca `aprobada`, después de comparar la captura con la lámina.

| Pieza | Lámina | Dueño | Estado |
| --- | --- | --- | --- |
| Tokens, Nunito, botones y placas | `ui/02`, `ui/03` | Jaime | en PR #208 (tokens y Nunito); botones y placas sin empezar |
| Retratos de diálogo | `personajes/02, 04, 06, 09`, `ui/01` | Jaime | sin empezar |
| Portada DOM, intro y carga | `inicio/01–03`, `ui/00` | Jaime | en PR #217 |
| Tarjeta de fuente, datos usados, glosario | `ui/04` | Jaime | sin empezar |
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
