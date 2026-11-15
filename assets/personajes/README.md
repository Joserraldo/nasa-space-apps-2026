# Tripulación procedural y animaciones

Base única: implementación nueva de Claude en `ui/src/escena/personajes/`. Los pilotos anteriores de Codex se retiraron y no forman parte de esta entrega.

## Uso

```ts
import { crearPersonaje, crearIris, animar } from "../../ui/src/escena/personajes/index.js";
const personaje = crearPersonaje("ingeniera"); // Variante B por defecto
const iris = crearIris(); // Iris B por defecto
// Añadir personaje.grupo e iris.grupo al renderer de la escena.
animar(personaje, "caminar", segundos, { quieto: movimientoReducido });
iris.animar(segundos, { velocidad: 0.9, quieto: movimientoReducido });
personaje.liberar();
iris.liberar();
```

Identidades: `ingeniera`, `doctora`, `meteorologa`, `nino`. Cada humano usa una SkinnedMesh, un rostro intercambiable y un visor: tres llamadas de dibujo; Iris usa dos. Las extremidades tienen huesos en hombro, codo, muñeca, cadera, rodilla y tobillo. Los materiales compartidos no se liberan al retirar una instancia; sí sus geometrías y esqueleto.

## Gestos del rol

- Niño: reposo, caminar, saludar, inspeccionar, arrodillarse, hablar.
- Ingeniera: reposo, caminar, explicar, inspeccionar, reparar, confirmar.
- Doctora: reposo, caminar, escuchar, explicar, verificar, tranquilizar.
- Meteoróloga: reposo, caminar, observar, explicar, alertar, verificar.
- Iris: caras atenta/feliz/pensando/parpadeo/error/apagada; ruedas por velocidad y señal de avería.

Inspeccionar/verificar muestran tableta; reparar muestra llave en Ingeniera; observar muestra catalejo en Meteoróloga. Son accesorios rígidos ligados a la mano, sin llamadas extra. Las posturas específicas son aproximaciones procedurales de las láminas, no captura de movimiento.

## Revisar

`npm run dev -w ui -- --port 5185`

- `/personajes.html`: cuatro humanos e Iris, frente/perfil/espalda.
- `/personajes.html?p=nino&modo=gestos&vivo=1`: gestos del niño en movimiento.
- `/personajes.html?p=ingeniera&modo=caras`: ocho expresiones.
- `/personajes.html?p=meteorologa&modo=gestos&vivo=1`: gestos de la Meteoróloga.
- `/personajes.html?p=iris&vivo=1`: Iris normal/averiada.

`animar` recibe tiempo absoluto en segundos. `quieto` fija una pose y detiene variaciones temporales, incluida marcha y ruedas. La vista previa es una herramienta local: no incorpora textos al producto.

## Validación

- `npm run typecheck`: pasa.
- `npm test`: 96 archivos, 690 pruebas pasan; 22 pruebas del módulo de personajes.
- `npm run build -w ui`: pasa, con aviso existente de chunk mayor de 500 kB.
- `npm run e2e`: 1 ruta dorada pasa.
- Chromium: hojas de gestos e Iris sin errores JS; humanos 3 calls y menos de 3000 tris; Iris 2 calls. Los contadores de la hoja corresponden a una celda, no al coste sumado de todas las cámaras.

Capturas de Claude `*-08.png` preservadas y capturas nuevas `*-pr.png` publicadas en la rama `evidencias/capturas`, carpeta `assets/personajes-entrega/` (fuera de este PR de código). Referencias canónicas: `docs/referenciapau/referencias/personajes/00–10` y `mundo/01`.

## Ficha de fidelidad y límites

Silueta: anatomía y proporciones propias por identidad, collar, guantes, botas, mochila y acentos de la familia. Se conserva exactamente la base visual elegida por María Paula. No se declara semejanza exacta ni aprobación artística de las láminas. Posturas de manos, herramientas y rodilla de apoyo requieren revisión visual en contexto.

