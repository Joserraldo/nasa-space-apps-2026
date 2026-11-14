<!-- Fuente: https://api.nasa.gov/ (assets/json/apis.json, «SSD/CNEOS») · Dueño: NASA · Consultado: 2026-11-14 · Copia estática, no en vivo -->

# SSD/CNEOS

Welcome to JPL’s [SSD](http://ssd.jpl.nasa.gov/) (Solar System Dynamics) and [CNEOS](http://cneos.jpl.nasa.gov) (Center for Near-Earth Object Studies) API (Application Program Interface) service. This service provides an interface to machine-readable data ([JSON](http://www.json.org/)-format) related to [SSD](http://ssd.jpl.nasa.gov) and [CNEOS](http://cneos.jpl.nasa.gov).If you are looking for human-readable data, please go to the main websites for [SSD](http://ssd.jpl.nasa.gov/) and/or [CNEOS](http://cneos.jpl.nasa.gov/). For further information on this API and its component services, please visit the [JPL SSD/CNEOS API](http://ssd-api.jpl.nasa.gov/) main website or contact [contact-ssd-api@jpl.nasa.gov](mailto:contact-ssd-api@jpl.nasa.gov).

This API consists of the following component services:

| API | Description |
| --- | --- |
| [CAD](#CAD) | Asteroid and comet close approaches to the planets in the past and future |
| [Fireball](#Fireball) | Fireball atmospheric impact data reported by US Government sensors |
| [Mission Design](#MissionDesign) | Mission Design - Small-body mission design suite |
| [NHATS](#NHATS) | Human-accessible NEOs data |
| [Scout](#Scout) | NEOCP orbits, ephemerides, and impact risk data |
| [Sentry](#Sentry) | NEO Earth impact risk assessment data |

## CAD

This API provides access to current close-approach data for all asteroids and comets in JPL’s [SBDB](http://ssd.jpl.nasa.gov/sbdb.cgi) (Small-Body DataBase). Defaults for query parameters are setup for a typical CNEOS web-site search: NEO Earth close-approaches less than 0.05 au in the next 60 days sorted by date.

For complete API documentation please visit the [JPL SBDB Close-Approach Data API](http://ssd-api.jpl.nasa.gov/doc/cad.html) website.

## Fireball

The fireball data API provides a method of requesting specific records from the available data-set. Every successful query will return content representing one or more fireball data records. See the CNEOS page on [fireballs](http://cneos.jpl.nasa.gov/fireballs/) for details on this data-set.

For complete API documentation please visit the [JPL Fireball Data API](http://ssd-api.jpl.nasa.gov/doc/fireball.html) website.

## Mission Design

This API provides access to the JPL/SSD small-body mission design suite. Please see the [Mission Design web-page](https://ssd-api.jpl.nasa.gov/doc/mdesign.html) for details about Mission Design.

For complete API documentation please visit the [JPL Mission Design API](https://ssd-api.jpl.nasa.gov/doc/mdesign.html) website.

## NHATS

The NHATS API provides a method of requesting data from the NHATS-related tables in the SBDB. These data will primarily support the CNEOS “Accessible NEAs” web-page. Please see the [NHATS web-page](http://cneos.jpl.nasa.gov/nhats/) for details about NHATS.

For complete API documentation please visit the [JPL NHATS API](http://ssd-api.jpl.nasa.gov/doc/nhats.html) website.

## Scout

This API provides access to near-realtime results from the CNEOS Scout system. Various query modes provide access to available subsets of data. Please see the [Scout web-page](https://ssd-api.jpl.nasa.gov/doc/scout.html) for details about Scout.

For complete API documentation please visit the [JPL Scout API](https://ssd-api.jpl.nasa.gov/doc/scout.html) website.

## Sentry

This API provides access to results from the [CNEOS Sentry system](http://cneos.jpl.nasa.gov/risk/). There are various "modes" used to obtain desired data. \* `O` - object-specific details table \* `S` - summary table \* `V` - VI (virtual impactor) table \* `R` - removed-objects table

For complete API documentation please visit the [JPL Sentry API](http://ssd-api.jpl.nasa.gov/doc/sentry.html) website.
