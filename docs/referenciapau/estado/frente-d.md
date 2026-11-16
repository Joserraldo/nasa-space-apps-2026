# Estado del Frente D (Daniel)

Actualizado: 16 nov 2026, iteración 12 del loop.

**Hecho**
- D2 (#350), D4 (#371), D5 corredor (#376) y D5 taller (#381): fusionados.
- D1 (#342, borrador): espera la revisión de F3 y a C2.
- D5 hábitat (#388): listo para revisión.
- D3 (rama `feat/frente-d-d3-ciclo-dia`): `cicloDia.ts` y `sistemas/cicloDia.ts`. Día hasta la base, tarde en la tormenta y atardecer azulado en el final; el Sol nunca baja de 5° (sin noche jugable). Sol de 24,6597 h (NSSDC). fps sin cambio (36 en `media` sin GPU).

**Sigue**
- Regla de la noche con José (issue abierto): sin noche hasta que el motor modele que el panel no da energía.
- Unificar `tinte` y la caja de sala del taller con `interiores/comun.ts`.
- D6 (detalles de ambiente) y D7 (tormenta en el cielo).

**Bloqueado**
- C2 sin PR (bloquea cerrar D1). A8 conecta las salas.
- `tests/capturas/capturar.mjs` se corta en la pantalla de módulos también en develop (issue abierto).
