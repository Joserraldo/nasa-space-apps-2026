# Encargo: exterior de la colonia (T3.2 a T3.5), por lotes

## 0. Dónde se trabaja

- Carpeta `C:\Users\mpaul\Documents\colonia-marte-visual-ext`, rama **`ws3-exterior`**. Sale de `ws4-interior-kit` @ `51ff297`, así que tiene todas las salas, el suelo granate y el piloto exterior.
- `npm install`. Servidor en el puerto **5194**: `npx vite --host 127.0.0.1 --port 5194 --strictPort`.
- **Esta rama es dueña solo del exterior:**
  - `src/kit/pieces/mars/`
  - `data/layouts/colonies/`
  - `src/scenes/exterior-pilot.ts`
  - las piezas nuevas que se registren.
- No se tocan las salas interiores (`src/kit/pieces/station/`, `data/layouts/rooms/`), que siguen en `ws4-interior-kit` con Carbon.
- Commits convencionales, sin atribución de IA. Sin emojis. Código y comentarios en inglés.
- Antes de empezar, leer:
  - `docs/INVENTARIO.md` §1 a §3, con la ficha de cada pieza;
  - `docs/ESPECIFICACION-TECNICA.md` §7.3 y §7.4 (presupuesto y técnicas obligatorias);
  - `docs/restricciones-visuales.md`;
  - `docs/DISENO-JUEGO.md` §3.3 (intro) y §4 (capítulos);
  - cómo están hechas las piezas exteriores existentes en `src/kit/pieces/mars/`.

## 1. Lo que ya está aprobado y no se cambia

Medido o aprobado por María Paula (`docs/restricciones-visuales.md`):

- Los edificios van en blanco y gris claro, con gris oscuro y emisivos cian. **Nada de ocre ni beige** (rechazado el 2026-11-25).
- Las cápsulas `MB-01` y el domo `MB-04` llevan **vidrio** (`M_glass`) con el interior visible, **sin emisivos**: ni ventanas encendidas ni bordes luminosos (aprobado).
- Suelo granate `DV-07` con saturación de 0.22 a 0.32 en la vista de juego (`s4-exterior-ojos.jpg`). No se toca.
- Hay detalle de infraestructura: tuberías con anillos cian, válvulas, rejillas, ventanas cian en los túneles. Lo plano y uniforme fue rechazado.

## 2. Reglas técnicas (cada una es motivo de rechazo)

1. Solo piezas del registro, con su ID del inventario y sus parámetros tipados. Pasan `npm run validate:pieces`.
2. Solo materiales de la paleta compartida, sin materiales propios. Colores que viven en `palette.json`.
3. **Presupuesto (§7.3): el exterior ya está en 262 draw calls y el máximo es 300.** Antes de agregar piezas hay que aplicar §7.4:
   - `InstancedMesh` o `BatchedMesh` para todo lo que se repite más de 3 veces (postes, balizas, rocas, cápsulas);
   - fusión de lo estático por edificio;
   - `THREE.LOD` de 3 niveles en edificios y vehículos.

   La meta es **terminar cada lote en 200 draw calls o menos** en `/exterior-pilot?view=1`, y nunca pasar de 300. Los triángulos se mantienen por debajo de 800.000. Se mide con el overlay y se anota en el informe.
4. **Vehículos:** las ruedas son hijas que giran sobre su propio eje (T3.4). Va un test que lo comprueba.
5. Una captura por pieza o grupo, **junto a su referencia** (`docs/referencias/v3/...` según la ficha del inventario), con el mismo formato de las capturas de Carbon (`docs/capturas/t52-*.jpg`).
6. **Brillo:** el brillo medio de la captura queda dentro de ±15 del de su referencia, con un máximo de 25 % de píxeles con luminancia menor a 50 (regla del 2026-11-26).
7. Antes de cada commit: `npm run build`, `npx tsc --noEmit`, `npx vitest run` y `npm run validate:pieces` en salida 0. Además, abrir `/exterior-pilot` en Chromium con ventana visible y sin errores de consola. Los shaders ya fallaron una vez en el navegador aunque los tests pasaban.

## 3. Lotes (en orden; un commit por pieza)

### Lote 1: la intro y la llegada a Jezero

1. **`MV-09` nave de tránsito (exterior):** cuerpo modular, anillo habitable y paneles. Es la toma 1 de la intro (`DISENO-JUEGO.md` §3.3: "La Tierra pequeña y azul; una nave se aleja"). Hace falta una escena `/space` con el preset `AMB-01` (espacio), la nave y **una Tierra pequeña y azul** de fondo. Si `AMB-01` no tiene la Tierra, se agrega como pieza de fondo con su ID.
2. **`MI-07` plataforma de aterrizaje octogonal con escalera**, colocada en el piloto exterior.

**Pausar después de `MV-09` y `MI-07`** con el informe `docs/capturas/exterior-t3-informe.md`, que tiene las secciones VERIFICADO, NO VERIFICADO y el presupuesto medido, para la revisión de María Paula. La nave define el estilo de todos los vehículos, por eso se revisa primero.

3. `NX-02` luces de borde de la pista (balizas en serie, instanciadas).
4. `NX-04` entrada de esclusa en la fachada (módulo con `NW-05-A`), donde la colonia conecta con el interior.

### Lote 2: la colonia viva (C2 y C3)

`MI-01` calle con línea LED discontinua, `MI-02` poste de luz (instanciado), `MB-11` invernadero largo con techo de vidrio (el capítulo C3 pasa ahí), `MB-05` domo de estructura abierta con vidrio, `MI-10` tanque de combustible horizontal, `MB-09` torre de mando circular, `MB-08` bloque residencial de módulos apilados.

### Lote 3: la tormenta y el rescate (C4)

`MV-01` camión rover de 6 ruedas, `MV-03` buggy 4x4 con luces cian, **`MV-11` rover varado** (6 ruedas, paneles cubiertos de polvo; es el que se rescata en C4), `NX-01` estacionamiento y garaje con bahías, `NX-03` huellas de rover en el terreno (decal o ranura en el shader, sin romper el suelo aprobado).

### Lote 4: el final y lo opcional

`MV-10` nave de las familias (variante de `MV-09`, con más módulos y luces de aterrizaje), `MB-06` biodomo de vidrio con árbol, `MB-12` pasillo circular alrededor de un hub, `MB-13` edificio industrial con número pintado, `MB-14` torre de control, y las naves civiles `MV-05`, `MV-06` y `MV-07`.

**Fuera de alcance** salvo que María Paula los pida: `MI-08` torreta defensiva, `MV-02` blindado, `MV-04` caza y `MV-08` mech con lanzamisiles. Es una colonia civil en un juego educativo para niños de 7 a 10 años; las armas no aportan a ningún capítulo.

## 4. Pausas y entrega

- Pausar después de `MV-09` y `MI-07` (lote 1), y después al terminar cada lote, con el informe actualizado y las capturas.
- El informe lleva, por pieza: ID, triángulos por nivel de LOD, captura junto a su referencia, brillo y porcentaje de píxeles oscuros. Por lote: draw calls y triángulos de `/exterior-pilot?view=1` y `?view=2`, antes y después.
