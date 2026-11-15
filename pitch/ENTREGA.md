# Checklist de entrega (P5) — domingo 15 nov

Entrega abre sáb 14 nov 9:00 y **cierra dom 15 nov 23:59 hora local** (`docs/reglas.md`; la zona horaria exacta es **por confirmar**). Meta del equipo: formulario enviado **antes de las 20:00**, con 4 horas de margen para un reenvío. Escrito por un agente de apoyo a pedido de Santiago; José (dueño de `pitch/`) lo ajusta.

Responsables según `docs/ORQUESTACION.md` y `.github/CODEOWNERS`: José = infra y pitch · Santiago = orquesta y fusiona · Daniel = datos · María Paula = ui · Jaime = motor · Camilo = diseño. "Narrador" = un adulto del equipo, por nombrar (**por confirmar**); no se usa la voz ni la imagen de menores de 18.

## Enlaces del proyecto (hoy)

| Qué | Enlace | Estado |
|---|---|---|
| Repositorio | https://github.com/Joserraldo/nasa-space-apps-2026 | Público (verificado 15 nov). Sin archivo `LICENSE` |
| Demo, develop (respaldo seguro) | https://nasa-space-apps-2026-preview.santiago031541.workers.dev | Responde 200 (15 nov) |
| Demo, rama de escenarios (rediseño y 3D) | https://nasa-space-apps-2026-escenarios.santiago031541.workers.dev | Responde 200 (15 nov) |
| Demo, producción (`main`) | https://nasa-space-apps-2026.santiago031541.workers.dev | Versión del sáb 11:40; **por confirmar** si se actualiza a `main` final |
| Video | **por llenar** al subirlo | |
| Formulario / página del equipo | https://www.spaceappschallenge.org (página del equipo; enlace exacto **por llenar**) | La Guía de Entrega no está en el repo |

## Pasos con hora

