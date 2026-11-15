# Estado — rol 2 (Motor y simulación)
**Actualizado:** 2026-11-14 · **Rama:** feat/motor-multi-mision · **Hecho por datos (Daniel) cubriendo a Jaime, ausente**

## Hecho
- #152 parte motor: la misión es el último parámetro opcional (`mision = MISION_JEZERO`) de aplicarAccion, puedeAplicar, puedeColocar, aterrizar, elegirDilema, avanzarTick, queEsSi, paso, tormentaActiva, tormentaEnCurso, novedades y conPausaAutomatica. Nueva `partidaDeMision(mision, semilla?)`; `partidaDorada()` la usa con Jezero. Compatibilidad total (tests viejos intactos). Tests: `multi-mision.test.ts`. Uso en README.

## Qué sigue
- Jaime: revisar la rama. Propuesta (issue `contrato`, no hecho): guardar `misionId` en GameState para no pasar la misión en cada llamada.
- Diseño (#152): huecos del tipo `Mision` (eventoPolvo, metas, efectos por sitio, retraso de comunicaciones, fin distinto). El motor aún no usa `fin.tickLimite`, `eventoPolvo`, ni `MODULOS` por misión.
- ui (#152): pasar la misión elegida en cada llamada (hoy usa Jezero por defecto).
- #90 consumo de módulos: ver rama anterior; `MISION_JEZERO.fin.tickLimite` sin aplicar.

## Bloqueos
- ninguno
