<!-- Fuente: https://api.nasa.gov/ (assets/json/apis.json, «NASA Image and Video Library») · Dueño: NASA · Consultado: 2026-11-14 · Copia estática, no en vivo -->

# NASA Image and Video Library

Use this API to access the NASA Image and Video Library site at [images.nasa.gov](https://images.nasa.gov/#/). For the latest documentation, please go [here](https://images.nasa.gov/docs/images.nasa.gov_api_docs.pdf).

The images.nasa.gov API is organized around REST, has predictable/resource­-oriented URLs and uses HTTP response codes to indicate API errors. This API uses built-­in HTTP features such as HTTP authentication and HTTP verbs, which are understood by many off-­the-­shelf HTTP clients. Please note that JSON is returned by all API responses, including errors. Each of the endpoints described below also contains example snippets which use the curl command­-line tool, Unix pipelines, and the python command­-line tool to output API responses in an easy­ to ­read format.

## Available Endpoints

The images API contains 4 endpoints  `GET https://images-api.nasa.gov`

### Endpoints

| Endpoint | Description |
| --- | --- |
| GET /search?q={q} | Performing a search |
| --- | --- |
| GET /asset/{nasa\_id} | Retrieving a media asset’s manifest |
| GET /metadata/{nasa\_id} | Retrieving a media asset’s metadata location |
| GET /captions/{nasa\_id} | Retrieving a video asset’s captions location |

For complete usage information and detailed examples, please visit the [NASA Image and Video Library API documentation](https://images.nasa.gov/docs/images.nasa.gov_api_docs.pdf).
