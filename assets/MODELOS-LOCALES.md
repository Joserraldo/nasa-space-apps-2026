# Modelos locales (no están en el repositorio)

`ui/public/modelos-locales/` está en `.gitignore`. Ahí van modelos preparados a partir de packs cuya licencia
permite usarlos y modificarlos dentro de un juego, pero no repartir los archivos. Este repositorio es público:
subirlos sería redistribuirlos.

Si los archivos están, `ui/src/escena/activos/modelosColonia.ts` los carga y reemplazan a la pieza hecha en
código. Si no están, el juego se ve como antes. Nada falla por su ausencia.

## Procedencia

| Archivo local | Origen | Pieza que reemplaza |
|---|---|---|
| `casa.glb` | `fbx/Main_house.fbx` | hábitat central |
| `conexion.glb` | `fbx/Connecting_gateway.fbx` | tubos entre estaciones |
| `panel.glb` | `fbx/Solar_panel.fbx` | paneles junto a la mesa |

Pack: "Free Space Colony 3D Low Poly Models", Craftpix (`craftpix-net-169978`).
Licencia: Freebie de Craftpix, https://craftpix.net/file-licenses/ (leída el 2026-11-17):

- 2.1.2 se pueden modificar e incluir en juegos; 2.1.3 se pueden vender y distribuir juegos con ellos.
- "No attribution or link back to this site is required".
- 2.2.1 no se pueden revender ni redistribuir los archivos de arte ni versiones modificadas.

## Cómo se preparan

`assets/modelos-locales/exportar.py` (Blender 5.3, sin interfaz): aplica escala y giro, deja el pivote en el
centro de la huella sobre el suelo y separa la malla en materiales con nombre (`Casco`, `Acento`, `Grafito`,
`Oscuro`; en el panel, `Celdas` con UV 0..1). El GLB sale sin texturas: los colores y las celdas los pone el
juego.

    blender -b --factory-startup --python exportar.py -- <fbx> <salida.glb> <prefijo_miniatura> \
      --bandas "[3]*14+[1]*16+[2]*16+[0]*18" [--celdas]

`--bandas` es la fila de la paleta del pack (64 filas, de arriba abajo) a índice de material.

## Despliegue

El despliegue se construye desde el repositorio, así que no trae estos archivos. Para que el juego publicado
los muestre hay que copiarlos a `ui/public/modelos-locales/` en el paso de build, desde un origen privado.
Pendiente de decidir.
