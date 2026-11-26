# MV-09, segunda ronda: Orion + Deep Space Transport con la calidad del resto del juego

## 1. Por qué se rechazó (María Paula, 2026-11-26)

Palabras textuales: «no tiene la misma calidad», «no se ve estético», «los colores de los propulsores tampoco se ven reales», «le hace falta detalle y trabajo». Está registrado en `docs/restricciones-visuales.md`.

Lo que el revisor ve en `exterior-t3-mv-09-detalle.jpg` (commit `25be9aa`):

- Cilindros y conos **lisos, sin bisel**: se leen como primitivas de prueba.
- **Sin paneles, sin juntas, sin piezas pequeñas:** el hábitat es un tubo blanco con tres rectángulos.
- **Sin AO:** no hay oscurecimiento en las uniones, todo flota.
- Propulsores como **discos magenta macizos**. No se parecen a los reales (sección 3).
- Las alas solares son placas planas con retícula, sin marco, sin estructura ni mecanismo.
- El módulo de servicio de Orion se ve redondeado. En la nave real es un cilindro con tobera.

## 2. La vara de calidad: las piezas de Carbon

La nave tiene que verse del mismo juego que las salas y la colonia aprobadas. Antes de escribir código, abrir y estudiar:

- `docs/capturas/t52-nw-15.jpg`, `t52-nw-16.jpg` (interiores de la misma nave),
- `docs/capturas/s4-exterior-ojos.jpg` (colonia exterior aprobada),
- el código de `src/kit/pieces/station/` y `src/kit/pieces/mars/habitats.ts`, para ver **cómo** Carbon logra ese acabado.

Ese acabado sale de:

1. **Bisel en todo** con `chamferBox` y `extrudeProfile` (perfiles 2D con bisel). Ningún borde vivo de 90 grados en las piezas principales.
2. **Paneles con inserto** (`panelInset`): placas con una junta oscura entre ellas, en vez de superficies lisas.
3. **Dos tonos más un acento:** blanco y gris claro dominan, gris oscuro en juntas y estructura, y un acento pequeño de color.
4. **AO por vértice** (`tools/bake-vertex-ao.ts` / `src/core` según cómo lo usan las salas), horneado al construir la pieza, para que las uniones se oscurezcan.
5. **Densidad de detalle pequeño** repartida: barandas, tornillería, rejillas, luces.

## 3. Cómo se ven los propulsores reales (verificado)

Fuentes: NASA, foto del propulsor AEPS de 12 kW para Gateway: "glows blue as it emits ionized xenon gas". NASA/JPL, propulsor Hall de Psyche: "the xenon plasma emits a blue glow". JPL "Ring of Firepower". Un estudio de 2025 en *Plasma Sources Science and Technology* describe la pluma como **casi transparente, con un tono azul**.

En concreto:

- Un propulsor Hall es **anular**: lo que brilla es **un anillo** (el canal) alrededor de un centro oscuro, no un disco lleno.
- El color es **azul eléctrico**, con el anillo más claro, casi blanco azulado, en el borde del canal. **Nada de magenta ni violeta saturado.** Hay que corregir el color de diseño `xenonGlow` en `palette.json` a un azul (por ejemplo `#3D8BFF` para la pluma y `#CFE6FF` para el anillo) y actualizar su `baseReason` con la fuente.
- La **pluma** es un cono tenue, transparente y aditivo, que se desvanece en 2 o 3 diámetros. No es un sólido.
- Cada propulsor tiene un cuerpo cilíndrico gris oscuro biselado, con el anillo del canal y un cátodo pequeño al costado.
- Orion lleva un motor principal químico con **tobera de campana** gris oscura (apagado en esta toma) y cuatro grupos de propulsores de control de actitud chicos en el módulo de servicio.

## 4. Lista de detalle obligatoria

**Orion (proa):**

- Módulo de tripulación cónico biselado en blanco, con paneles en retícula, dos ventanas pequeñas y el escudo térmico gris oscuro detrás.
- Adaptador de acople con anillo y luces de acople pequeñas.
- **Módulo de Servicio Europeo cilíndrico** (4,5 × 2,7 m), con paneles, grupos de propulsores de actitud y la **tobera de campana** atrás.
- **4 alas en X:** cada una con 3 paneles y marco claro, celdas azul oscuro con retícula fina, un brazo de unión y el mecanismo de giro en la raíz.

**Hábitat DST (centro):**

- Cilindro con **paneles acolchados** (la manta térmica de los módulos reales, hecha con inserts en retícula) y juntas circunferenciales cada metro y medio.
- **Tanques** alrededor de la zona de tripulación, con abrazaderas.
- Barandas de manos a lo largo del casco.
- 2 radiadores planos con nervaduras.
- **Antena parabólica** con brazo y alimentador.
- Ventanas pequeñas con marco.
- **Luces de navegación:** roja a un lado y verde al otro, que parpadean lento (a los niños les encanta, y es real).

**Propulsión eléctrica (popa):**

- Estructura reticulada (truss) visible entre el hábitat y la popa.
- Tanques esféricos de xenón.
- **2 alas solares grandes** con marco, largueros, retícula y el mástil central donde se enrollan (tipo ROSA).
- 4 propulsores Hall según la sección 3.

## 5. Presupuesto y reglas

- **Hasta 25.000 triángulos en LOD0** (la escena del espacio no tiene otra cosa y hoy corre a 240 fps), 10.000 en LOD1 y 3.500 en LOD2. Usar `InstancedMesh` para lo repetido: barandas, tornillos, celdas, propulsores.
- Solo materiales de la paleta. El único color nuevo permitido es `xenonGlow` corregido. La pluma puede usar un material aditivo con `depthWrite: false`, si se registra en `src/materials/` junto a los existentes, sin crear una paleta paralela.
- Se mantiene lo que sí estaba bien: la luz lateral del Sol con el borde frío, la Tierra con nubes y halo, la Vía Láctea, y la toma de 6 s alejándose de la Tierra. El lado iluminado del casco queda en 190 o más de luminancia.
- **No editar `docs/restricciones-visuales.md`.**
- Los cuatro chequeos (build, tsc, vitest y validate:pieces), Chromium visible sin errores, y los fps de `/space` y del piloto exterior: si la medición da unos 30 fps incluso en una página en blanco, anotarlo como no verificable.
- Actualizar `tests/unit/mars-transit.test.ts`: que haya 4 alas de Orion, 2 alas de propulsión, ningún anillo giratorio, 4 propulsores con un anillo emisivo cada uno, y que `xenonGlow` sea azul (tono entre 200 y 230 grados).

## 6. Entrega

- Tres capturas:
  - `exterior-t3-mv-09.jpg`: la versión rechazada y la nueva, lado a lado, en la toma de la intro;
  - `exterior-t3-mv-09-detalle.jpg`: de cerca, a tres cuartos, donde se lean Orion, el hábitat y la popa;
  - `exterior-t3-mv-09-propulsores.jpg`: los propulsores encendidos de cerca.
- En el informe, por cada punto de la sección 4: hecho o no hecho, con el archivo donde está.
- Dejar todo sin commit y detenerse.
