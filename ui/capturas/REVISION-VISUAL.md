# Revisión visual del exterior — 15 nov 2026

Referencias inspeccionadas: `mundo/01`, `mundo/02`, `exterior/03` y `piezas/02`; el cielo sigue MARTE §4. Las imágenes `escena-*` conservan el estado anterior; `revision-*` muestran esta corrección.

| Pieza | Problema anterior | Corrección y comprobación |
| --- | --- | --- |
| Pavimento | Losas duplicadas en cruces y tramos debajo de otras losas | Unión geométrica única; pruebas de área contra polígonos duplicados e intersecciones. Ancho 2,1 → 1,3 m. |
| Torre | Oculta detrás del hábitat y sobredimensionada | Torre a la izquierda, escala 1; tambor único en vez de dos cuerpos interpenetrados. Sin cápsulas ni tubo decorativo sin colisión. |
| Consolas | Tres masas del mismo tamaño dominaban la imagen | Una principal; taller al 55 % y sensor al 40 %. Pantalla azul petróleo derivada del token teal y símbolo cian sin cifras. |
| Solar | Plataforma invadía el refugio; controlador contra el taller | Una fila de dos paneles, plataforma menos profunda, controlador dentro del extremo izquierdo. |
| Invernadero y reciclador | Sus volúmenes se interpenetraban | Escalas configuradas por fábrica; reciclador orientado al lateral. Tests de cajas envolventes de todos los pares de módulos y todas las consolas. |
| Decoración | Cajas, cápsulas y balizas competían con los edificios | Dos cajas; sin cápsulas; balizas cada 5 m, excluidas del pavimento y plataformas. Menos rocas, instanciadas. |
| Cámara | Encuadre central rígido; primera persona tapada por la pantalla | Tercera persona abre las siluetas; primera persona a altura infantil y campo de 70°, separada de la consola. |
| Cielo y luz | Cielo desaturado por un segundo tone mapping | El domo conserva los colores de MARTE; luz principal y relleno recalibrados. |

## Arquitectura
`baseExterior.ts` concentra la composición y las escalas de las consolas; `pavimento.ts` resuelve la unión de superficies; las fábricas de piezas y módulos conservan geometrías y materiales compartidos. No se añadieron modelos externos, librerías ni cientos de mallas de baldosas.

## Verificación
- 586 pruebas, typecheck, build y ruta dorada E2E en verde.
- Cota por recorrido con sombras: 41 llamadas / 28 343 triángulos con dos módulos; 71 / 32 321 con cinco. Antes, cinco módulos: 37 782 triángulos.
- Cinco capturas con viewport y canvas coincidentes: 1024×683, 844×390, 390×844, dos módulos y primera persona. Sin errores JavaScript, consola o HTTP en esta ejecución; registro en `revision-verificacion.json`.
- Reproducir: servidor Vite en 5174 y `node ui/capturas/capturar-revision.cjs` (Chrome instalado). Cambiar origen con `ESCENA_URL`.

## Diferencias que siguen visibles
- El preview no incluye niño, Iris, Ingeniera ni HUD; son integraciones de otras pistas y no se simulan con decorado.
- El encuadre y la silueta de cada edificio son más legibles, pero no se acredita la tolerancia del 2 % respecto a la lámina.
- El pavimento es continuo: faltan juntas sutiles de baldosas; se priorizó eliminar caras encimadas.
- Las colisiones de navegación conservan las reservas del mapa; esta prueba verifica geometría y separación de objetos, no todas las trayectorias de un jugador integrado.
- El formato vertical conserva el recorte; la base jugable móvil está prevista en horizontal según FLUJO §9.
- Las mediciones sintéticas no certifican hardware físico; se identifica la GPU usada a continuación.

## Rendimiento de esta revisión (60 s por perfil)
GPU detectada: **Google SwiftShader mediante ANGLE/Vulkan**, renderizado por software, no la tarjeta física. Vite desarrollo, Chromium headless, cinco módulos, DPR solicitado 1,5.

| Perfil | FPS promedio | p95 de fotograma | Cota geométrica |
| --- | --- | --- | --- |
| Escritorio, alta | 21,44 | 50,1 ms | 71 llamadas / 32 321 triángulos |
| CPU ×6, alta | 15,18 | 83,3 ms | 71 / 32 321 |
| Móvil 844×390, CPU ×6, baja | 59,92 | 16,7 ms | 46 / 27 497 |

No hubo errores JavaScript. En alta se propuso bajar a media y el driver de software emitió avisos de ReadPixels registrados en el JSON. No se extrapolan estos FPS a una GPU de celular. La calidad baja es la candidata conservadora en este entorno; la alta no cumple aquí los objetivos. La cota por recorrido no equivale a renderer.info real.

Datos completos, commit medido y GPU: `rendimiento-revision.json`. Reproducción: `node ui/capturas/medir-sintetico.cjs`; duración por defecto 60 s/perfil, modificable con MEDICION_MS para diagnósticos rápidos.

