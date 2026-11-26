# Encargo para OpenCode (gpt-6.2-sol, high): piloto de Tess (T6.2) y colisión de cámara (T7.4)

## 0. Reglas

- Carpeta `C:\Users\mpaul\Documents\colonia-marte-visual`, rama `ws2-env-crew`. Servidor ya corriendo en 5190 (no lo reinicies).
- **Sin comandos de git que escriban.** No toques `C:\Users\mpaul\Documents\colonia-marte-visual-carbon` ni `docs/referencias/`.
- No toques la UI (`src/style.css`, `src/core/shell.ts`, `src/catalog/catalog.ts`): se rediseña en otra ronda.
- Código y comentarios en inglés, sin emojis. **No pidas aprobaciones intermedias**: las decisiones dentro de este encargo ya están aprobadas; si algo es ambiguo, elegí lo más conservador y anotalo en el informe.

## 1. Leé primero

`docs/PLAN.md` (filas T6.2 y T7.4, estado de gates), `docs/DISENO-JUEGO.md` (tabla de personajes), `docs/DECISIONES.md`, `docs/restricciones-visuales.md`, `docs/capturas/correcciones-3-informe.md`, `tools/blender/*`, `src/camera/*`.

## 2. T6.2 piloto: **solo Tess** (regla de una pieza antes del lote)

- Tess, la Ingeniera (energía y reparaciones; ahorradora). Construí sobre la base A aprobada (C3) un sistema de **variantes paramétricas**: peinado, tono de piel, color de acento del traje y accesorios, declarado en datos (JSON o dict en Python), no una malla copiada a mano.
- Para Tess: peinado propio distinto de la base, acento del traje en **amarillo/naranja de la paleta** (rol ingeniería), y un accesorio de oficio (cinturón de herramientas o llave en el muslo). Silueta reconocible a 10 m.
- Mismo esqueleto y conteo de huesos que la base; pasa `tools/blender/validate.py`.
- Exportá `public/models/characters/tess.glb` y la hoja `docs/capturas/t62-tess-reference-sheet.png` (frente, perfil, tres cuartos, junto a `docs/referencias/v1/v1-t039.90.jpg`).
- **No hagas Nia, Vera ni Teo** todavía: esperan el visto bueno de Tess.

## 3. T7.4: colisión de cámara

- Con `three-mesh-bvh` (ya instalado), validá que una toma no atraviese geometría: muestreá la trayectoria y reportá el primer tramo que cruza una malla.
- Regla de "entrar a una sala mirando hacia adentro": al cruzar un portal, la dirección de la cámara debe apuntar al interior (producto punto con la normal del portal).
- Tests en `tests/unit/`: una toma que atraviesa una pared **falla**; una que entra mirando hacia afuera **falla**; una correcta pasa.

## 4. Criterios

- `npm run build`, `npx tsc --noEmit`, `npx vitest run`, `npm run validate:pieces` en salida 0.
- Informe `docs/capturas/t62-t74-informe.md` con archivos, comandos y salida, capturas y sección **NO VERIFICADO**.
