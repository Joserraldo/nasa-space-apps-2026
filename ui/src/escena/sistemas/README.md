# Sistemas de la escena

Cada archivo `.ts` de esta carpeta se monta solo en la escena del exterior (`escena3d.ts`,
`sistemasAutomaticos`). Un archivo por sistema y un dueño por archivo (PLAN-JUGABILIDAD §3): no hace
falta editar `escena3d.ts` ni `EscenaBase.tsx`.

```ts
// escena/sistemas/marcadores.ts (frente C)
import type { SistemaEscena } from "../escena3d";

export function crearSistema(): SistemaEscena {
  return {
    id: "marcadores",
    montar(ctx) { /* agregar mallas a ctx.escena */ },
    actualizar(dt, ctx) { /* leer ctx.pedido.objetivo, ctx.jugador, ctx.camara */ },
    dispose() { /* quitar y liberar lo propio, no los materiales compartidos */ },
  };
}
```

- `actualizar` corre en cada fotograma después de la cámara y antes del render. Sin estado de React.
- Nada de lo que hace un sistema da o quita recursos (MECANICAS §5).
- Si un sistema lanza, la escena lo desmonta y sigue.
- Para prototipar sin montarlo en el juego: `crearEscena3D(canvas, { sistemas: [miSistema] })` en
  `vistaPrevia.ts`. Los `*.test.ts` de esta carpeta no se montan.
