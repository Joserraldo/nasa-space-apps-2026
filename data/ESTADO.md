# Estado — datos
**Actualizado:** 2026-11-14 · **Rama:** feat/datos-auditoria-p4 · **PR:** #192 (incluye #191)

## Hecho
- Corregí `docs/science/datos-usados.md` en es/en: las fuentes lunares y de Marte norte ya están integradas y el hielo no se presenta sin cita (#191).
- Extendí la auditoría P4 a Luna visible, polo sur lunar, Marte norte, luz SVS y mediciones CRaTER: exige dueño, URL, fecha, estado curado y claves en/es, e impide publicar texto de hielo sin atribución (#192).
- La gravedad de Marte y la Luna va en #187 y cierra #141 al fusionarse.
- #61 y D8 (#8) ya tienen entregables fusionados; esperan cierre o visto bueno del equipo.

## Qué sigue
- Revisión y fusión de #187, #191 y #192, en ese orden; coordinar con UI el uso de `GRAVEDAD_MARTE_MS2`.
- El efecto del sitio sobre módulos espera la aprobación del contrato #178.

## Bloqueos
- La capa de hielo `SP_IceLoc_280m` de Moon Trek carece de procedencia científica verificable; su texto sigue apagado (ver `docs/science/terreno.md`).
Tokens: 🟢
