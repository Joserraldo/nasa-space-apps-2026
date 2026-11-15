# ARRANQUE: quién inicia, cómo se inicia y la lista de tareas

**Para qué:** que el equipo arranque la implementación del frontend en orden, sin pisarse y sin gastar tokens de más. **Orquesta el frontend:** María Paula. **Orquesta el equipo y fusiona en `develop`:** Santiago. **Revisa todo PR y asigna pendientes:** Claude (revisor).
Detalle de archivos por persona: [FLUJO.md](../referenciapau/FLUJO.md) §1. Modelos y esfuerzo: [README.md](README.md#modelos-y-esfuerzo).

> **Regla visual:** el frontend se construye **solo con las láminas del atlas v8** (`docs/referenciapau/referencias/`) y [DISEÑO.md](../referenciapau/DISEÑO.md). El diseño anterior (prototipo, `estilos.css`, `mision.css`, tema oscuro) **se borra** ([FLUJO.md](../referenciapau/FLUJO.md) §2.2). Todo PR visual trae la **ficha de fidelidad** ([FLUJO.md](../referenciapau/FLUJO.md) §7.1): sin ficha o sin coincidir con su lámina, no se fusiona.

---

## 1. Antes de arrancar (una sola vez)

| # | Qué | Quién | Hecho cuando |
| --- | --- | --- | --- |
| 1 | Fusionar #168 (reparto, prompts y este documento) | Santiago | Está en `develop` |
| 2 | La rama `feat/ui-escenarios` existe | Hecho | Creada desde `develop` el 14 nov |
| 3 | Cerrar el programa que bloquea `docs/referenciapau/referencias/inicio` en su checkout y borrar esa carpeta (son copias de las láminas que ya están en git) | María Paula | `git status` no la muestra |
| 4 | Cada persona actualiza su copia: `git fetch origin && git switch develop && git pull` | Todos | Ven `docs/prompts/` actualizado |

## 2. Orden de inicio

```text
Ola 1 (apenas se fusiona #168), todos a la vez:
  María Paula ─ sesión principal: sube su trabajo local a feat/ui-escenarios
  Daniel ────── escenario 3D con archivos nuevos (lo más importante: modelos y escenario)
  Jaime ─────── revisa #151 y la variabilidad; tokens y componentes base (archivos nuevos)
  Camilo ────── NIVELES §7 y cierre de #114/#56; panel Mapa (archivo nuevo)
  José ──────── #151 sobre #163 y CI para feat/ui-escenarios
  Revisor ───── cola de PRs
  Santiago ──── fusiones de P2 y documentación

Ola 2 (cuando María Paula avisa "mi trabajo ya está en la rama"):
  Jaime borra estilos.css y mision.css · José borra la bienvenida oscura · Daniel borra el prototipo de la escena
  Después cada uno sigue con los archivos que ya existían

Ola 3 (con los contratos fusionados): todos en paralelo hasta el punto de control 1

Seguimiento: María Paula abre su loop de orquestación al final de la ola 1
```

## 3. Cómo se inicia una sesión (cada persona)

1. Actualizar la copia: `git fetch origin && git switch develop && git pull`.
2. Abrir la terminal con el comando de su fila en la tabla del §4 (por ejemplo `claude --model fable --effort medium`).
3. Pegar **el bloque del prompt** de su archivo en `docs/prompts/` (lo que está entre las tres comillas).
4. Leer la **primera respuesta** del agente (máx. 6 a 10 líneas, sin código) y dar el OK o corregir.
5. Escribir el `/loop` que figura al final del prompt.
6. Para el frontend, crear la rama desde la de escenarios: `git switch -c feat/ui-<parte>-<tema> origin/feat/ui-escenarios`. Para tareas de rol, la rama sale de `develop` como siempre.
7. Si se lanzan subagentes en paralelo: uno por worktree (`git worktree add ../ss-<parte>-<tema> -b feat/ui-<parte>-<tema> origin/feat/ui-escenarios`), con archivos disjuntos, máximo 2–3.
8. Al terminar cada iteración, el agente escribe en su sección de `ESTADO.md` qué hizo, qué sigue, si está bloqueado y `Tokens: verde | amarillo | rojo`.

## 4. Tabla de arranque

| Persona | Abre con | Prompt | Parte del frontend | Primera tarea | Loop | Meta para parar |
| --- | --- | --- | --- | --- | --- | --- |
| **Santiago** | `claude --model fable --effort medium` | [supervisor.md](supervisor.md) | — | Fusionar #168 y lo de P2 | 20 min | Formulario enviado (P5) |
| **María Paula** | `claude --model fable --effort medium` | [ui.md](ui.md) | Personajes 3D y aprobación ([front-personajes.md](front-personajes.md)) | Subir su trabajo local a `feat/ui-escenarios` | 10 min | Personajes fieles en la base y punto de control final en `develop` |
| **María Paula** (seguimiento) | `claude --model sonnet --effort medium` | [orquestadora.md](orquestadora.md) | — | Estado del frontend por persona | 30 min | Formulario enviado (P5) |
| **Daniel** | `claude --model fable --effort medium` + Codex GPT-6.1 | [datos.md](datos.md) | **Escenario 3D** ([front-escenario.md](front-escenario.md)) | Materiales, cielo y terreno con archivos nuevos | 10 min | Escenario fiel a `mundo/01` dentro del presupuesto |
| **Jaime** | `claude --model opus --effort high` | [motor.md](motor.md) | Interfaz de las láminas ([front-interfaz.md](front-interfaz.md)) | Revisar #151; tokens v8 | 10 min | Variabilidad (P3) e interfaz montada antes de P4 |
| **Camilo** | `claude --model opus --effort medium` + OpenCode | [diseno.md](diseno.md) | Ubicación y recorrido ([front-ubicacion.md](front-ubicacion.md)) | Issue "Aprobar NIVELES" | 10 min | NIVELES aprobado, base recorrible y prueba reportada |
| **José** | `claude --model opus --effort medium` | [agentes-infra.md](agentes-infra.md) | Integración y pantallas ([front-integracion.md](front-integracion.md)) | #151 sobre #163; CI para la rama | 10 min | Ruta completa en escenarios fusionada en `develop`; video y formulario |
| **Revisor** | `claude --model opus --effort medium` | [revisor.md](revisor.md) | — | Revisar #151, #162 y la subida de María Paula | 15 min | P4 sin PRs pendientes |

## 5. Lista de tareas por persona

Cada tarea tiene su criterio de "hecho" en el prompt o el brief. La etiqueta indica la puerta en la que tiene que estar.

### María Paula (personajes y orquestación del frontend)
- [ ] [sáb noche] Subir su trabajo local a `feat/ui-escenarios` en PRs atómicos
- [ ] [sáb noche] Avisar al equipo y aprobar el borrado del diseño anterior
- [ ] [P3] Niño astronauta (`personajes/08–10`)
- [ ] [P3] Iris rover con sus cuatro niveles visibles
- [ ] [P3] Ingeniera 3D junto al niño, como `mundo/01`
- [ ] [P3] Portada 3D (niño flotando, nave, planeta, asteroide)
- [ ] [continuo] Aprobar y fusionar los PRs hacia `feat/ui-escenarios` contra su lámina
- [ ] [P3 y P4] Puntos de control `feat/ui-escenarios` → `develop` con Santiago
- [ ] [después de P4] Doctora y Meteoróloga 3D si alcanza

### Daniel (escenario 3D, lo más importante; y datos)
- [ ] [ya] Materiales y liberación (archivos nuevos)
- [ ] [ya] Cielo y luz de Marte, sin el azul de las láminas
- [ ] [ya] Terreno de Jezero desde el DEM y rocas
- [ ] [ya] Modelos del kit (puerta, consola, caja, panel, depósito, antena, baliza, camino)
- [ ] [ya] Los 5 módulos con sus estados
- [ ] [ola 2] Borrar el prototipo en `escena3d.ts`, `modelos.ts` y `EscenaBase.tsx`, y montar la escena nueva
- [ ] [P3] Base compacta sobre `LUGARES`, como `mundo/01`
- [ ] [dom 10:00] Medición en celular y PC viejo para decidir P3
- [ ] [entre tareas] #162, #141, glosario (sol, telemetría, tick) y rebases de sus PRs

### Jaime (interfaz de las láminas y motor)
- [ ] [P2] Revisar el uso del motor en #151; responder `bloquea:motor`
- [ ] [ya] Tokens v8 y componentes base (archivos nuevos)
- [ ] [ola 2] Borrar `estilos.css` y `mision.css` y reemplazarlos por `ui/src/estilos/`
- [ ] [P3] Prueba de variabilidad con dos semillas
- [ ] [P4] `FacetButton`, placas de recursos, costo, pendiente, `ConfirmarAccion`, retratos, portada DOM, intro, carga, datos en pantalla
- [ ] [después] #152 parte motor; audio si queda tiempo antes de P4

### Camilo (ubicación, diseño y pruebas)
- [ ] [ya] Issue "Aprobar NIVELES" (decisiones 1, 4 y 5) y cierre de #114 y #56 con evidencia
- [ ] [ya] Panel `Map` (archivo nuevo)
- [ ] [ola 2] `LUGARES` y anclajes, colisiones, cámaras de 3.ª y 1.ª persona, circuitos
- [ ] [desde P2] Jugar la ruta dorada en EN y ES, ganando y perdiendo, y abrir un `bug` por problema
- [ ] [después] Revisar #153–#156 y la forma de #152 con Jaime

### José (integración, agentes, infra y pitch)
- [ ] [P2] #151 rebasado sobre #163 y fusionado
- [ ] [ya] CI para `feat/ui-escenarios` en `ci.yml`
- [ ] [ola 2] Borrar la bienvenida oscura y el tema viejo de `App.tsx` y `pantallas/`
- [ ] [ola 3] Contratos (`VistaEscena`, eventos, ajustes; props de `EscenaBase` con Daniel)
- [ ] [P4] Ruta dorada completa en escenarios, Iris compañera, montaje de todo, respaldo 2D
- [ ] [continuo] e2e verde y despliegue del preview
- [ ] [dom 13:00–17:00] Video con capturas reales; [antes de P5] formulario

### Santiago (orquestación del equipo y fusión)
- [ ] [ya] Fusionar #168, #151 y #162
- [ ] [P3] Punto de control 1 y decisión 3D o 2D con María Paula
- [ ] [P3] Aprobar NIVELES §7
- [ ] [antes de P4] Punto de control 2
- [ ] [P5] Enviar el formulario

### Revisor (Claude)
- [ ] [continuo] Revisar cada PR en el orden de su cola y asignar los pendientes
- [ ] [continuo] Avisar si alguien toca archivos de otra persona (FLUJO §1)

## 6. Flujo

```text
develop (demo estable; fusiona Santiago)
  ▲  punto de control 1 (antes de P3) y 2 (antes de P4)
  │
feat/ui-escenarios (frontend v8; fusiona María Paula)
  ▲  PR de cada persona, revisado por Claude y aprobado por María Paula
  │
feat/ui-personajes-*  feat/ui-escenario-*  feat/ui-interfaz-*  feat/ui-ubicacion-*  feat/ui-integracion-*
   María Paula            Daniel               Jaime              Camilo               José

Tareas de rol (motor, diseño, datos, agentes, infra) ──► PR directo a develop (fusiona Santiago)
```

Ciclo de cada iteración del loop (10 min): sincronizar con la rama base → mirar comentarios del revisor y issues asignados → hacer **una** tarea → verificar → commit atómico → PR o push → `ESTADO.md` con `Tokens:` → resumen de 3 líneas.

## 7. Calendario

| Cuándo | Qué |
| --- | --- |
| Sáb 22:00 | **P2:** ruta dorada jugable en `develop` (#163 ya está, #151 en curso) |
| Sáb noche | Subida de María Paula y borrado del diseño anterior en `feat/ui-escenarios` |
| Dom temprano | Contratos fusionados en la rama de escenarios |
| Dom 10:00 | Medición de Daniel y punto de control 1 |
| Dom 11:00 | **P3:** se decide 3D o respaldo 2D |
| Dom 12:30 | Punto de control 2 (versión final a `develop`) |
| Dom 13:00 | **P4:** congelamiento, solo arreglos |
| Dom 13:00–17:00 | Grabación del video |
| Dom 20:00 | **P5:** formulario enviado |

## 8. Si algo sale mal

| Situación | Qué hacer |
| --- | --- |
| Necesito cambiar un archivo de otra persona | No lo toques: pedíselo en su PR o con un issue. |
| La CI no corre en `feat/ui-escenarios` | Pegá en el PR la salida local de `npm run typecheck`, `npm test`, `npm run build` y `npm run e2e` hasta que José agregue la rama. |
| Dos PRs chocan | El revisor lo marca; se fusiona primero el que desbloquea a otros y el otro se rebasa. |
| Tokens en rojo | Parar el loop, dejar el traspaso en `ESTADO.md` y avisar en `#bloqueos`. |
| Dos iteraciones sin avanzar | Parar y avisar a María Paula con el bloqueo concreto. |
| El 3D no rinde en celular el domingo a las 10:00 | Se decide en P3: queda el respaldo 2D con la interfaz v8. |
