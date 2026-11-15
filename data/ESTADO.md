# Estado — datos
**Actualizado:** 2026-11-14 · **Rama:** feat/datos-inventario-fuentes · **PR:** #191

## Hecho
- Corregí `docs/science/datos-usados.md` en es/en: las fuentes lunares y de Marte norte ya están integradas y el hielo no se presenta sin cita.
- Actualicé los comentarios de exportación de los terrenos lunares; 130 pruebas de datos y typecheck en verde.
- La gravedad de Marte y la Luna está en el PR #187, con CI verde y sin conflictos; cierra #141 al fusionarse.
- #61 y D8 (#8) ya tienen entregables fusionados; esperan cierre o visto bueno del equipo.
- La capa de hielo de Moon Trek sigue sin atribución verificable. Su texto permanece apagado; ver `docs/science/terreno.md`.

## Qué sigue
- Esperar revisión y fusión de #187; coordinar con UI el uso de `GRAVEDAD_MARTE_MS2`.
- Retomar el efecto del sitio sobre módulos cuando los dueños aprueben el cambio de contrato #178.

## Bloqueos
- #178 requiere aprobación de contrato. La capa `SP_IceLoc_280m` carece de procedencia científica verificable.
Tokens: 🟢


