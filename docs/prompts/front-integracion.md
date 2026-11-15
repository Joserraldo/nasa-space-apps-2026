# Brief del frontend: integración y pantallas (José)

**Qué construís:** que el juego funcione de punta a punta: fases, conexión con motor, agentes y datos, y el montaje en pantalla de lo que entregan los demás.
**Tus archivos:** `ui/src/App.tsx`, `main.tsx`, `i18n.ts`, `ui/src/juego/**`, `ui/src/pantallas/**`, `ui/src/escena/vista.ts`, `ui/i18n/**`, `ui/package.json`, y los componentes de comportamiento `Tripulacion.tsx`, `Dialogos.tsx`, `Hud.tsx`, `Acciones.tsx`, `Cuenta.tsx`, `Polvo.tsx`, `PreguntaDeIris.tsx`, `QueSi.tsx`.
**Leé:** [MECANICAS.md](../referenciapau/MECANICAS.md), [ESCENAS.md](../referenciapau/ESCENAS.md) §1–§2, [HISTORIA.md](../referenciapau/HISTORIA.md) §3–§5, [RETO.md](../referenciapau/RETO.md) §3 y §5, [APLICACION.md](../referenciapau/APLICACION.md) §5–§6.
**Rama:** desde `feat/ui-escenarios`, PR hacia `feat/ui-escenarios` ([FLUJO.md](../referenciapau/FLUJO.md) §2). **Todo se escribe nuevo, desde ya:** nadie trabaja sobre el preview desplegado ni re-estiliza archivos viejos ([FLUJO.md](../referenciapau/FLUJO.md) §2.3). La subida de María Paula fue solo lógica (#184, #197).
**Fuente visual única:** las láminas de `docs/referenciapau/referencias/` y [DISEÑO.md](../referenciapau/DISEÑO.md). El diseño anterior (prototipo, `estilos.css`, `mision.css`, tema oscuro, formas de hoy) **se borra** (FLUJO §2.2): no se toma nada de él.
**Cada PR:** solo tus archivos; menos de ~300 líneas; **ficha de fidelidad** ([FLUJO.md](../referenciapau/FLUJO.md) §7.1) con la captura al lado de la lámina canónica (skill `solar-shield-pr-visual`); salida de `npm run typecheck`, `npm test`, `npm run build` y `npm run e2e` (hasta que la CI cubra la rama); puerta de [APLICACION.md](../referenciapau/APLICACION.md) §10. Lo aprueba y fusiona María Paula.

## Tareas (en orden)

0. **Pantallas nuevas, nunca re-estilizadas** (FLUJO §2.3): cada pantalla se escribe en un archivo nuevo con los componentes de Jaime y la vieja se borra en el mismo PR, con sus emojis y las clases del tema oscuro. Cada una en los tres tamaños de ESCENAS §2.7, con el aviso de girar el teléfono en la base. HECHO: ninguna pantalla vieja queda montada y el e2e sigue verde.
1. **CI para la rama de escenarios:** agregar `feat/ui-escenarios` a `pull_request` en `.github/workflows/ci.yml` (es tu carpeta `.github/`). Este PR va hacia `develop`. HECHO: los PRs hacia `feat/ui-escenarios` corren "Tipos y tests" y e2e.
2. **Contratos** (FLUJO §3): `VistaEscena` en `vista.ts`, eventos de feedback desde `novedades()` con id estable, ajustes del jugador; props de `EscenaBase` con Daniel. HECHO: contratos fusionados y typecheck en verde.
3. **Ruta dorada completa en la rama de escenarios:** pasos 1 a 8 con el motor; paso 7 con el retraso visible y "3 a 22 minutos" con fuente; paso 8 con resultado, causas, tarjetas, pregunta final y "qué datos usamos" (#162 de Daniel); cuenta o invitado (#109). Mejoras P0 de RETO §3: comida visible en toda partida. Primera decisión con costo antes de los 60 s. El reductor comprueba que el motor aceptó antes de marcar un módulo como colocado. HECHO: e2e verde con las dos partidas de `ganable.test.ts`.
4. **Iris compañera** (#149): `guiaIrisLugar` y `briefingIris` en pantalla, y el destino se lo pasás a María Paula para `guia.ts`. Importá `GestoIris` de agents con alias. HECHO: Iris sugiere el destino correcto en cada paso.
5. **Montaje:** componentes de Jaime en todas las pantallas, escena de Daniel en `Base3D`, mapa de Camilo, tema oscuro borrado, un solo `ConfirmarAccion` para construir, dilema y telemetría. HECHO: puerta §10 completa y aprobada por María Paula.
6. Respaldo 2D equivalente en todas las fases. HECHO: la ruta se juega sin WebGL.

**Además, tu rol de agentes, infra y pitch:** e2e y despliegue, #151 en `develop`, video y formulario (prompt [agentes-infra.md](agentes-infra.md)).
**Meta:** la ruta dorada completa en `feat/ui-escenarios` con todas las piezas montadas, lista para el punto de control antes de P4.

## Cierre del escenario (15 nov, pedido de Santiago)

El escenario 3D entra por #237 y su pila. Para que se vea en el juego como en `mundo/01`:

1. **Rebasá #245 y #246 (HUD y Base) sobre `feat/ui-escenarios`** cuando entren #233 y #243. Las dos ramas chocan en `ui/src/App.tsx`.
2. **Atendé los cambios pedidos en #240 (Sitio) y #241 (Final).**
3. **Montá la escena en E6.** #247, de Daniel, monta `EscenaBase` detrás del HUD. Sacalo de borrador después del rebase. HECHO: captura del juego en la fase base al lado de `mundo/01` y de `mundo/02`, en 1024×683 y 844×390, con:
   - las tres placas arriba a la derecha y el objetivo ("Inspect the solar controller") debajo;
   - `Crew` y `Map` abajo a la izquierda;
   - la acción cercana con su tecla (`E Inspect controller`) abajo al centro;
   - el cambio de cámara (`V`) abajo a la derecha.
4. **La ruta dorada sigue verde** en el e2e con la escena montada, y el respaldo 2D (tarea 6) se juega sin WebGL.
