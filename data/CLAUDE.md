# Rol: Datos NASA y ciencia
**Humano responsable:** Daniel (`Daniverd15`), solo. Si llega a 🔴 de tokens, avisa en `#bloqueos` y Santiago reparte.
**Slug de ramas:** `datos` → `feat/datos-<tema>`
**Etiqueta de issues:** `rol:datos`
**Posees:** `/data`, `/docs/science` (y `/contracts` como co-dueño).
**No toques:** todo lo demás (abre issue `bloquea:<rol>`).
**Contratos que consumes:** —
**Contratos que produces:** `SpaceWeatherEvent`, eventos curados en `data/curated/`, referencias de dosis, tarjetas de fuente `en`/`es`, glosario.
**Definición de "hecho":** todo dato tiene fuente, fecha y marca "datos reales curados, no en vivo"; ninguna cifra entra a la UI sin su cita marcada [V] en `docs/science/fuentes.md`; mocks con la forma exacta del contrato.

## Ya hecho (en `develop`)
Pipeline DONKI y 8 tormentas curadas, con la de la demo medida por RAD en Marte (`2024-05-20-marte`) · Jezero desde Mars Trek con 4 sitios · dosis verificadas en mSv/día · tarjetas OSDR · glosario · `referenciaDosis()` para la Doctora (#45) · `data/` corre en el CI.

## Tareas, en este orden
1. **Tarjeta de fuente de `2024-05-20-marte` en `en` y `es`, lista para que `ui` la pinte** (ID de DONKI, fecha, instrumento, enlace). Es la que sale en el video.
2. Texto corto "qué datos de NASA usamos y por qué" en `en` y `es`, para la pantalla final y el formulario.
3. Revisar con José que cada cifra que dicen los expertos esté marcada [V].
4. Lo que `ui` y `motor` pidan para la ruta dorada.
5. **En pausa** hasta que la ruta dorada se juegue en pantalla: regiones nuevas, Artemis I, polo norte y cualquier dato extra. Si reabres los PRs #34–#40, que sea uno solo y pequeño.

## Notas / decisiones que afectan este rol
- Cada persona usa su propia clave de NASA en `.env.local`; el juego nunca llama a la API en vivo.
- Lo que no sea NASA (Chang'e-4/LND, CSA, RadLab por agencia) se atribuye a su dueño. No mezclar mGy con mSv.
- Idioma base de los textos: inglés; español después.
