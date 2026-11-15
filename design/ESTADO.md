# Estado — diseño y misiones
Actualizado: 15 nov 2026 · Camilo · Rama: `feat/diseno-mecanicas-misiones` · PR: hacia `develop` (ver rama).
Tokens: 🟡
## Hecho
- Recuperados ocho archivos de misiones y los registros de OpenCode; original respaldado antes de editar.
- Dilemas de Marte norte y Luna visible: escudo neutral conforme a #196, aprobado provisionalmente.
- `eventoPolvo` opcional: Luna visible satisface `Mision`; Jezero conserva sus datos y eventos.
- Luna sur y Outpost describen micrometeorito; Outpost usa zonas interiores sin terreno ficticio.
- Local: typecheck, 502 pruebas y build OK; sin cambios de balance. CI en el PR.
## Qué sigue / bloqueos
- Motor: aplicar plazo e integrar expedición al hielo sin energía transitoria; PR separado con pruebas reales.
- Santiago: tick de amanecer/noche polar, almacenamiento de batería y protección por zona sin definir.
- Jaime: eventos especiales, panel nocturno, antena y persistencia de zonas requieren integración.
- Luna visible sigue ganando por telemetría: contradice #196; no certificada como jugable.
- Evidencia y alcance: `PRUEBAS-MECANICAS.md`; sin merges ni cambios de UI/contratos.
