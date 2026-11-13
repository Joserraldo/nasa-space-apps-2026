# Revisión científica de los textos de los expertos (rol datos → agentes)

**Revisado:** 2026-11-13, sobre `docs/ideas/agentes.md` (PR #24). Es una sugerencia: los textos los decide agentes. Las cifras citadas están verificadas en `docs/science/fuentes.md`.

## Lo que está bien
- *Dosis* = "como el sol en la piel: poquito no pasa nada, mucho rato quema". Buena analogía: la dosis se acumula con el tiempo.
- *Microgravedad* = "como estar siempre en la bajada de la montaña rusa". Correcta (caída libre).
- `ir_al_refugio` ante una tormenta: es lo que se planea para astronautas. Bien.
- La falla 4 de la IA ("apaga el blindaje para ahorrar") enseña bien a verificar.

## Lo que conviene ajustar
| Dónde | Problema | Sugerencia (es / en) |
|---|---|---|
| *Llamarada* = "un estornudo de luz del Sol" | Bien para el destello, pero el niño puede creer que el destello es lo que llega a la base. Lo que viaja días es la **nube** (CME); las partículas rápidas llegan antes | "El destello es luz; la nube de partículas viene después, y esa es la que hay que esperar con el escudo." / "The flash is light; the particle cloud comes later, and that's the one to wait for with the shield." |
| Microgravedad en una base en Marte | En la superficie de Marte **no** hay microgravedad: la gravedad es el **38 %** de la de la Tierra (0,380 [V], NASA NSSDC). Microgravedad es en la nave o en la ISS | Usarla solo en la fase de nave/satélite. En la base: "En Marte pesas como un tercio de lo que pesas en la Tierra." / "On Mars you weigh about a third of what you weigh on Earth." |
| Frase de eval 9: "me duele la cabeza al astronauta" → `estado_salud` | Bien como intención, pero la Doctora **no** debe atribuir síntomas leves a la radiación (solo dosis muy altas causan síntomas) | Plantilla neutra: "Vamos a revisarlo. La radiación no se siente; por eso la medimos con el dosímetro." / "Let's check. You can't feel radiation; that's why we measure it with the dosimeter." |
| La Meteoróloga y el "Kp" | El Kp mide la Tierra, no Marte | En Marte no decir "Kp". Usar `marcoMarte`: **observado** → "Curiosity midió la subida"; **modelado** → "el modelo calcula que llega en X horas (es un cálculo)"; **escenario** → "pasó cerca de la Tierra; imaginamos que llega" |
| `pronostico` | Los datos son históricos curados, no en vivo | No decir "ahora mismo en el Sol". Sí decir "esta tormenta real pasó el <fecha>" con la tarjeta de fuente |
| `explicar_dosis` | No mezclar unidades | Dosis para personas en **mSv/día** (`radiacion`). Lo que mide un detector en una tormenta, en **µGy/h** (`medicionMarte`). Nunca convertir uno en otro |

## Textos listos para reutilizar (ya están en `data/i18n`, es/en)
- Glosario: `datos.glosario.<palabra>.palabra` y `.def` (19 palabras: destello, nube solar, partículas energéticas, dosis, blindaje, modelo, medición…).
- Marco de la tormenta: `datos.marco.observado | modelado | escenario | rozando`.
- Medición en Marte: `datos.medicion.rad`, `datos.medicion.sinAumento`.
- Dosis comparadas: `datos.radiacion.comparacion`. Polo norte: `datos.region.marte_polo_norte.descripcion`. Artemis I: `datos.artemis.texto`.

## Cifras que dicen los expertos (ruta dorada, #41) — revisado el 2026-11-13 sobre #44, #47 y #49
| Texto | Cifra | Origen | Estado |
|---|---|---|---|
| `agentes.escena6.doctora.medida`, `agentes.meteorologa.pronostico.medida` | factor ×19 (redondeo de 19,4) | `medicionMarte` de `2024-05-20-marte` (RAD vía RadLab) | **[V]** |
| `agentes.escena6.meteorologa.llega`, `agentes.meteorologa.pronostico.real` | fecha 2024-05-20 | `inicio` del evento (DONKI `2024-05-20T05:36:00-CME-001`) | **[V]** |
| `agentes.doctora.dosis.marte` | 0,64 mSv/día | `referenciaDosis("marte-superficie")` (Reitz et al. 2016) | **[V]**; usar la función del #45 para la tarjeta |
| `agentes.escena6.ingeniera.costo`, `agentes.iris.*`, `agentes.ingeniera.energia.*` | % de energía y escudo, gasto | estado del juego (motor/design) | No es dato de NASA: no lleva tarjeta de fuente (correcto) |
| `agentes.doctora.salud.estado` | mSv acumulados del tripulante | estado del juego | Es simulación: no presentarlo como medición |

## Fase satélite (#52) — revisado el 2026-11-13
| Texto | Revisión |
|---|---|
| `agentes.satelite.ingeniera.bateriaBaja` ("en la sombra del planeta los paneles no cargan") | Correcto: cuando el satélite pasa por la sombra, los paneles no reciben luz |
| `agentes.satelite.meteorologa.senal` ("un mensaje tarda minutos") | Correcto: 3–22 min en un sentido [V+cálculo]. Para la cifra, usar `datos.comunicaciones.retraso` (#65) |
| `agentes.satelite.doctora.microgravedad` | Correcto: en órbita hay caída libre. Se usa en la fase de nave/satélite, no en la base (en Marte la gravedad es el 38 %) |
| `agentes.satelite.ingeniera.altura`, `agentes.satelite.meteorologa.tormenta` | Analogía y regla de juego: no son cifras de NASA, no llevan tarjeta |
