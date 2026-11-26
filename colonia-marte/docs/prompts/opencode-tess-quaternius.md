# Encargo para OpenCode: prueba de Tess desde una base con licencia (Quaternius)

## Por qué

El personaje hecho por código lleva cinco rondas rechazadas ("no se parece en nada"). María Paula aprobó **cambiar de estrategia**: partir de un personaje low-poly con licencia que ya tiene el lenguaje visual de la referencia y adaptarlo. Esto es una **prueba de una sola pieza**: solo Tess.

## Reglas

- Carpeta `C:\Users\mpaul\Documents\colonia-marte-visual`, rama `ws2-env-crew`. **Sin comandos de git que escriban.** No toques `docs/referencias/`, la UI ni otros worktrees.
- Leé `C:/Users/mpaul/.agents/skills/blender-reference-modeling/SKILL.md` y `docs/restricciones-visuales.md` completo (las últimas 4 líneas son los rechazos del personaje).
- Sin aprobaciones intermedias. No hagas Nia, Vera, Teo ni la base masculina.
- No se recrean personajes de los videos: se toma la **estética** de Tess de la referencia, no una copia exacta.

## Base

- `_work/ref-quaternius/umw/Sci Fi Character/SciFi.fbx` (Ultimate Modular Women, Quaternius, **CC-BY**: 8.038 triángulos, 79 huesos, colores planos sin texturas, 4 partes intercambiables, animaciones incluidas).
- Peinado: si el pelo del pack no da el rodete alto, podés tomar `Hair_Buns` de `_work/ref-quaternius/ubc/` (CC0) y **facetarlo y pasarlo a color plano**, o modelar el rodete por masas.
- Guías secundarias: los demás modelos de `umw/` y `umm/` (mismo estilo).

## Referencia que manda

`docs/referencias/v1/v1-t018.50.jpg` (Tess de pie con tablet), `v1-t045.20.jpg` y `v1-t039.90.jpg`. Medí proporciones sobre ellas.

## Cambios

1. **Proporciones de juguete** (es lo que más falla en la base, que mide ~7,5 cabezas): cabeza bastante más grande (objetivo ~4,6 a 5 cabezas de alto total, medido en la referencia), piernas más cortas, brazos algo más gruesos, manos simples en bloque (no dedos realistas), **botas anchas con puño** como en la referencia. Hacelo ajustando huesos/escala por regiones y editando la malla, sin romper los pesos.
2. **Cara:** conservá los planos amplios de la base; ojos de párpado entornado como en la referencia (ya se parecen), sin agregar facetas chicas (rechazo explícito: "no sé por qué le estás añadiendo tantos cuadrados").
3. **Pelo castaño con rodete alto** y mechón que cae al costado de la cara.
4. **Uniforme:** mono oscuro (gris carbón/morado muy oscuro de la paleta), acentos **ámbar** en hombros, puños, franja diagonal y puño de las botas, cuello alto, insignia chevron. Colores tomados de `palette.json`, aplicables al atlas del juego.
5. **Rig:** conservá el esqueleto de 79 huesos y las animaciones de la base por ahora (no lo reduzcas a 22); reportá en el informe qué animaciones trae y si sobreviven al cambio de proporciones.

## Entregables

- `public/models/characters/tess.glb` (reemplaza al anterior; el viejo queda en git).
- `docs/capturas/q1-tess-reference-sheet.png`: frente, perfil, tres cuartos y primer plano de cara, **al lado de `v1-t018.50.jpg`** a escala de cabeza comparable, con tabla de proporciones referencia vs modelo.
- `docs/capturas/q1-tess-crew.jpg` desde `/crew?character=tess` en el navegador (puerto 5190 ya corriendo).
- `docs/capturas/q1-tess-animaciones.png`: 3 o 4 fotogramas de una animación (idle o caminar) para ver que las proporciones nuevas deforman bien.
- `CREDITS.md` en la raíz con: "Ultimate Modular Women Pack by Quaternius [CC-BY] via Poly Pizza (https://poly.pizza/bundle/Ultimate-Modular-Women-Pack-aCBDXDdTNN)" y, si usaste pelo de Universal Base Characters, "Universal Base Characters by Quaternius (CC0)".
- build, tsc, vitest y validate:pieces en salida 0 (ajustá `validate.py` y los tests de personaje al nuevo rig si hace falta, sin debilitar los chequeos de geometría).
- Informe `docs/capturas/q1-tess-informe.md` con **NO VERIFICADO**.
