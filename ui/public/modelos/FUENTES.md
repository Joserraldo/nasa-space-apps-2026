# Sources of 3D models

| File | Source | License / credit |
|---|---|---|
| `antena-tall-dish.glb` | NASA 3D Resources, "Tall Dish" (dish, post and turntable), https://science.nasa.gov/3d-resources/ | NASA media, not copyrighted. Credit: NASA. No NASA insignia or logo is used, and the game is not endorsed by NASA. |
| `panel-solar.glb` | Craftpix, "Space Colony" kit, `Solar_panel.fbx`, https://craftpix.net/ | Craftpix license: use in projects allowed, credit not required. |

Processing (2026-11-17, Blender 5.3, `ui/scripts/modelos/construir_modelos.py`):

- Tall Dish: the three parts joined, the dish decimated to 40 % (budget: 6,102 triangles in total), tilted 35 degrees, scaled to 5 m high. Its DDS texture is not embedded in the GLB, so it uses a plain material. The footing, relay mast and red light are drawn in code (`ui/src/escena/activos/modelosModulos.ts`).
- Solar panel: the Craftpix palette replaced by three materials (cells, frame, dark parts), chosen by the UV band of each face. Scaled to 0.7 (2.9 m high, 2,588 triangles). Dust on the cells is a material change in code, not a texture.

The NASA Habitat Demonstration Unit was tried for the habitat and dropped (it did not read as a shelter from the start camera); it is not shipped.
