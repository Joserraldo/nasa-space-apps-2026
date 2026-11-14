<!-- Fuente: https://api.nasa.gov/ · Dueño: NASA · Consultado: 2026-11-14 con Claude in Chrome (la página se arma con JavaScript; Scrapling solo vio 57 caracteres) · Copia estática, no en vivo -->

# NASA Open APIs (notas de lo leído)
- Aviso en la portada: la API de APOD ahora sale de science.nasa.gov (`wp-json/wp/v2/apod-basic`) y la vieja se archiva el 1 dic 2026; la Earth API se reemplazó por Earthdata GIBS; **la API de Mars Rover fue archivada** (explica el 404 de `fuentes.md` §0b).
- Límites documentados: 1000 peticiones/hora por clave (por defecto; nuestra clave recibe `X-RateLimit-Limit: 2500`, ver `fuentes.md` §0); DEMO_KEY 30/hora y 50/día por IP. Contador por hora móvil.
- Catálogo: APOD, Asteroids NeoWs, DONKI, EONET, EPIC, Exoplanet, GIBS, InSight, NASA Image and Video Library, Open Science Data Repository, Satellite Situation Center, SSD/CNEOS, Techport, TechTransfer, TLE API y **Vesta/Moon/Mars Trek WMTS** ("A Web Map Tile Service for the Vesta, Moon, and Mars Trek imagery projects").
