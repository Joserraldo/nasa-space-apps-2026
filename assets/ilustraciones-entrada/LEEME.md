# Ilustraciones de portada y carga

El generador oficial es tests/capturas/ilustraciones.mjs. Ejecútalo desde la raíz con node tests/capturas/ilustraciones.mjs. Usa Python/Pillow ya disponible en el entorno; no añade dependencias npm.

Las fuentes PNG viven en tests/capturas/ilustraciones/fuente. Conservan el canal alfa y representan los originales elegidos para el PR #366. Las cuatro piezas de carga son los recortes RGB de la ilustración original con alfa; no son un redibujo SVG.

## Formatos y conservación

- Salida a ui/public/ilustraciones, dos formatos por ancho: AVIF q92 con crominancia 4:4:4 y WebP q92.
- Alfa real preservado y comprobado después de codificar.
- Se conserva el RGB de la fuente sin cambiar la resolución del original; el perfil ICC se pasa al codificador si la fuente lo incluye. Las fuentes revisadas no traen perfil ICC ni valor gamma explícito.
- El redimensionado usa interpolación de alfa premultiplicado para evitar halos de color.
- No se amplía. Si la caja alfa con margen no alcanza el ancho pedido, el archivo usa el ancho real y el manifest lo registra.
- assets/ilustraciones-entrada/manifest.json registra SHA-256 y bytes de la fuente, dimensiones originales, caja alfa y recorte, resolución/peso/hash de cada salida y alfa verificado.

## Fuentes medidas y anchos

La caja de contenido usa el mismo umbral alfa > 24 del guion anterior, con 4 px de margen. Esto evita que motas transparentes casi invisibles estiren el recorte del niño de portada. El ancho elegido para cada fuente es el límite de salida:

| Pieza | Lienzo fuente | Recorte útil | Variantes |
| --- | ---: | ---: | ---: |
| portada-nino | 1536×1024 | 658×851 | 448, 656 |
| portada-nave | 1024×683 | 577×487 | 280, 560 |
| portada-planeta | 1024×683 | 658×361 | 200, 400 |
| portada-asteroide | 1024×683 | 374×365 | 120, 240 |
| carga-nino | 440×650 | 389×593 | 200, 384 |
| carga-panel | 330×260 | 284×211 | 140, 280 |
| carga-invernadero | 330×280 | 249×220 | 130, 248 |
| carga-habitat | 430×320 | 382×246 | 180, 360 |

El PNG del niño de portada contiene motas alfa casi invisibles fuera de la silueta. Con el umbral anterior, su caja útil mide 658×851; se generan anchos 448 y 656 px para cumplir el tope de peso/calidad solicitado. El niño de carga tiene 389 px útiles y el invernadero 249 px; sus variantes máximas son 384 y 248 px. No se escalan artificialmente.

## Dependencias

Portada y carga importan anchos nominales para srcset/aspect ratio desde ui/src/componentes/base/Ilustracion.tsx. Si una caja alfa reduce el ancho máximo, el dueño de ese componente sincroniza proporción/ancho anunciado con el manifest. No editar esos TS/CSS desde el generador.

