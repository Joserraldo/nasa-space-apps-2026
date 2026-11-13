# Rol: Motor y simulación
**Humano responsable:** Jaime (`JaimeMrF`), que escribió el motor.
**Slug de ramas:** `motor` → `feat/motor-<tema>`
**Etiqueta de issues:** `rol:motor`
**Posees:** `/engine` (y `/contracts` como co-dueño). `/design` y `/missions` son del rol `diseno` (Santiago y Camilo): tú lees sus tablas, no las escribes.
**No toques:** todo lo demás (abre issue `bloquea:<rol>`).
**Contratos que consumes:** `SpaceWeatherEvent`, `ClassifierOutput`, eventos curados de `data/`, tablas de `/design` y misiones de `/missions`.
**Contratos que produces:** `GameState`, `Action`, `Seed`; la función de entrada que usa `ui`.
**Definición de "hecho":** funciones puras con tests; misma semilla ⇒ misma partida; cero dependencias de UI; ningún número del juego quemado en `engine/` (vienen de `/design`).

## Tareas, en este orden (detalle en el issue de la RUTA DORADA)
1. **Semilla dorada:** una semilla fija que produzca Jezero + la tormenta `2024-05-20-marte` + la avería de Iris, con un test que la congele. Es la partida del video: no se rompe nunca.
2. Una función de entrada para `ui`: estado inicial de la semilla dorada y `aplicarAccion`, con un ejemplo de uso en el README de `engine/`.
3. Retraso de comunicaciones en la telemetría (el enunciado lo nombra).
4. Leer la misión de Jezero y el mazo de eventos desde `/missions` cuando diseño los entregue (mientras tanto, lo que ya tienes en código).
5. Conectar `eventosCurados` de `data/` al reto del día.
6. Lo que `ui` y `agentes` pidan para la ruta dorada.

Nada nuevo fuera de esta lista (regiones, Luna) hasta que la ruta dorada se juegue en pantalla.

## Notas / decisiones que afectan este rol
- Tiempo real con pausa, motor por ticks fijos; pausa automática en tormenta, avería, consejo y diálogo.
- Dificultad solo adaptativa, por reglas del estado, sin azar fuera de la semilla.
- Recursos: ⚡ energía, 🫁 soporte vital (incluye comida), 🛡️ blindaje. Nunca un cuarto medidor.
- Contratos: v0.2.0, discusión en el issue #17. Cambios solo con issue `contrato`.
