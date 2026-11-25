# Plan para terminar Solar Shield (propuesta)

**Fecha:** 25 nov 2026 · **Equipo desde ahora:** Santiago y María Paula · **Estado:** propuesta, sin aprobar.

## 0. Por confirmar antes de planear fechas

`PLAN.md` y `docs/reglas.md` dicen que la entrega cerraba el **15 nov a las 23:59**. Falta confirmar cuál es la fecha que vale ahora y qué se entrega. El plan de abajo va por orden, sin fechas.

## 1. Qué tenemos

Verificado en el PR #458 (tipos, 1211 pruebas, compilación, partida dorada y navegador 12 de 12):

- Una misión jugable de principio a fin, Jezero, en 3D, en inglés y español.
- Entrada como invitado o con cuenta, y progreso guardado.
- Tormenta con datos reales de NASA, aviso previo, dosímetro, plazo de la telemetría, fallo de Iris y causa del final.
- Gestos de la tripulación y cámara ajustada para celular vertical.
- Pantalla de datos usados dentro de los créditos.

Además:

- Publicación automática: `develop` va a `nasa-space-apps-2026-preview` y `main` a `nasa-space-apps-2026` (ambos en `santiago031541.workers.dev`; respondían el 25 nov).
- Salas por dentro y mejora de rendimiento (ramas de María Paula): junto con #458 pasan tipos, pruebas y compilación.
- Borradores del formulario y del guion del video en `pitch/`.
- Otras cuatro misiones como datos en `missions/`, todavía no jugables.

## 2. Qué falta

### Juego

| Trabajo | Estado | Dueño propuesto |
|---|---|---|
| Salas (#426–429, #432, #433, #435, #436, #438–440) y rendimiento (#434) | Listo para juntar en un PR | María Paula |
| Colonia nueva (#451, #452, `feat/exterior-d2-parcial`) | Falla `salto.test.ts`; en navegador fallan 4 de 12 por tiempo agotado; choca con las salas; panel de Craftpix por decidir | María Paula |
| Cielos y texturas (#424, #425, #437, #446–448, colonia piloto) | Chocan con otras ramas suyas | María Paula |
| Hábitat y antena (#342) | Falta revisar la última corrección | María Paula |
| Distribución de lugares (#374) | Rompe `expertas.test.ts`; está a medias | Por decidir |
| Misiones múltiples (#410–415) | Chocan en pantallas y textos | Santiago, después de las salas y la colonia |

### Errores conocidos

1. Con Iris averiada, la experta que la repara solo responde la verificación (`agents/src/conversar.ts`).
2. La verificación recalcula lo que "dijo Iris" con el valor actual del medidor.
3. `dialogosDelPaso` no usa la avería de la misión; hoy la interfaz no lo llama.
4. Con movimiento reducido las expertas siguen cambiando de pose.
5. En celular vertical queda poco recorrido para subir la cámara.
6. A 1280x720, con la respuesta de Iris abierta, los retratos de las expertas quedan cortados.
7. Issues abiertos por revisar: #453, #455, #456, #394, #393, #361, #222, #196, #178, #152 y #109.

### Entrega (según `pitch/ENTREGA.md`)

- [ ] Elegir el enlace que se entrega y actualizar `main` (hoy está por detrás de `develop`).
- [ ] `LICENSE` en la raíz (no existe).
- [ ] Video de demo.
- [ ] Formulario: resolver las marcas "por verificar" y quitar lo que no esté en la versión final.
- [ ] `docs/ia-uso.md`: faltan filas del equipo y la sección "Dentro del juego" está desactualizada.
- [ ] Comprobar que el modelo del clasificador responde en producción.
- [ ] Revisar fuentes y licencias en `assets/LICENCIAS.md`.
- [ ] Pruebas con niños con permiso de adultos y notas anónimas (hay protocolo, no se ha hecho ninguna).
- [ ] Respaldo para la demo sin conexión (no encontré nada que lo implemente).
- [ ] Enviar el formulario.

### Administración

- [ ] El repositorio está en la cuenta de José y Santiago no es administrador: pedir transferencia, o confirmar quién cambia secretos y ajustes.
- [ ] Actualizar `.github/CODEOWNERS` y los roles de `CLAUDE.md` para dos personas.

## 3. Orden de trabajo

| Fase | Santiago | María Paula | Se pasa cuando |
|---|---|---|---|
| 1. Base común | Fusionar #458; confirmar fecha; resolver permisos del repo | Actualizar sus ramas con `develop` | `develop` publicado y probado |
| 2. Salas | Revisar el PR; errores 1 a 3 (`agents/`) | PR único de salas y #434 | Salas en `develop` con navegador 12 de 12 |
| 3. Mundo | `LICENSE`, `ia-uso`, formulario; CODEOWNERS | Colonia nueva; errores 4 a 6; #342 | Colonia en `develop` o descartada |
| 4. Opcional | Misiones múltiples | Cielos y texturas | Solo si se decide hacerlo |
| 5. Cierre | `main`, video, formulario | Pruebas visuales en celular y pruebas con niños | Enviado |

## 4. Para no pisarnos

- `ui/` y `assets/`: María Paula. `engine/`, `agents/`, `data/`, `design/`, `missions/`, `infra/`, `pitch/` y `docs/`: Santiago.
- Si uno necesita tocar lo del otro, avisa antes.
- Antes de abrir un PR: `npm run typecheck`, `npm test`, `npm run build` y `npm run e2e`.
- PRs encadenados: preferir un solo PR por entrega.

## Decisiones pendientes

1. Fecha y formato de la entrega.
2. ¿Entran las misiones múltiples o se entrega solo Jezero?
3. ¿Entra la colonia nueva? ¿Qué cielos se conservan?
4. ¿Se usa el panel de Craftpix en un repositorio público?
