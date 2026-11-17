# D12 — Fin de partida en el mismo tick y motor multi-misión
**Dueño:** Frente A (José), propuesta para diseño · **Fecha:** 2026-11-17 · **Estado:** propuesta

Cierra la tarea A11 del plan de jugabilidad (hallazgos #20 y #21 de `PLAN-JUGABILIDAD.md` §1) y el issue #152.

## 1. Recurso en 0 y objetivo cumplido en el mismo tick (#21)

En un mismo tick pueden pasar las dos cosas: llega la telemetría (o se alcanza el tick de "sobrevivir hasta") y un
recurso cae a 0 por el consumo, la tormenta o la mala suerte.

| Opción | A favor | En contra |
|---|---|---|
| **Gana el fallo** (recurso en 0 primero) | La base sin un recurso no "sobrevive": enseña que cuidar los tres medidores es la condición, no un detalle. Es lo que hace hoy el motor | Puede sentirse injusto si la telemetría llegó "justo" |
| Gana la telemetría | Premia haber enviado a tiempo | Contradice "pierde si un recurso llega a cero" (MECANICAS §1) y la regla de oro (toda acción cuesta) |
| Empate con final propio | Cuenta las dos cosas | Un tercer final que el resumen y las tarjetas tendrían que explicar |

### Elegida (propuesta)
**Gana el fallo.** El orden de fin es: recurso en cero > objetivo cumplido > plazo agotado sin objetivo.

### Por qué
Ya es lo que hace el motor (`engine/src/acciones.ts`, final de `avanzarTick`) y está fijado por pruebas: "recurso cero
prevalece sobre telemetría y plazo coincidentes" (`engine/src/fin-limite.test.ts`) y "si un medidor llega a 0 en ese
tick, pierde" (`engine/src/fin-exito.test.ts`). Para el niño, `resumenPartida` separa las decisiones de la mala suerte,
así que el final explica por qué se perdió aunque la telemetría haya llegado.

## 2. El motor recibe la misión como parámetro (#20, #152)

| Pieza | Estado (verificado en `develop`) |
|---|---|
| Motor con la misión como último parámetro, Jezero por defecto, `partidaDeMision(mision)` | Hecho (#169) |
| Causa del evento libre por misión | Hecho (#170) |
| Tarjeta de ciencia con varias fuentes y aviso "curado, no en vivo" | Hecho (#171) |
| `terrenoId` opcional (outpost) | Hecho (#172) |
| Retraso de comunicaciones por misión | Hecho (#175) |
| Costos de módulos por misión | Hecho (#177) |
| Metas de paso propias (`MetaPaso` acepta cualquier texto) | Hecho (`missions/src/jezero.ts`) |
| Victoria por sobrevivir hasta un tick | Hecho (`ExitoCuando`, `fin-exito.test.ts`) |
| Efecto del sitio o la zona sobre los módulos (hielo, sombra polar) | `[NV]`: no lo verifiqué; pedirlo a diseño si hace falta |
| La UI pasa la misión elegida en cada llamada (reductor y pantallas) | Pendiente **a propósito**: solo Jezero es jugable (MECANICAS §1, NIVELES). Se hace cuando diseño habilite una segunda misión; hasta entonces sería código sin uso |

## Consecuencias para cada rol
- **Motor y misiones:** sin cambios; la regla y las pruebas ya están.
- **UI (E y F):** el final de "fallo" con telemetría llegada debe mostrar las dos cosas (la telemetría llegó, la base no
  aguantó); `resumenPartida` ya da las causas.
- **Diseño:** aprobar la opción elegida y decidir cuándo se juega una segunda misión. Con eso se puede cerrar #152.
