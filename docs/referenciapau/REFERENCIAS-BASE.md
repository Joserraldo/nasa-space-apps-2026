# Referencias reales para organizar una base marciana

**Frente C · C1 · consulta: 16 de noviembre de 2026**

Este documento separa instalaciones/análisis documentados de las decisiones de diseño de Solar Shield. Las instalaciones citadas son análogos en la Tierra; ninguna demuestra que exista una base humana en Marte ni prescribe una planta universal.

## 1. Información documentada

### CHAPEA y Mars Dune Alpha (NASA)

CHAPEA es una serie de misiones análogas de larga duración en las que cuatro tripulantes viven aislados en Mars Dune Alpha, un hábitat de 1.700 pies cuadrados construido mediante impresión 3D. NASA describe el propósito como estudiar factores de salud y desempeño de la tripulación durante misiones simuladas ([NASA, CHAPEA](https://www.nasa.gov/humans-in-space/chapea/); [NASA, recorrido de la primera misión](https://www.nasa.gov/missions/voyagers-of-mars-the-first-chapea-crews-yearlong-journey/)).

El resumen técnico de NASA enumera áreas internas para dormir, higiene, cocina y comedor, recreación, crecimiento de plantas, ejercicio, laboratorio/mantenimiento, teleoperación/control EVA y atención médica. También distingue el hábitat de los espacios de esclusa/nodo y de las áreas de EVA simulada ([NASA NTRS, *CHAPEA Facility Components*, pp. 10–11](https://ntrs.nasa.gov/api/citations/20220004484/downloads/Mars%20Habitats.pdf)). Es una descripción de esta instalación de investigación, no un estándar obligatorio para futuras bases.

### MDRS (Mars Society)

La Mars Desert Research Station es una instalación privada de investigación análoga en Utah, operada por Mars Society; sus campañas simulan operaciones marcianas y permiten estudios de campo y factores humanos ([MDRS, descripción oficial](https://reports.marssociety.org/)).

La descripción del campus distingue un hábitat con espacios de preparación para EVA, esclusas, higiene, cocina, dormitorios y área común; un GreenHab para cultivos; una cúpula de ciencia/control y laboratorio; observatorios; y un módulo de reparación/mantenimiento. Algunas estructuras se conectan al hábitat mediante túneles ([MDRS, Campus](https://reports.marssociety.org/)). Los equipos y disposición descritos corresponden a este análogo terrestre y pueden cambiar con el tiempo.

### Principios de diseño humano de NASA

NASA presenta su Center for Design and Space Architecture como un estudio conceptual centrado en las personas que combina arquitectura interior, arquitectura de misión, asignación funcional y evaluación de conceptos con prototipos y pruebas con personas ([NASA, Surface Habitats / CDSA](https://www.nasa.gov/reference/jsc-surface-habitats/)). Esta fuente respalda considerar tareas y circulación como parte del diseño; no prescribe la forma artística de la base de Solar Shield.

## 2. Propuesta conceptual frente a instalación construida

| Elemento | Qué se puede afirmar | Qué no se debe inferir |
| --- | --- | --- |
| Mars Dune Alpha | Hábitat análogo construido para investigación CHAPEA, con espacios funcionales separados según el resumen técnico NASA. | Que sea un asentamiento marciano, una arquitectura de vuelo certificada o el único esquema correcto. |
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

- Se verificaron las páginas enlazadas de NASA y MDRS, y el documento técnico de NASA NTRS.
- No se encontró en estas fuentes una planta universal de base marciana ni un requisito NASA que ordene energía a la izquierda, cúpula central, un anillo de caminos o un refugio abajo a la izquierda. Son decisiones de la lámina y del juego.
- No se verificaron dimensiones de la base ficticia de Solar Shield frente a un plano NASA: `exterior/03` es una ilustración conceptual del proyecto, no un plano a escala.
- La página de MDRS es una descripción del campus del análogo, no evidencia de que su configuración sea la configuración más reciente de todas sus instalaciones; confirmar con la Mars Society antes de reutilizar medidas concretas.

