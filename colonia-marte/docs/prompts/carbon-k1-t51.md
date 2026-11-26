# Encargo para Carbon (Antigravity): integrar WS2, corregir K1 y sala piloto del comedor (T5.1)

## 0. Dónde trabajás

- Carpeta: `C:\Users\mpaul\Documents\colonia-marte-visual-carbon`, rama `ws4-interior-kit`.
- **No abras ni modifiques `C:\Users\mpaul\Documents\colonia-marte-visual`**: ahí trabaja OpenCode.
- Servidor en el puerto **5191**. Sin push, sin merge a `main`. Commits convencionales sin atribución a IA.
- La UI (`src/ui/`, `/ui`) **queda congelada** en este encargo: se adapta después en otra ronda. No la rediseñes.
- No borres ni modifiques `docs/referencias/`.
- Modelo: esfuerzo alto para T5.1, medio para el resto.

## 1. Paso 1: integrar `ws2-env-crew`

- `git merge ws2-env-crew` (commit `9befdff`). La simulación del revisor no muestra conflictos de texto.
- Trae: validador con modos de `placement` (`cell`, `wall-line`, `point`), catálogo con filtro por familia y paginación de 12 (con tests), esquema de layout (`src/catalog/layout.ts`, `data/layouts/fixtures/`), ambientes y personaje.
- **Posible choque de lógica:** tu commit `1c502c9` también pagina el catálogo. Debe quedar **una sola** implementación de paginación: conservá la de `ws2-env-crew` (tiene tests en `tests/unit/`) y adaptá tu shell/HUD para usarla. Borrá la duplicada.
- Verificá: `npm run build`, `npx tsc --noEmit`, `npx vitest run`, `npm run validate:pieces` en salida 0. Commit: `merge: integrate ws2-env-crew into ws4-interior-kit`.

## 2. Paso 2: K1 (alta, bloquea T5.1)

Leé `docs/capturas/carbon-t41-revision.md`, fila K1.

- Quitá los **brazos/costillas** de 2 m de las paredes `ST-W*`, del portal `ST-D01` y el **capitel de cuatro brazos** de la columna `ST-C01`.
- Declarales el `placement` correcto en `metadata`: paredes y portal `wall-line` (espesor real 0,2 a 0,3 m sobre la línea de la rejilla), columna `point` (0,6 a 0,8 m).
- Dos paredes vecinas ensambladas no deben solaparse ni invadir celdas.
- `validate:pieces` en verde **sin** geometría de relleno. Captura `docs/capturas/k1-paredes-ensambladas.jpg` con 3 paredes, un portal y una columna en L.
- Commit: `fix(kit): remove filler geometry from walls and column (K1)`.

## 3. Paso 3: T5.1, sala piloto del comedor

Leé `docs/PLAN.md` (sección de la prueba aprobada del comedor y la observación de María Paula sobre las luces), `docs/restricciones-visuales.md`, `spikes/comedor/`.

- Layout JSON en `data/layouts/rooms/canteen.json`, validado con el esquema de `src/catalog/layout.ts`; un ID inválido debe fallar (agregá el test).
- Solo piezas del registro (`ST-*`, `CT-*` o los IDs del comedor en `INVENTARIO.md`), AO por vértice y ambiente `AMB-02`.
- Resolvé los pendientes de la prueba: dispensadores con más detalle (carcasa gruesa, arco cian, pantalla grande con ilustración), blancos más cálidos, **sombras de contacto** bajo mesas y sillas, incrustaciones curvas en el piso, lámpara anular **no sobreexpuesta**, tiras LED con halo visible.
- Ruta de revisión `/room/canteen` (o equivalente) con la cámara del juego.
- Capturas: `docs/capturas/t51-comedor-1.jpg` y `-2.jpg`, con los mismos encuadres que `docs/referencias/v2/v2-t017.10.jpg` y `docs/referencias/v1/v1-t021.50.jpg`.
- FPS con la ventana visible, anotado en el informe.
- Commit: `feat(rooms): canteen pilot room from JSON layout (T5.1)`.

## 4. Informe

`docs/capturas/carbon-k1-t51-informe.md`: qué cambiaste, comandos y salida, capturas, y una sección **NO VERIFICADO**. Parás ahí: el revisor y María Paula deciden el gate T5.1.
