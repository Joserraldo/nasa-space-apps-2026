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
**Rama:** feat/ui-personajes-solo-b · **PR:** tras #316 fusionado · **Tokens:** amarillo
- Hecho: #316 fusionado en `develop`; variante B consolidada como única implementación en `personaje.ts`, `cabeza.ts`, `cuerpo.ts`, `rostro.ts` e `iris.ts`, retirando la variante A y las hojas A/B temporales.
- Verificado: 25/25 pruebas unificadas de personajes, `tsc --noEmit` sin errores, liberación idempotente de esqueleto y `userData.compartido = true` en materiales.
- Sigue: módulo `ui/src/escena/personajes` listo para consumir en el montaje de la escena.
- Bloqueo: ninguno.

## Escenario (Daniel)
**Rama:** feat/ui-medicion-render-real · **PR:** #306 hacia develop · **Tokens:** 🟡
- Hecho: diagnóstico opcional conectado al render real, sin segundo RAF; reinicia al pausar/perder WebGL/cambiar calidad. Las piezas visuales de Claude (#295, #300–302) quedan intactas.
- Verificado: 770 pruebas, tipos, build y E2E; pérdida/restauración en Chrome sin errores y sin FPS obsoletos; revisión ligera independiente sin fallos nuevos.
- Sigue: revisión de #306 y fusión ordenada de la pila visual; medir en celular y PC viejo reales (la emulación no los sustituye).

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
| Niño 3D | `personajes/08–10` | María Paula | fusionado (#316); variante B única |
| Iris rover | `mundo/01`, `inicio/02`, `personajes/07` | María Paula | fusionado (#316); variante B única |
| Ingeniera 3D | `personajes/01`, `mundo/01` | María Paula | fusionado (#316); variante B única |
| Portada 3D | `inicio/01`, `inicio/capas/` | María Paula | sin empezar |
| HUD, diálogo, comparación, tormenta y final (montaje) | `ui/01`, `ui/04`, `personajes/07`, `mundo/01` | José | E3–E5, E7 y E8 fusionadas; E6 en PR #269; piezas de ui/04 en PR #303; HUD en PR #304 |
