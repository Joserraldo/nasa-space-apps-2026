# Referencias reales para organizar una base marciana

**Frente C · C1 · consulta: 16 de noviembre de 2026**

Este documento separa instalaciones/análisis documentados de las decisiones de diseño de Solar Shield. Las instalaciones citadas son análogos en la Tierra; ninguna demuestra que exista una base humana en Marte ni prescribe una planta universal.

## 1. Información documentada

### CHAPEA y Mars Dune Alpha (NASA)

CHAPEA es una serie de misiones análogas de larga duración en las que cuatro tripulantes viven aislados en Mars Dune Alpha, un hábitat de 1.700 pies cuadrados construido mediante impresión 3D. NASA describe el propósito como estudiar factores de salud y desempeño de la tripulación durante misiones simuladas ([NASA, CHAPEA](https://www.nasa.gov/humans-in-space/chapea/); [NASA, recorrido de la primera misión](https://www.nasa.gov/missions/voyagers-of-mars-the-first-chapea-crews-yearlong-journey/)).

El memorando técnico de NASA describe Mars Dune Alpha como un hábitat impreso en 3D de 1.700 pies cuadrados para cuatro tripulantes. Enumera dormitorios privados, cocina, áreas dedicadas a medicina, recreación, ejercicio, trabajo y cultivo, un área técnica y dos baños ([NASA/TM–20240011157, sección “Crew Health & Performance Exploration Analog (CHAPEA)”](https://ntrs.nasa.gov/api/citations/20240011157/downloads/NASA%20TM20240011157.pdf?attachment=true)). Esta descripción corresponde a la instalación análoga de investigación, no a un estándar obligatorio para futuras bases. La fuente NTRS titulada *CHAPEA Facility Components* se refiere a componentes del recinto y zonas simuladas de EVA alrededor del hábitat; no se usa aquí para afirmar la distribución interior.

### MDRS (Mars Society)

La Mars Desert Research Station es una instalación privada de investigación análoga en Utah, operada por Mars Society; sus campañas simulan operaciones marcianas y permiten estudios de campo y factores humanos ([MDRS, descripción oficial](https://reports.marssociety.org/)).

La descripción del campus distingue un hábitat con espacios de preparación para EVA, esclusas, higiene, cocina, dormitorios y área común; un GreenHab para cultivos; una cúpula de ciencia/control y laboratorio; observatorios; y un módulo de reparación/mantenimiento. Algunas estructuras se conectan al hábitat mediante túneles ([MDRS, Campus](https://reports.marssociety.org/)). Los equipos y disposición descritos corresponden a este análogo terrestre y pueden cambiar con el tiempo.

### Principios de diseño humano de NASA

NASA presenta su Center for Design and Space Architecture como un estudio conceptual centrado en las personas que combina arquitectura interior, arquitectura de misión, asignación funcional y evaluación de conceptos con prototipos y pruebas con personas ([NASA, Surface Habitats / CDSA](https://www.nasa.gov/reference/jsc-surface-habitats/)). Esta fuente respalda considerar tareas y circulación como parte del diseño; no prescribe la forma artística de la base de Solar Shield.

## 2. Propuesta conceptual frente a instalación construida

| Elemento | Qué se puede afirmar | Qué no se debe inferir |
| --- | --- | --- |
| Mars Dune Alpha | Hábitat análogo construido para investigación CHAPEA, con las áreas funcionales enumeradas en el memorando técnico NASA. | Que sea un asentamiento marciano, una arquitectura de vuelo certificada o el único esquema correcto. |
| MDRS | Campus análogo operativo con hábitat y edificios auxiliares para ciencia, cultivos, observación y mantenimiento. | Que todas las futuras misiones deban usar esos edificios, túneles o escala. |
| Diseños conceptuales NASA | NASA estudia conceptos de hábitat y arquitectura centrados en necesidades humanas mediante análisis y prototipos. | Que una ilustración conceptual sea especificación de misión o requisito real. |
| Base permanente en Marte | Las fuentes aquí consultadas describen simulaciones y conceptos de preparación. | Que las instalaciones citadas estén en Marte o que exista hoy una base humana allí. |

## 3. Lectura de la lámina de Solar Shield

La referencia canónica del proyecto es `referencias/exterior/03-exterior-organizacion.png`. La lámina representa una plataforma y nave en la parte superior izquierda; generación/almacenamiento de energía a la izquierda; una cúpula central enlazada por corredores; invernadero geodésico en la parte superior derecha; laboratorio y enfermería en el lado derecho; espacios comunes hacia abajo; refugio de regolito abajo a la izquierda; y caminos que articulan las estaciones.

La composición comunica una base modular: funciones especializadas rodean un núcleo, los recorridos visibles conectan edificios y los volúmenes distintos permiten reconocer su función. **Esta lectura es una interpretación artística de la lámina**, coherente con la separación funcional que aparece en los análogos, pero las posiciones, siluetas, colores y el anillo de circulación son decisiones visuales y de jugabilidad de Solar Shield, no datos geográficos ni requisitos publicados por NASA.

## 4. Aplicación propuesta a C2

1. Usar funciones y recorridos documentados (habitar, trabajar, atender salud, cultivar, mantener equipos y preparar EVA) para comprobar que cada zona de la composición tenga una razón legible.
2. Tratar el núcleo central y los edificios conectados como una **propuesta de juego** que facilita orientación y caminata; no etiquetarla como arquitectura oficial NASA.
3. Conservar las identidades y ubicaciones pedidas por la lámina `exterior/03`. La tabla de posiciones seguirá teniendo una sola fuente en `ui/src/escena/mundo.ts`; no duplicar coordenadas ni inventar `LugarId`.
4. Coordinar dimensiones y colisiones con el Frente D, y pedir aprobación de fidelidad al Frente F antes de considerar C2 listo para fusión.

Estas razones apoyan el análisis funcional de la distribución, pero no sustituyen una revisión de distancias, recorridos, colisiones o composición visual durante C2.

## 5. Límites de verificación

- Se abrieron las dos páginas NASA citadas para CHAPEA y el registro técnico NASA/TM–20240011157; las fuentes confirman cuatro tripulantes y 1.700 pies cuadrados. También se abrió la descripción del campus MDRS. La ficha NTRS *CHAPEA Facility Components* se revisó y quedó acotada a las zonas del recinto/EVA, sin atribuirle áreas interiores.
- No se encontró en estas fuentes una planta universal de base marciana ni un requisito NASA que ordene energía a la izquierda, cúpula central, un anillo de caminos o un refugio abajo a la izquierda. Son decisiones de la lámina y del juego.
- No se verificaron dimensiones de la base ficticia de Solar Shield frente a un plano NASA: `exterior/03` es una ilustración conceptual del proyecto, no un plano a escala.
- La página de MDRS es una descripción del campus del análogo, no evidencia de que su configuración sea la configuración más reciente de todas sus instalaciones; confirmar con la Mars Society antes de reutilizar medidas concretas.

