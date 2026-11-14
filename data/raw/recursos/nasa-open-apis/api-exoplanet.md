<!-- Fuente: https://api.nasa.gov/ (assets/json/apis.json, «Exoplanet») · Dueño: NASA · Consultado: 2026-11-14 · Copia estática, no en vivo -->

# Exoplanet Archive

## Introduction

The Exoplanet Archive API allows programatic access to [NASA's Exoplanet Archive](https://exoplanetarchive.ipac.caltech.edu/index.html) database. This API contains a ton of options so to get started please visit [this page](https://exoplanetarchive.ipac.caltech.edu/docs/program_interfaces.html) for introductory materials. To see [what data](https://exoplanetarchive.ipac.caltech.edu/docs/data.html) is available in this API [visit here](https://exoplanetarchive.ipac.caltech.edu/docs/program_interfaces.html#data) and also be sure to check out [best-practices and troubleshooting](https://exoplanetarchive.ipac.caltech.edu/docs/program_interfaces.html#troubleshoot) in case you get stuck. Happy planet hunting!

![](https://exoplanetarchive.ipac.caltech.edu/images/news/news-image-generic-transit.jpg)

## Example Queries

| Example API | URL |
| --- | --- |
| [Confirmed planets in the Kepler field](https://exoplanetarchive.ipac.caltech.edu/cgi-bin/nstedAPI/nph-nstedAPI?&table=exoplanets&format=ipac&where=pl_kepflag=1) | <https://exoplanetarchive.ipac.caltech.edu/cgi-bin/nstedAPI/nph-nstedAPI?&table=exoplanets&format=ipac&where=pl_kepflag=1> |
| [Confirmed planets that transit their host stars](https://exoplanetarchive.ipac.caltech.edu/cgi-bin/nstedAPI/nph-nstedAPI?&table=exoplanets&format=ipac&where=pl_tranflag=1) | <https://exoplanetarchive.ipac.caltech.edu/cgi-bin/nstedAPI/nph-nstedAPI?&table=exoplanets&format=ipac&where=pl_tranflag=1> |
| [All planetary candidates smaller than 2Re with equilibrium temperatures between 180-303K](https://exoplanetarchive.ipac.caltech.edu/cgi-bin/nstedAPI/nph-nstedAPI?table=cumulative&where=koi_prad<2 and koi_teq>180 and koi_teq<303 and koi_disposition like 'CANDIDATE') | <https://exoplanetarchive.ipac.caltech.edu/cgi-bin/nstedAPI/nph-nstedAPI?table=cumulative&where=koi_prad<2 and koi_teq>180 and koi_teq<303 and koi_disposition like 'CANDIDATE'> |

[More examples here.](https://exoplanetarchive.ipac.caltech.edu/docs/API_queries.html)
