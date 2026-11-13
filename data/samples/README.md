# samples/ — respuestas reales de DONKI (recortadas)

Consultadas el **2026-11-13** desde un script (no desde el navegador). Se guardan solo unos registros por endpoint, sin modificar sus campos. Sirven para comprobar que los esquemas de `src/donki.ts` coinciden con lo que DONKI devuelve de verdad.

| Archivo | Consulta | Registros guardados |
|---|---|---|
| `donki-flr-2024-05.json` | `https://ccmc.gsfc.nasa.gov/DONKI-API/get/FLR?startDate=2024-05-08&endDate=2024-05-15` | X3.9 del 10 may y X8.7 del 14 may (de 98) |
| `donki-cme-2024-05.json` | `https://api.nasa.gov/DONKI/CME?startDate=2024-05-08&endDate=2024-05-09` | la primera (de 6) |
| `donki-gst-2024-05.json` | `https://api.nasa.gov/DONKI/GST?startDate=2024-05-09&endDate=2024-05-13` | las 2 |
| `donki-sep-2024-05.json` | `https://api.nasa.gov/DONKI/SEP?startDate=2024-05-08&endDate=2024-05-20` | la primera (de 14) |

Lo que aprendimos al probar:
- **FLR en api.nasa.gov da 404** (el proxy llama a `/DONKI-API/get/FLR/` y falla). CME, GST y SEP sí funcionan allí. El servicio directo de CCMC `https://ccmc.gsfc.nasa.gov/DONKI-API/get/FLR` responde 200 **sin clave**.
- **CORS:** los dos servicios devuelven `Access-Control-Allow-Origin: *`. Aun así, el navegador **no** llama a la API: el juego usa JSON precargados.
- **Límite:** con clave personal, `X-RateLimit-Limit: 2500` por hora. La documentación de terceros decía 1000; prevalece lo observado.
- **Campos FLR reales:** `flrID, catalog, instruments[].displayName, beginTime, peakTime, endTime, classType, sourceLocation, activeRegionNum, note, link, linkedEvents, sentNotifications, submissionTime, versionId`.
- **Región activa:** DONKI usa 5 cifras (`13664`), mientras que NOAA la llama "AR 3664". Es la misma región.
- **Kp en GST:** la fuente de cada valor es `NOAA` (campo `source`), así que se atribuye a NOAA vía DONKI.
- La clave nunca aparece en estos archivos: la prueba lo comprueba.
