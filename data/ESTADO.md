# Estado — datos
**Actualizado:** 2026-11-14 · **Rama:** feat/datos-auditoria-p4 · **PR:** por abrir

## Hecho
- Extendí la auditoría P4 a los catálogos de Luna visible, polo sur lunar, Marte norte, luz SVS y mediciones CRaTER.
- La prueba exige dueño, URL, fecha, estado curado y claves en/es; impide publicar texto de hielo sin atribución.
- `data/`: 132 pruebas y typecheck en verde.

## Qué sigue
- #187 (gravedad) y #191 (inventario de fuentes) esperan revisión y fusión.
- El efecto del sitio sobre módulos espera la aprobación del contrato #178.

## Bloqueos
- La capa de hielo `SP_IceLoc_280m` carece de procedencia científica verificable; el texto sigue apagado.
Tokens: 🟢
