# B4 — datos para D y la tripulación

Consulta: 15 de noviembre de 2026 (America/Bogota). `[V]`: contenido leído en la fuente primaria NASA.
No se hereda como verificada una fecha futura del prompt. Catálogo estático: nunca «en vivo».
`curiosidadMarte(momento, vistos)` devuelve diálogo, fuente e id; la pantalla guarda los ids vistos.
D dispara `atardecer`, `remolino`, `lunas` y `polvo` solo si el fenómeno aparece en su ambiente.
A/E pueden disparar llegada, oxígeno, radiación, telemetría, hábitat y suelo en el contexto apropiado.
No se afirma que un análogo esté en Marte ni que el medidor del juego sea una medición NASA.

| Dato | Quién / momento | Evidencia de la fuente | Estado y enlace |
| --- | --- | --- | --- |
| sol (propiedad) | ia_base / llegada | Orbit and Rotation: 24.6 hours; Martian days are called sols. | [V] [NASA](https://science.nasa.gov/mars/facts/) |
| azul (observacion) | meteorologa / atardecer | Fine dust lets blue light pass more efficiently near sunset. | [V] [NASA](https://science.nasa.gov/solar-system/planets/mars/what-does-a-sunrise-sunset-look-like-on-mars/) |
| remolino (observacion) | meteorologa / remolino | MRO image in Nili Fossae: dust devil tracks. | [V] [NASA](https://science.nasa.gov/resource/dust-devils-on-mars/) |
| lunas (propiedad) | meteorologa / lunas | Moons: two small moons, Phobos and Deimos. | [V] [NASA](https://science.nasa.gov/mars/facts/) |
| polvo (observacion) | meteorologa / polvo | A global dust storm enshrouded Mars in 2018. | [V] [NASA](https://science.nasa.gov/solar-system/planets/mars/10-things-dust-in-the-wind-on-mars-and-well-beyond/) |
| moxie (tecnologia) | ingeniera / oxigeno | MOXIE collected atmospheric carbon dioxide and produced oxygen; technology demonstration. | [V] [NASA](https://www.nasa.gov/space-technology-mission-directorate/tdm/mars-oxygen-in-situ-resource-utilization-experiment-moxie/) |
| rad (observacion) | doctora / radiacion | May 20 2024: RAD measured a sharp increase in radiation at the Martian surface. | [V] [NASA](https://science.nasa.gov/resource/curiosity-sees-streaks-and-specks-during-2024-solar-storm/) |
| senal (propiedad) | ia_base / telemetria | Communications delay: light-time depends on the distance between Earth and Mars. | [V] [NASA](https://www.nasa.gov/wp-content/uploads/2024/01/mars-communications-disruption-and-delay.pdf) |
| analogo (analogo) | ingeniera / habitat | CHAPEA: 3D-printed structure simulates a Mars habitat on Earth. | [V] [NASA](https://www.nasa.gov/humans-in-space/chapea/habitat/) |
| rojo (propiedad) | meteorologa / suelo | Namesake and Surface: oxidization of iron in rocks, regolith and dust causes red color. | [V] [NASA](https://science.nasa.gov/mars/facts/) |

La comparación polvo/tormenta solar es una distinción de ciencia: el fenómeno de polvo no sustituye al evento de partículas.
Pruebas verifican cardinalidad, claves, fuentes válidas y no repetición; no verifican por sí mismas la ciencia.
Integración visual pendiente de D/A/E. No se presenta este catálogo como diez momentos ya jugados.
