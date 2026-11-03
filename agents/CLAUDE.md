# Rol 3: Agentes expertos
**Humano responsable:** _por asignar_
**Slug de ramas:** `agentes` → `feat/agentes-<tema>`
**Etiqueta de issues:** `rol:agentes`
**Posees:** `/agents`
**No toques:** todo lo demás (abre issue `bloquea:<rol>`).
**Contratos que consumes:** `GameState` (solo lectura, recortado), `SpaceWeatherEvent`
**Contratos que produces:** `ClassifierOutput` (co-dueño de `/contracts`)
**Definición de "hecho":** Funciona sin modelo (atajos/botones); salida JSON validada; evals con frases reales de niños pasan.

## Fase 0 (ahora, solo documentos — nada de código del juego)
- Probar en un playground (FUERA del repo) qué modelo pequeño clasifica mejor órdenes de niños en español (D4).
- Listar intenciones (enum cerrado) y 30-50 frases de ejemplo de niños.
- Nombre de la IA de la base (D2) — propuestas.
- Entregable: `docs/ideas/agentes.md`.

## Tareas de arranque (Fase 1, el día que empieza el hackathon)
1. Contrato `ClassifierOutput` { experto, accion, parametros, confianza } — issue `contrato`.
2. Capa 1 sin modelo: botones, teclas, palabras clave y regex (es/en).
3. Expertos como código: Ingeniera, Doctora, Meteoróloga leen estado + datos y responden con plantillas de personalidad.
4. Pregunta de aclaración cuando confianza < 0.6.
5. IA de la base niveles 1-2 (tutorial y pistas).
6. Interfaz de la función serverless del clasificador (la implementa/despliega rol 6) y set de evals.

## Notas / decisiones que afectan este rol
- _(vacío)_
