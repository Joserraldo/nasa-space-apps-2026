<!-- Fuente: https://api.nasa.gov/ (assets/json/apis.json, «Asteroids NeoWs») · Dueño: NASA · Consultado: 2026-11-14 · Copia estática, no en vivo -->

# Asteroids - NeoWs

NeoWs (Near Earth Object Web Service) is a RESTful web service for near earth Asteroid information. With NeoWs a user can: search for Asteroids based on their closest approach date to Earth, lookup a specific Asteroid with its NASA JPL small body id, as well as browse the overall data-set.

Data-set: All the data is from the NASA JPL Asteroid team (http://neo.jpl.nasa.gov/).

This API is maintained by [SpaceRocks Team: David Greenfield, Arezu Sarvestani, Jason English and Peter Baunach](https://github.com/SpaceRocks/).

## Neo - Feed

Retrieve a list of Asteroids based on their closest approach date to Earth.  `GET https://api.nasa.gov/neo/rest/v1/feed?start_date=START_DATE&end_date=END_DATE&api_key=API_KEY`

### Query Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| start\_date | YYYY-MM-DD | none | Starting date for asteroid search |
| end\_date | YYYY-MM-DD | 7 days after start\_date | Ending date for asteroid search |
| api\_key | string | DEMO\_KEY | api.nasa.gov key for expanded usage |

### Example query

[`https://api.nasa.gov/neo/rest/v1/feed?start_date=2015-09-07&end_date=2015-09-08&api_key=DEMO_KEY`](https://api.nasa.gov/neo/rest/v1/feed?start_date=2015-09-07&end_date=2015-09-08&api_key=DEMO_KEY)

## Neo - Lookup

Lookup a specific Asteroid based on its [NASA JPL small body (SPK-ID) ID](http://ssd.jpl.nasa.gov/sbdb_query.cgi)  `GET https://api.nasa.gov/neo/rest/v1/neo/`

### Path Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| asteroid\_id | int | none | Asteroid SPK-ID correlates to the NASA JPL small body |
| --- | --- | --- | --- |
| api\_key | string | DEMO\_KEY | api.nasa.gov key for expanded usage |

### Example query

[`https://api.nasa.gov/neo/rest/v1/neo/3542519?api_key=DEMO_KEY`](https://api.nasa.gov/neo/rest/v1/neo/3542519?api_key=DEMO_KEY)

## Neo - Browse

Browse the overall Asteroid data-set  `GET https://api.nasa.gov/neo/rest/v1/neo/browse/`

### Example query

[`https://api.nasa.gov/neo/rest/v1/neo/browse?api_key=DEMO_KEY`](https://api.nasa.gov/neo/rest/v1/neo/browse?api_key=DEMO_KEY)
