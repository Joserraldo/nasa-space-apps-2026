# Sources of 3D models

| File | Source | License / credit |
|---|---|---|
| `antena-tall-dish.glb` | NASA 3D Resources, "Tall Dish" (dish, post and turntable), https://science.nasa.gov/3d-resources/ | NASA media, not copyrighted. Credit: NASA. No NASA insignia or logo is used, and the game is not endorsed by NASA. |
| `ingenuity.glb` | NASA 3D Resources, "Ingenuity Mars Helicopter", https://science.nasa.gov/3d-resources/ | NASA media, not copyrighted. Credit: NASA/JPL-Caltech. No NASA insignia or logo is used. Modified (see below). |
| `habitat-domo.glb` | Sketchfab | This work is based on "Medium Low Poly Habitat" (https://sketchfab.com/3d-models/medium-low-poly-habitat-1cc7fefbea1841d091a7468564e96853) by Jason_Phillips (https://sketchfab.com/Jason_Phillips) licensed under CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/). Modified: scaled. |
| `torre-comunicaciones.glb` | Sketchfab | This work is based on "Low Poly Antenna Habitat" (https://sketchfab.com/3d-models/low-poly-antenna-habitat-901d3c3397594e0aa8e347a1eacf7f7a) by Jason_Phillips (https://sketchfab.com/Jason_Phillips) licensed under CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/). Modified: scaled. |
| `reciclador-agua.glb` | Sketchfab | This work is based on "Mars Science Station Low Poly" (https://sketchfab.com/3d-models/mars-science-station-low-poly-808afc037a254494a040d409b0bf3d70) by anton.engdahl (https://sketchfab.com/anton.engdahl) licensed under CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/). Modified: scaled, materials merged into vertex colors, dark tank caps recolored blue. |
| `capsula-llegada.glb` | Sketchfab | This work is based on "Low Poly Astronaut and Crew Module" (https://sketchfab.com/3d-models/low-poly-astronaut-and-crew-module-5906dfa74d3242989350970240510702) by MauricioPB (https://sketchfab.com/mauriciopb1111) licensed under CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/). Modified: astronaut removed, scaled, materials merged into vertex colors. |
| `tripulante-caminando.glb` | Sketchfab | This work is based on "Moon Walk" (https://sketchfab.com/3d-models/moon-walk-4a6955a4df8449b5af8ef4c3cd9d0e03) by EvgenyS (https://sketchfab.com/EvgenyS) licensed under CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/). Not modified (file copied as downloaded). |
| `quaternius.glb` | Quaternius, "Ultimate Space Kit" (Rover, SolarPanel_Ground, Roof_Antenna, Roof_Radar, Ramp, MetalSupport, House_Long, House_Cylinder), https://quaternius.com/packs/ultimatespacekit.html (files from https://poly.pizza/bundle/Ultimate-Space-Kit-YWh743lqGX) | CC0 1.0 (public domain), credit not required. Credit: Quaternius. Modified: atlas colors baked into vertex colors and mapped to the colony palette, rover decimated to 25 %. |
| `kit-colonia.glb` | Craftpix, "Space Colony" kit (Main_house, Main_house_2lv, Home_colonists, Research_center, Resource_warehouse, Connecting_gateway, Section, Farm), https://craftpix.net/ | Craftpix license: use in projects allowed, credit not required. **Pending decision before merge:** the license does not allow redistributing the source files, and this repository is public. |
| `panel-solar.glb` | Craftpix, "Space Colony" kit, `Solar_panel.fbx`, https://craftpix.net/ | Same as above. **Pending decision before merge** (flagged in PR #452). |

The Perseverance rover in the scene is not a file: it is a low poly model drawn in code (`ui/src/escena/activos/perseverance.ts`), following the shape of NASA's "Mars 2020 Perseverance Rover" from NASA 3D Resources (credit: NASA/JPL-Caltech). No NASA insignia or logo is used.

Processing (Blender 5.3, `ui/scripts/modelos/construir_modelos.py`):

- Tall Dish (2026-11-17): the three parts joined, the dish decimated to 40 % (budget: 6,102 triangles in total), tilted 35 degrees, scaled to 5 m high. Its DDS texture is not embedded in the GLB, so it uses a plain material. The footing, relay mast and red light are drawn in code (`ui/src/escena/activos/modelosModulos.ts`).
- Solar panel (2026-11-17): the Craftpix palette replaced by three materials (cells, frame, dark parts), chosen by the UV band of each face. Scaled to 0.7 (2.9 m high, 2,588 triangles). Dust on the cells is a material change in code, not a texture.
- Space Colony kit (2026-11-17): one mesh per piece, heavy pieces decimated (50 to 75 %), no materials (the scene uses one material with the kit palette and dust in code).
- CC BY models (2026-11-18): habitat 7.6 m wide (1,212 triangles), communications tower 6.4 m (1,343), recycler 2.9 m (1,830), arrival capsule 4.8 m high (3,344).
- Quaternius (2026-11-18): eight pieces in one GLB, one mesh each, 7,798 triangles in total (rover 1,836).
- Ingenuity (2026-11-18): NASA materials replaced by flat NASA colors in vertex colors, decimated to 25 % (2,280 triangles), rotors kept as separate meshes so the scene can spin them.

The NASA Habitat Demonstration Unit was tried for the habitat and dropped (it did not read as a shelter from the start camera); it is not shipped.