Material: paleta centralizada en `fichas.ts`, cuerpo con zonas de color y visor translúcido separado. No GLB, Blender ni servicios generativos. Los colores deberán conciliarse con los slots/tokens de integración si el equipo exige un único material de entorno.

La escena y su integración corresponden exclusivamente a José y quedan fuera de esta entrega de personajes. No se modifican `armado.ts` ni `escena3d.ts`. No altera motor, recursos ni contratos compartidos. Revisar alternativas anteriores #261/#263 antes de integrarlas para evitar duplicados.

Subida única: la entrega supera el tamaño orientativo de 300 líneas porque incluye la implementación compartida nueva de toda la tripulación. Se deja como borrador para revisión por módulos; no se marca ese requisito como cumplido.

## Evidencias publicadas

Nueve PNG, 3302753 bytes (3.15 MiB). Están fuera del PR de código; el manifiesto contiene tamaños y SHA-256.

- [todos-08.png](https://github.com/Joserraldo/nasa-space-apps-2026/blob/b3867eccea3c14aa385cd65dd7ec603488e4e11c/assets/personajes-entrega/todos-08.png)
- [gestos-ingeniera-pr.png](https://github.com/Joserraldo/nasa-space-apps-2026/blob/b3867eccea3c14aa385cd65dd7ec603488e4e11c/assets/personajes-entrega/gestos-ingeniera-pr.png)
- [gestos-meteorologa-pr.png](https://github.com/Joserraldo/nasa-space-apps-2026/blob/b3867eccea3c14aa385cd65dd7ec603488e4e11c/assets/personajes-entrega/gestos-meteorologa-pr.png)
- [gestos-nino-pr.png](https://github.com/Joserraldo/nasa-space-apps-2026/blob/b3867eccea3c14aa385cd65dd7ec603488e4e11c/assets/personajes-entrega/gestos-nino-pr.png)
- [iris-pr.png](https://github.com/Joserraldo/nasa-space-apps-2026/blob/b3867eccea3c14aa385cd65dd7ec603488e4e11c/assets/personajes-entrega/iris-pr.png)
- [manifest.json](https://github.com/Joserraldo/nasa-space-apps-2026/blob/b3867eccea3c14aa385cd65dd7ec603488e4e11c/assets/personajes-entrega/manifest.json)

La implementación elegida por María Paula es esta. #261 y #263 son alternativas solapadas: no deben fusionarse junto con esta versión. Este PR no modifica ni cierra esas ramas ajenas.

## Construcción en superficie cerrada (variante B en uso, variante A retirada)

Los cuatro tripulantes e Iris usan únicamente la construcción de superficies cerradas (`superficie.ts`); la versión inicial de triángulos sueltos y las hojas A/B temporales se retiraron tras la aprobación visual en #316.

- `crearPersonaje(id)` en `ui/src/escena/personajes/personaje.ts`: traje (`cuerpo.ts`) y cabeza (`cabeza.ts`) son superficies cerradas de vértices compartidos (`superficie.ts`), con pesos mezclados en codos y rodillas. Rostro en `rostro.ts`: ocho expresiones proyectadas sobre la piel y ajustes por personaje (`gestos`, `irisEscala`, `parpado`, `cejaGrosor`).
- `crearIris()` en `ui/src/escena/personajes/iris.ts`: chasis en una superficie cerrada, seis caras de pantalla, ruedas por velocidad, señal de avería y paneles laterales plegables (`animar(t, { paneles: 0..1 })`).
- Hoja de revisión única: `/personajes.html` (`?p=nino|doctora|meteorologa|ingeniera|iris`, `&modo=caras|gestos`, `&vivo=1`).
- Capturas en `assets/personajes/capturas/<personaje>-b/`, hechas con `herramientas/capturar.mjs`.
- Coste medido en la hoja: humanos 3 llamadas y 3446 a 3791 triángulos; Iris 2 llamadas y 1448 triángulos.
