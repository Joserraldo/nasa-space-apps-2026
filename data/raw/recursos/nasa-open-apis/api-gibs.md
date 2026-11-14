<!-- Fuente: https://api.nasa.gov/ (assets/json/apis.json, «GIBS») · Dueño: NASA · Consultado: 2026-11-14 · Copia estática, no en vivo -->

# Global Imagery Browse Services (GIBS)

NASA's Global Imagery Browse Services ([GIBS](https://www.earthdata.nasa.gov/engage/open-data-services-software/earthdata-developer-portal/gibs-api)) are designed to deliver global, full-resolution satellite imagery to users in a highly responsive manner, enabling visual discovery of scientific phenomena, supporting timely decision-making for natural hazards, educating the next generation of scientists, and making imagery of the planet more accessible to the media and public. GIBS provides quick access to over 1,000 satellite imagery products, covering every part of the world. Most imagery is updated daily - available within a few hours after satellite observation, and some products span almost 30 years. The satellite imagery can be rendered in your own web client or GIS application. Browse these visualizations through our [Worldview](https://worldview.earthdata.nasa.gov/) application, and see the [Worldview Image of the Week archive](https://www.earthdata.nasa.gov/news/worldview-image-archive) to learn how these visualizations can be used. GIBS and Worldview are part of the [Earth Science Data Systems Program](https://www.earthdata.nasa.gov/) which provides open access to NASA’s archive of Earth science data.

GIBS provides access through four mechanisms:

* An Open Geospatial Consortium (OGC) Web Map Tile Service (WMTS) that supports key-value-pair and Representational State Transfer (REST)ful tiled requests
* An OGC Web Map Service (WMS) that supports a key-value-pair non-tiled requests
* A Tiled Web Map Service (TWMS), an unofficial extension to the OGC WMS, that supports key-value-pair tiled requests that match the exact geographic tile boundaries
* Script-level access through the Geospatial Data Abstraction Library (GDAL)

Imagery is provided in several map projections:

* Geographic / Equirectangular (EPSG:4326)
* Web Mercator (EPSG:3857)
* Arctic Polar Stereographic (EPSG:3413)
* Antarctic Polar Stereographic (EPSG:3031)

Access to GIBS via the protocols above is explained in the links below. In addition, source code for the GIBS tiled imagery server and tiled imagery storage format is also available.

* [GIBS API for Developers](https://nasa-gibs.github.io/gibs-api-docs/)
* [GIBS Visualization Product Catalog](https://nasa-gibs.github.io/gibs-api-docs/available-visualizations/#visualization-product-catalog)
* [Geographic Information System (GIS) Usage](https://nasa-gibs.github.io/gibs-api-docs/gis-usage/)
* [Map Library Usage](https://nasa-gibs.github.io/gibs-api-docs/map-library-usage/)
* [Source Code and Live Examples of GIBS Demo Clients](https://github.com/nasa-gibs/gibs-web-examples)

**Sample visualizations:**

![](assets/img/general/global_suomi_NPP.png)

[Global Suomi NPP / VIIRS Corrected Reflectance from 2024 March 16](https://worldview.earthdata.nasa.gov/?v=-265.59765955813896,-143.60737116603906,186.63761513999117,132.96626790554467&l=Reference_Labels_15m(hidden),Reference_Features_15m(hidden),Coastlines_15m(hidden),VIIRS_NOAA20_CorrectedReflectance_TrueColor(hidden),VIIRS_SNPP_CorrectedReflectance_TrueColor,MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor(hidden)&lg=true&t=2024-03-16-T21%3A11%3A38Z)

![](assets/img/general/harmonized_landsat_sentinel-2.png)

[Harmonized Landsat Sentinel-2 Reflectance of Dubai, UAE from 2023 November 27](https://worldview.earthdata.nasa.gov/?v=54.6035527847883,24.770385014497798,55.63446196112994,25.395336458826293&l=Reference_Labels_15m(hidden),Reference_Features_15m(hidden),Coastlines_15m(hidden),HLS_S30_Nadir_BRDF_Adjusted_Reflectance(hidden),HLS_L30_Nadir_BRDF_Adjusted_Reflectance,VIIRS_NOAA20_CorrectedReflectance_TrueColor(hidden),VIIRS_SNPP_CorrectedReflectance_TrueColor(hidden),MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor(hidden)&lg=true&t=2023-11-27-T21%3A11%3A44Z)

![](assets/img/general/US_nighttime_lights.jpg)

[US Nighttime lights imagery from NOAA-20 / VIIRS Black Marble, 2025 June 22](https://worldview.earthdata.nasa.gov/?v=-136.79031479180293,5.904366166378928,-64.81047312001675,55.412452389412344&l=Reference_Labels_15m(hidden),Reference_Features_15m(hidden),Coastlines_15m,VIIRS_NOAA20_DayNightBand_At_Sensor_Radiance,VIIRS_NOAA20_DayNightBand_AtSensor_M15(hidden),VIIRS_SNPP_CorrectedReflectance_TrueColor(hidden)&lg=true&t=2025-06-22-T20%3A19%3A34Z)

![](assets/img/general/cyclone_jasper.png)

[Precipitation from Tropical Cyclone Jasper on 2023 December 13](https://worldview.earthdata.nasa.gov/?v=95.33363635096246,-44.95571703178746,166.20094325865375,-1.9949724540757572&l=Reference_Labels_15m(hidden),Reference_Features_15m,Coastlines_15m(hidden),IMERG_Precipitation_Rate,VIIRS_SNPP_DayNightBand_ENCC(hidden),VIIRS_SNPP_DayNightBand_At_Sensor_Radiance(hidden),VIIRS_SNPP_DayNightBand_AtSensor_M15(hidden),BlueMarble_NextGeneration(hidden),VIIRS_NOAA20_CorrectedReflectance_TrueColor(hidden),VIIRS_SNPP_CorrectedReflectance_TrueColor,MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor&lg=true&t=2023-12-13-T00%3A00%3A00Z)