| Hora | Paso | Quién | Enlace o dónde | Hecho |
|---|---|---|---|---|
| Mañana (antes de las 13:00) | Grabación de prueba de la ruta dorada: tiempos, audio, resolución y pantallas que fallan. Sirve de video de respaldo | José + narrador | Preview de develop y de escenarios (arriba) | [ ] |
| Antes de las 13:00 | Decidir qué preview se graba y cuál es la **URL de la demo que se entrega** (develop, escenarios o `main`) | Santiago | PRs #237, #247 y los de `escena:` | [ ] |
| 13:00 | **P4: congelar funciones.** Anotar el commit y la hora del build congelado. Desde aquí solo arreglos | Santiago (todos acatan) | `develop` / `feat/ui-escenarios` | [ ] |
| 13:00 | Probar sin conexión (cargar, apagar la red, pulsar botones). Si falla, quitar la frase "works without internet" del guion y del formulario | José | `pitch/guion-video.md` (T11) | [ ] |
| 13:00–17:00 | Grabar el video con la lista de tomas T1 a T11, en inglés y un corte en español. 2 tomas de cada una | José + narrador | `pitch/guion-video.md`, sección "Lista de tomas" | [ ] |
| 13:00–15:00 | Si se actualiza producción: fusionar a `main` y esperar el despliegue (rebase a `main`, solo con orden de Santiago) | Santiago | Producción (arriba) | [ ] |
| 15:00 | Pasar por la demo elegida la ruta dorada completa en EN y ES: ganar y perder una vez; abrir la pantalla "datos usados" | María Paula o Camilo | Demo elegida | [ ] |
| 15:00 | Completar `pitch/formulario/*` con lo que quedó en el build congelado: borrar toda función que no esté; resolver cada "POR VERIFICAR" | José + Daniel | `pitch/formulario/` | [ ] |
| 15:00 | Decidir y agregar `LICENSE` (la entrega pide licencia abierta para el contenido original; el tipo exacto es **por confirmar** en https://www.spaceappschallenge.org/legal/) | José + Santiago | Raíz del repo | [ ] |
| 15:00 | Cada persona completa su fila en `docs/ia-uso.md`; Santiago actualiza la fila "Dentro del juego" (hoy "por decidir"; el build no llama a un modelo) | Todos; Santiago | `docs/ia-uso.md` | [ ] |
| 15:00 | Registrar en `assets/LICENCIAS.md` fuentes, logo, ilustraciones y sonidos; origen de los retratos y la intro | María Paula | `assets/LICENCIAS.md` | [ ] |
| 17:00–19:00 | Edición: subtítulos EN/ES, rótulos de fuente, gráfico de Curiosity RAD, recuadro del JSON. Revisión por una segunda persona con la checklist de `guion-video.md` | José + Daniel (ciencia y atribuciones) | `pitch/guion-video.md` | [ ] |
| 19:00 | Subir el video (YouTube o el medio que pida la Guía de Entrega, **por confirmar**), en no listado o público, y abrirlo en una ventana privada para comprobar que se ve y que tiene sonido | José | **Enlace del video: por llenar** | [ ] |
| 19:00 | Verificar que el repo es público y que el `README` abre la demo y explica cómo jugar; cerrar o rotular las ramas en curso | José | https://github.com/Joserraldo/nasa-space-apps-2026 | [ ] |
| 19:30 | Revisión final del formulario por una segunda persona: cada cifra con su fuente, nada "en vivo", atribución "Unofficial project, not endorsed by NASA", sin logo de NASA | Daniel + Santiago | `pitch/formulario/` | [ ] |
| **Antes de las 20:00** | **Enviar el formulario** en la página del equipo, con video, demo, repo, descripción, uso de datos NASA y declaración de IA | José (Santiago presente) | Página del equipo en spaceappschallenge.org | [ ] |
| 20:00–23:00 | Abrir los tres enlaces enviados desde otro dispositivo y otra cuenta; si algo falla, reenviar | José | Los tres enlaces | [ ] |
| 23:59 | Cierre. No tocar nada después de las 23:00 salvo un reenvío necesario | — | — | [ ] |

## Antes de enviar: puntos que bloquean

- [ ] El formulario describe solo lo que existe en la demo elegida; lo demás está bajo "Future work (not in this version)".
- [ ] La demo elegida juega la ruta dorada de punta a punta (pasos 1 a 8), en EN y ES.
- [ ] El video no muestra funciones inexistentes (ruta dibujada, selector de misión, las otras 4 misiones, voz) ni a menores.
- [ ] Todo dato de NASA con su fuente y fecha; la CSA y Zhang et al. 2020 no se atribuyen a NASA.
- [ ] `docs/ia-uso.md` y `pitch/formulario/ia-uso.md` dicen lo mismo.
- [ ] Sin claves en el repo (el modelo, si se usa, solo desde el Worker).

## Requisitos de `docs/reglas.md` sin cubrir hoy

1. **Licencia abierta** para el contenido original entregado: no hay `LICENSE` en el repo. El tipo exacto exigido está sin confirmar.
2. **Guía de Entrega** (campos exactos, duración y formato del video, política de IA/"SI", criterios de juicio): no está en el repo; hay que leerla en la página del equipo y volcarla en `docs/reglas.md`.
3. **Descripción del uso de IA:** `docs/ia-uso.md` tiene filas de solo tres personas; faltan las de Camilo, Jaime, José y Daniel, y la fila "Dentro del juego" sigue "por decidir".
4. **Datos y código no-NASA con licencia abierta verificada y citada:** Zhang et al. 2020 (CNSA), CSA (© Canadian Space Agency, con condiciones de copyright propias), Nunito (SIL OFL 1.1, ya en `assets/LICENCIAS.md` de la rama de escenarios) y las librerías: la tabla final de `atribuciones.md` espera el `package-lock.json` definitivo. El permiso de uso de las tarjetas de la CSA no está verificado.
5. **Menores de 18:** el video no debe incluir nombre, voz ni imagen reconocible de menores; el equipo lo cumple solo si narra y juega un adulto.
6. **Referencias y recursos citados en el formulario:** falta confirmar contra la lista oficial de Recursos del reto que cada fuente de `datos-nasa.md` aparece o es aceptable.
7. **Zona horaria del cierre** (23:59 "hora local"): sin confirmar para equipos universales.
8. **Entrega en la página del equipo** con el equipo registrado antes del inicio (términos): el registro previo lo debe confirmar un humano.
