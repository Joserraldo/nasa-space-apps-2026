# Rol: Frontend, voz, arte y accesibilidad
**Humano responsable:** María Paula (`Paulasaah`).
**Slug de ramas:** `ui` → `feat/ui-<tema>`
**Etiqueta de issues:** `rol:ui`
**Posees:** `/ui`, `/assets`
**No toques:** todo lo demás (abre issue `bloquea:<rol>`).
**Contratos que consumes:** `GameState`, `Action`, `ClassifierOutput` (de `/contracts`); API de `agents/` (ver `agents/README.md`); tarjetas de fuente y eventos curados de `data/`.
**Contratos que produces:** las pantallas. Nada más depende de ti, pero sin ti no hay demo.
**Definición de "hecho":** jugable con teclado y solo texto; textos por i18n con `en` como base y `es` completo; sin errores en consola; captura o gif en el PR.

## Lo que ya existe y debes usar (no lo rehagas)
- `engine/`: crea el escenario por semilla, `aplicarAccion`, órbita, puntaje de sitio, Iris adaptativa y resumen de fin de partida (48 tests). Pregunta a Jaime o Camilo cómo se llama desde fuera.
- `agents/`: tres expertos como código, atajos/regex sin modelo, escena de los dos expertos que se contradicen, avería de Iris. La API está en `agents/README.md`.
- `data/curated/`: tormentas reales; la de la demo es `2024-05-20-marte.json`. `data/i18n/` ya trae textos `en`/`es` de datos.

## Tareas, en este orden (detalle en el issue de la RUTA DORADA)
1. Esqueleto React + Vite + TypeScript en `/ui`, dentro del monorepo (`npm workspaces`), con i18n (`en` base, `es`) desde el primer commit. PR pequeño: solo el esqueleto.
2. HUD de los 3 recursos (⚡ energía, 🫁 soporte vital, 🛡️ blindaje) conectado a un `GameState` real del motor.
3. Panel de tripulación: retrato 2D simple, burbuja de texto y botones por experto. Caja de texto que pasa por los atajos de `agents/`.
4. Pantallas de la ruta dorada: elegir sitio (3 criterios) → colocar módulos → tormenta con pausa y tarjeta de fuente → los dos expertos se contradicen → decidir y enviar telemetría.
5. Pantalla final: cadena de causas (decisión vs. mala suerte) y tarjeta de ciencia.
6. Voz (Web Speech API) solo como mejora, detrás de un interruptor; sin guardar audio.

## Accesibilidad (desde el primer componente)
Teclado y botones grandes · texto grande y fuente legible · nunca solo color (color + ícono + forma) · respetar `prefers-reduced-motion`.

## Notas / decisiones que afectan este rol
- Inglés es el idioma base; español segundo. Ningún texto visible quemado en el código.
- Arte: assets CC0 o propios; cada pieza registra su licencia en `assets/LICENCIAS.md`. Nada de franquicias existentes.
- Propuesta de marca y tripulación de Camilo: rama `feat/ui-marca` (D6, D7).
