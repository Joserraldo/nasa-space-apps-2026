# Orquestación

Este archivo debe bastar para que otra sesión (u otro humano) retome la coordinación sin el chat original. Lo mantiene el orquestador (`infra`, Santiago Cabeza). **Suplente del orquestador:** Jaime (`JaimeMrF`).

**Actualizado:** 13 nov 2026 (víspera, FASE 0: solo documentos).

## Resumen

- **Reto:** Build a Junior Astronaut Mission Trainer. **Juego:** Solar Shield (IA de la base: Iris).
- **Roles:** `infra` Santiago · `motor` (+diseño) Jaime · `mecanicas` María Paula · `agentes` José · `datos` Daniel · `ui` Camilo. Tabla completa en el [README](../README.md).
- **Ramas:** `feat/<slug>-<tema>` desde `develop`; PRs < ~300 líneas hacia `develop`; el merge lo hace un humano distinto del autor.
- **Contratos:** `/contracts` está vacío. El sábado se abren `GameState`, `Action`, `Seed`, `SpaceWeatherEvent` y `ClassifierOutput` (dueños: motor, agentes, datos).
- **Canal:** issues, PRs, `ESTADO.md` de cada carpeta y `docs/decisiones/`. Discord para lo humano (`#bloqueos`, `#decisiones`).
- **Herramientas:** Claude Code, OpenCode y Codex, cada quien con su suscripción. Modelos por tarea en [modelos.md](modelos.md).

## Calendario y puertas

| Puerta | Cuándo | Cumple cuando |
|---|---|---|
| P1 Contratos + esqueleto | Sáb 14, 12:00 | Todos compilan contra `/contracts`; link vivo en Cloudflare; mocks disponibles |
| P2 Rebanada vertical | Sáb 14, 22:00 | Misión completa en Marte, 3 expertos, Iris 1–3, 1 tormenta real, cadena de causas; e2e de la semilla dorada en CI y desplegado |
| P3 Variabilidad | Dom 15, 11:00 | Dos semillas dan escenarios distintos; 3D con respaldo 2D probado, o recortado a 2D |
| P4 Congelamiento | Dom 15, 13:00 | Solo arreglos |
| P5 Entrega | Dom 15, 20:00 | Formulario enviado (cierra 23:59) |

Regla de corte si P2 no se cumple: Luna → Atlas → desbloqueos → 3D completo → dibujo de ruta en 3D → niveles adaptativos extra. El orquestador propone el momento y Santiago confirma.

## Semáforo

motor ⚪ · mecanicas ⚪ · agentes ⚪ · datos ⚪ · ui ⚪ · infra 🟢 (⚪ = sin empezar: es FASE 0)

**Próximo hito:** sábado 9:00, un humano cambia `CLAUDE.md` a FASE 1.

## Ruta dorada (propuesta, sin aprobar)

Semilla fija de demo, ~2 min, completa en ES y EN. Se convierte en issue `p0` para todos el sábado.

1. La nave suelta el satélite.
2. El niño dibuja la ruta sobre Jezero y ve bajar Batería y Señal.
3. Aparecen 3 sitios con sus 3 criterios; elige uno con costo visible.
4. Aterriza y coloca 2 módulos; cada uno mueve 2 medidores.
5. Llega una tormenta DONKI real, con pausa y tarjeta de fuente (ID y fecha).
6. Iris, dañada, da un número que no coincide con el medidor y sugiere apagar el escudo.
7. El niño consulta a la Doctora o a la Ingeniera, decide y envía telemetría.
8. Cadena de causas (decisión vs. mala suerte) y tarjeta de ciencia.

## Riesgos abiertos

1. **Información oficial sin confirmar:** Guía de Entrega, política de IA, licencia, criterios de juicio, formato del video, idioma, repo público o no, jurado local. Ver [reglas.md](reglas.md).
2. **3D en celular y PC viejo:** validar un cubo 3D en ambos antes de invertir en arte. El 2D se construye primero y es el respaldo.
3. **Datos sin probar:** ningún ID de DONKI se ha verificado con una llamada real; varias cifras de [science/fuentes.md](science/fuentes.md) siguen NO VERIFICADAS.
4. **Iris que falla** necesita guion y pruebas, no solo código (agentes + mecanicas).
5. **Límites de tokens desconocidos:** falta el inventario de [modelos.md](modelos.md).
6. **Retraso de comunicaciones:** el enunciado oficial lo nombra entre las decisiones del objetivo y en el plan estaba en la Capa 2. Decidir cómo aparece en la ruta dorada (ver [reglas.md](reglas.md)).
7. **Jaime es suplente del orquestador y dueño de `motor`**, el rol del que dependen todos los demás.

## Pendientes de documentos (no los toca `infra` sin su dueño)

- `design/CLAUDE.md` pone la rebanada vertical en "Luna polo sur"; lo decidido es Marte/Jezero. Además `design/` y `missions/` ya tienen dueños distintos.
- `ui/CLAUDE.md` tiene las tareas de arranque bajo "Fase 0" y la sección de arranque vacía.
- `missions/` y `tests/` no tienen `CLAUDE.md` ni `ESTADO.md` para el rol `mecanicas`.
- Los `CLAUDE.md` de carpeta dicen "Humano responsable: por asignar".
- PLAN §2.6 (dificultad elegible, turnos) y §13 (sin Three.js) no reflejan las decisiones del 13 nov. La guía de agentes dice "~48 h"; son ~36.
- Faltan los `docs/decisiones/D*.md` de lo decidido el 13 nov; los issues D1–D11 siguen abiertos.
- Faltan las etiquetas `rol:mecanicas` y `bloquea:mecanicas`, y no existe `.claude/settings.json` (plantilla en `infra/`).

## Necesito de un humano

- Pegar el texto de la Guía de Entrega, el FAQ y los criterios de juicio; preguntar al organizador local por el pitch.
- Inventario de herramientas y modelos por persona.
- Nombrar suplente del orquestador y narrador del video.
- Cuentas de Cloudflare y del proveedor del clasificador, con tope de gasto.
- Confirmar las consecuencias graduadas y el subtítulo de "Solar Shield".
