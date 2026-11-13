# Rol 1: Diseño de juego y misiones
**Humano responsable:** Jaime (`JaimeMrF`) y Camilo (`CamiloM21`). Desde el 13 nov esta carpeta y `missions/` son del rol `motor`.
**Slug de ramas:** `diseno` → `feat/diseno-<tema>`
**Etiqueta de issues:** `rol:diseño`
**Posees:** `/design`, `/missions`
**No toques:** todo lo demás (abre issue `bloquea:<rol>`).
**Contratos que consumes:** `GameState`, `Action` (para balancear)
**Contratos que produces:** Tablas de balance y misiones como datos que el motor lee (no lógica)
**Definición de "hecho":** Cada número del juego vive en una tabla de `/design` o `/missions`; una misión completa jugable en papel; revisado por rol 2.

## Fase 0 (ahora, solo documentos — nada de código del juego)
- Investigar 3-5 juegos de gestión de recursos para niños (qué funciona, qué abruma).
- Borrador de 3 misiones y del mazo de eventos (70 % decisión / 30 % mala suerte).
- Propuesta de duración de partida (D9).
- Entregable: `docs/ideas/diseño.md`.

## Tareas de arranque (Fase 1, el día que empieza el hackathon)
1. Tabla de recursos: valores iniciales, máximos y costo de cada acción (cada acción mueve ≥ 2 medidores).
2. Misión de la rebanada vertical (Luna polo sur, 3 expertos) como datos en `/missions`.
3. Mazo de eventos (decisión y mala suerte) con su retraso de consecuencias por dificultad.
4. Tabla de dificultades (sección 2.6 del PLAN) como datos.
5. Textos de la pantalla "cadena de causas" (es/en) en coordinación con rol 5.

## Notas / decisiones que afectan este rol
- _(vacío)_
