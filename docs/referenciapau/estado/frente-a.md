# Estado — Frente A (José)

**Hecho (15 nov):**
- A0 (PR #337): ganchos `SistemaEscena`, autocarga de `escena/sistemas/`, `fijarPedido`, `calidad.ts`. Espera fusión.
- A1 (rama `feat/frente-a-A1-iris-averiada`): causa = Jezero arranca con `iaBase: "danada"` (avería guionada) y
  `objetivoDeLaBase` la daba por revelada; además el paso previo a la tormenta era el 5. Ahora `pasoDeLaBase` (4 al
  entrar) y `averiaIrisRevelada` (desde `averiaIris.pasoRevelacion`, 6). Chip: "Ask the Engineer at the workshop".

**Sigue:** A2 (cadena de objetivos → `objetivo`, `iris`, `globo`).

**Bloqueado:** issue #339 (E): `MundoBase.tsx:125` revela la avería al salir de `modulos` (rover con ojos en X en el
turno 0) y la e2e del respaldo 2D espera "Repair Iris" en el turno 0. Cuando E lo cambie, el taller pasa a
`averiaIrisRevelada`.
