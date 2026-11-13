# Rol: Diseño de juego y misiones
**Humanos responsables:** Santiago (`kcitas`) y Camilo (`CamiloM21`).
**Slug de ramas:** `diseno` → `feat/diseno-<tema>`
**Etiqueta de issues:** `rol:diseño`
**Posees:** `/design`, `/missions`
**No toques:** todo lo demás (abre issue `bloquea:<rol>`). El motor (`/engine`) es de Jaime: le pides con `bloquea:motor`.
**Contratos que consumes:** `GameState`, `Action`, `SpaceWeatherEvent` (para balancear).
**Contratos que produces:** tablas de balance (`/design`) y misiones (`/missions`) como datos que el motor lee. Nunca lógica.
**Definición de "hecho":** cada número del juego vive en una tabla aquí; la misión de Jezero se puede jugar en papel de principio a fin; Jaime la lee sin preguntar nada.

## Lo que ya existe (lo escribió Jaime dentro del motor; se saca a tablas aquí)
`design/` ya tiene archivos de balance que el motor usa hoy. Léelos antes de crear nada; el trabajo es completarlos y moverles los números que sigan quemados en `engine/`.

## Tareas, en este orden (detalle en el issue de la RUTA DORADA)
1. **Misión de Jezero** en `/missions` como datos: sitio, 3–4 sitios candidatos con sus 3 criterios, módulos disponibles, tormenta `2024-05-20-marte`, momento de la avería de Iris, condición de fin.
2. **Tabla de recursos:** valores iniciales y máximos, costo de cada acción y de cada módulo (cada acción mueve ≥ 2 medidores; ninguna opción es gratis).
3. **Mazo de eventos:** tormenta solar (real), tormenta de polvo, micrometeorito, falla del invernadero; ≈70 % por decisiones, ≈30 % mala suerte; retraso de 1–3 ticks.
4. **Retraso de comunicaciones** como regla de la telemetría (el enunciado lo nombra).
5. **Umbrales de la dificultad adaptativa** (racha de aciertos, errores repetidos, tiempo quieto) y qué consecuencias habilita cada nivel. Las pérdidas definitivas solo en niveles medio y alto, nunca con un jugador nuevo.
6. Textos de la **cadena de causas** y de la pantalla "Qué aprendimos hoy", en `en` base y `es`.
7. Prueba de "ninguna acción es gratis" y simulación con muchas semillas (con Jaime) para detectar estados imposibles o estrategias dominantes.

## Notas / decisiones que afectan este rol
- La misión de la demo es **Marte, cráter Jezero** (ya no "Luna polo sur"). Las demás regiones y la Luna esperan a que la ruta dorada se juegue en pantalla.
- Recursos: ⚡ energía, 🫁 soporte vital (incluye comida), 🛡️ blindaje. Nunca un cuarto medidor.
- Módulos: panel solar, batería, generador de aire/agua, invernadero, escudo; tres niveles de mejora.
- Dificultad solo adaptativa, por reglas del estado; sin selector y sin preguntar la edad.
