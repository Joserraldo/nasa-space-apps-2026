<!-- Fuente: https://api.nasa.gov/ (assets/json/apis.json, «APOD») · Dueño: NASA · Consultado: 2026-11-14 · Copia estática, no en vivo -->

# APOD

One of the most popular websites at NASA is the [Astronomy Picture of the Day](http://apod.nasa.gov/apod/astropix.html). In fact, this website is one of the [most popular websites](https://analytics.usa.gov) across all federal agencies. It has the popular appeal of a Justin Bieber video. This endpoint structures the APOD imagery and associated metadata so that it can be repurposed for other applications.

As of September 10, 2026 this API has been migrated to use the new WordPress API  
The full documentation for the legacy API can be found in the [APOD API Github repository](https://github.com/nasa/apod-api)  
The documentation for the new API can be found here: [APOD WordPress](assets/files/apod/APOD-APIs-and-RSS-info.pdf)  
The legacy APOD API will be taken offline December 1, 2026. You will need to migrate by then.

**Example image:**

![](assets/img/general/apod.jpg)

### HTTP Request

`GET https://science.nasa.gov/wp-json/wp/v2/apod-basic`

**concept\_tags, hd, and thumbs are now disabled in this service.**

### Query Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| date | YYYY-MM-DD | *today* | The date of the APOD image to retrieve |
| start\_date | YYYY-MM-DD | none | The start of a date range, when requesting date for a range of dates. Cannot be used with `date`. |
| end\_date | YYYY-MM-DD | *today* | The end of the date range, when used with `start_date`. |
| count | int | none | If this is specified then `count` randomly chosen images will be returned. Cannot be used with `date` or `start_date` and `end_date`. Cannot exceed 25. |
| api\_key | string | DEMO\_KEY | api.nasa.gov key for expanded usage |

### Example query

[`https://science.nasa.gov/wp-json/wp/v2/apod-basic/?api_key=DEMO_KEY`](https://science.nasa.gov/wp-json/wp/v2/apod-basic/?api_key=DEMO_KEY)

### Example response

{  
"date": "2026-09-11",  
"post\_id": 1308668,  
"title": "M83: The Southern Pinwheel",  
"permalink": "https://science.nasa.gov/image-article/apod-2026-september-11-m83-the-southern-pinwheel/",  
"media\_type": "image",  
"explanation": "Detailed Explanation",  
"credit": "Aldo Zanetti",  
"copyright": "Aldo Zanetti",  
"alt": "A spiral galaxy is shown in front of a dark field of stars.",  
"url": "https://science.nasa.gov/image-article/apod-2026-september-11-m83-the-southern-pinwheel/",  
"hdurl": "https://assets.science.nasa.gov/dynamicimage/assets/science/cds/apod/apod/2026/september/M83\_Final2\_1x.jpg?w=3828&h=3798&fit=clip&crop=faces%2Cfocalpoint",  
"basic\_html": "HTML of the page",  
"basic\_html\_url": "https://science.nasa.gov/wp-json/wp/v2/apod-basic/260911/html"  
}
