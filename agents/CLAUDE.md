# Rol: Agentes expertos (la tripulación)
**Humano responsable:** José (`Joserraldo`), que también lleva `infra`. Este rol es el diferenciador del juego: va antes que `infra`.
**Slug de ramas:** `agentes` → `feat/agentes-<tema>`
**Etiqueta de issues:** `rol:agentes`
**Posees:** `/agents` (y `/contracts` como co-dueño).
**No toques:** todo lo demás (abre issue `bloquea:<rol>`).
**Contratos que consumes:** `GameState` (solo lectura, recortado), `SpaceWeatherEvent`, referencias de dosis de `data/`.
**Contratos que produces:** `ClassifierOutput`; la API de integración documentada en `agents/README.md` (la usan `ui` y `motor`).
**Definición de "hecho":** funciona sin modelo (atajos, regex, botones); salida JSON validada con Zod; cada respuesta de experto trae la fuente del dato; textos `en` base y `es`; evals con frases de niños pasan.

## Ya hecho (en `develop`)
Capa sin modelo con regex `en`/`es` (#43) · Ingeniera, Doctora y Meteoróloga como código con plantillas (#44) · escena de la tormenta real donde Doctora e Ingeniera se contradicen (#47) · avería guionada de Iris y reparación con la Ingeniera (#49) · README con la API para `ui` y `motor` (#50).

## Tareas, en este orden
1. Rebasar y fusionar lo que está abierto (#51 clasificador con modelo y evals, #52 consejos en la fase satélite).
2. Sentarte con María Paula (`ui`) para que el panel de tripulación use tu API tal cual está; ajustar lo que le falte a la API, no a la pantalla.
3. Pregunta de aclaración cuando la confianza < 0.6 ("¿te refieres al escudo o a la energía?").
4. Iris nivel 1–2 (tutorial y pistas) como texto corto con analogía, 1–2 frases por sistema de la base.
5. Matemático "¿Y si…?" (simula la acción y muestra el costo antes de hacerla): solo cuando la ruta dorada ya se juegue.
6. Evals con 30 frases de niños en `en` y `es`; se corren sin red y, con modelo, dentro del tope de gasto que fije Santiago (D10).

## Notas / decisiones que afectan este rol
- El modelo solo clasifica (`{experto, accion, parametros, confianza}`); los expertos son código y nunca inventan números. Nunca presentar la salida del modelo como "según NASA".
- Personajes originales, tono de ciencia divertida y tierna, nunca grosero. Los expertos nunca mueren; los astronautas con nombre sí corren riesgo (según nivel adaptativo).
- Las averías de Iris las dictan reglas del estado, nunca el modelo.
- Clave del modelo: secreto `BAI_API_KEY` del repo; solo la usa el Worker de `infra`.
