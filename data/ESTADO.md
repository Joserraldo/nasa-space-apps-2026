# Estado — datos
**Actualizado:** 2026-11-14 23:00 · **Rama:** feat/datos-auditoria-p4 · **PR:** #192 (incluye #191) · #193 abierto

## Hecho
- Fusionados hoy: #126 (polo sur lunar), #148, #159, #160, #177 y #187 (gravedad de Marte 3,73 y Luna 1,62 [V] NSSDC; cierra #141).
- `docs/science/datos-usados.md` en es/en: fuentes lunares y de Marte norte integradas; el hielo no se presenta sin cita (#191).
- Auditoría P4 ampliada a Luna visible, polo sur, Marte norte, luz SVS y CRaTER: dueño, URL, fecha, estado curado y claves (#192).
- Escenario 3D: `feat/ui-escenario-base` con cielo, terreno y 9 tests sin Three; espera el permiso de three (#180).

## Qué sigue
- Fusión de #192 y #193; coordinar con UI el uso de `GRAVEDAD_MARTE_MS2`.
- Glosario: sol (día de Marte), telemetría y tick, en EN y ES.
- Efecto del sitio sobre módulos cuando aprueben el contrato #178.

## Bloqueos
- #180 (three en ui/package.json) y #178 (contrato). La capa de hielo de Moon Trek sigue sin procedencia verificable: texto apagado.
Tokens: amarillo
