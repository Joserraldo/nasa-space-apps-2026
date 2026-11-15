# Estado — motor y simulación
Actualizado: 15 nov 2026 · Camilo, apoyo a Jaime · Rama: `feat/motor-fin-misiones` · PR: hacia `develop` (ver rama).
Tokens: 🟡
## Hecho
- Recuperados acciones/dilema y dos pruebas; original respaldado antes de editar.
- Plazo: recurso cero prevalece, objetivo en límite gana, plazo sin objetivo falla; sin victoria global por día.
- La compensación del hielo se suma antes de cobrar/sortear; sin energía transitoria ni causa de invernadero.
- Jezero conserva la ruta y el orden RNG de extras disjuntos.
- QA recuperado: rutas fijas de cuatro misiones, costos, retrasos, dilemas y determinismo; original preservado.
## Qué sigue / bloqueos
- Local: typecheck, 537 pruebas y build OK; revisión de Jaime/Santiago y CI en el PR.
- Luna visible no certificada: falta tick de amanecer aprobado; telemetría heredada contradice #196.
- Noche polar/batería, efectos especiales y protección por zonas requieren definición/integración separada.
- Los 10 ticks siguen provisionales; no se declaran completadas las cinco misiones.
- Sin merges ni cambios de UI, agentes, contratos o ramas ajenas.
